import { BoundingBox, Matrix } from "@oasis-engine/math";
import { Logger } from "../base/Logger";
import { ignoreClone } from "../clone/CloneManager";
import { Entity } from "../Entity";
import { RendererUpdateFlags } from "../Renderer";
import { RenderContext } from "../RenderPipeline/RenderContext";
import { Shader } from "../shader";
import { TextureFilterMode } from "../texture/enums/TextureFilterMode";
import { TextureFormat } from "../texture/enums/TextureFormat";
import { Texture2D } from "../texture/Texture2D";
import { MeshRenderer } from "./MeshRenderer";
import { ModelMesh } from "./ModelMesh";
import { Skin } from "./Skin";

/**
 * SkinnedMeshRenderer.
 */
export class SkinnedMeshRenderer extends MeshRenderer {
  private static _tempMatrix = new Matrix();
  private static _jointCountProperty = Shader.getPropertyByName("u_jointCount");
  private static _jointSamplerProperty = Shader.getPropertyByName("u_jointSampler");
  private static _jointMatrixProperty = Shader.getPropertyByName("u_jointMatrix");
  private static _maxJoints: number = 0;

  private static _matrixMultiply(
    left: Matrix,
    re: Float32Array,
    rOffset: number,
    oe: Float32Array,
    offset: number
  ): void {
    const le = left.elements;

    // prettier-ignore
    const l11 = le[0], l12 = le[1], l13 = le[2], l14 = le[3],
    l21 = le[4], l22 = le[5], l23 = le[6], l24 = le[7],
    l31 = le[8], l32 = le[9], l33 = le[10], l34 = le[11],
    l41 = le[12], l42 = le[13], l43 = le[14], l44 = le[15];

    // prettier-ignore
    const r11 = re[rOffset], r12 = re[rOffset + 1], r13 = re[rOffset + 2], r14 = re[rOffset + 3],
    r21 = re[rOffset + 4], r22 = re[rOffset + 5], r23 = re[rOffset + 6], r24 = re[rOffset + 7],
    r31 = re[rOffset + 8], r32 = re[rOffset + 9], r33 = re[rOffset + 10], r34 = re[rOffset + 11],
    r41 = re[rOffset + 12], r42 = re[rOffset + 13], r43 = re[rOffset + 14], r44 = re[rOffset + 15];

    oe[offset] = l11 * r11 + l21 * r12 + l31 * r13 + l41 * r14;
    oe[offset + 1] = l12 * r11 + l22 * r12 + l32 * r13 + l42 * r14;
    oe[offset + 2] = l13 * r11 + l23 * r12 + l33 * r13 + l43 * r14;
    oe[offset + 3] = l14 * r11 + l24 * r12 + l34 * r13 + l44 * r14;

    oe[offset + 4] = l11 * r21 + l21 * r22 + l31 * r23 + l41 * r24;
    oe[offset + 5] = l12 * r21 + l22 * r22 + l32 * r23 + l42 * r24;
    oe[offset + 6] = l13 * r21 + l23 * r22 + l33 * r23 + l43 * r24;
    oe[offset + 7] = l14 * r21 + l24 * r22 + l34 * r23 + l44 * r24;

    oe[offset + 8] = l11 * r31 + l21 * r32 + l31 * r33 + l41 * r34;
    oe[offset + 9] = l12 * r31 + l22 * r32 + l32 * r33 + l42 * r34;
    oe[offset + 10] = l13 * r31 + l23 * r32 + l33 * r33 + l43 * r34;
    oe[offset + 11] = l14 * r31 + l24 * r32 + l34 * r33 + l44 * r34;

    oe[offset + 12] = l11 * r41 + l21 * r42 + l31 * r43 + l41 * r44;
    oe[offset + 13] = l12 * r41 + l22 * r42 + l32 * r43 + l42 * r44;
    oe[offset + 14] = l13 * r41 + l23 * r42 + l33 * r43 + l43 * r44;
    oe[offset + 15] = l14 * r41 + l24 * r42 + l34 * r43 + l44 * r44;
  }

  @ignoreClone
  private _hasInitJoints: boolean = false;
  @ignoreClone
  /** Whether to use joint texture. Automatically used when the device can't support the maximum number of bones. */
  private _useJointTexture: boolean = false;
  private _skin: Skin;
  @ignoreClone
  private _blendShapeWeights: Float32Array;
  @ignoreClone
  private _maxVertexUniformVectors: number;
  @ignoreClone
  private _rootBone: Entity;
  @ignoreClone
  private _localBounds: BoundingBox = new BoundingBox();
  @ignoreClone
  private _jointMatrixs: Float32Array;
  @ignoreClone
  private _jointTexture: Texture2D;
  @ignoreClone
  private _jointEntitys: Entity[];

  /** @internal */
  @ignoreClone
  _condensedBlendShapeWeights: Float32Array;

  /**
   * The weights of the BlendShapes.
   * @remarks Array index is BlendShape index.
   */
  get blendShapeWeights(): Float32Array {
    this._checkBlendShapeWeightLength();
    return this._blendShapeWeights;
  }

  set blendShapeWeights(value: Float32Array) {
    this._checkBlendShapeWeightLength();
    const blendShapeWeights = this._blendShapeWeights;
    if (value.length <= blendShapeWeights.length) {
      blendShapeWeights.set(value);
    } else {
      for (let i = 0, n = blendShapeWeights.length; i < n; i++) {
        blendShapeWeights[i] = value[i];
      }
    }
  }

  /**
   * Skin Object.
   */
  get skin(): Skin {
    return this._skin;
  }

  set skin(value: Skin) {
    if (this._skin !== value) {
      this._skin = value;
      this._hasInitJoints = false;
    }
  }

  /**
   * Local bounds.
   */
  get localBounds(): BoundingBox {
    return this._localBounds;
  }

  set localBounds(value: BoundingBox) {
    if (this._localBounds !== value) {
      this._localBounds.copyFrom(value);
    }
  }

  /**
   * Root bone.
   */
  get rootBone(): Entity {
    return this._rootBone;
  }

  set rootBone(value: Entity) {
    this._rootBone = value;
    this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
  }

  /**
   * @internal
   */
  constructor(entity: Entity) {
    super(entity);
    this._skin = null;

    const rhi = this.entity.engine._hardwareRenderer;
    let maxVertexUniformVectors = rhi.renderStates.getParameter(rhi.gl.MAX_VERTEX_UNIFORM_VECTORS);
    if (rhi.renderer === "Apple GPU") {
      // When uniform is large than 256, the skeleton matrix array access in shader very slow in Safari or WKWebview.
      // This may be a apple bug, Chrome and Firefox is OK!
      maxVertexUniformVectors = Math.min(maxVertexUniformVectors, 256);
    }
    this._maxVertexUniformVectors = maxVertexUniformVectors;

    this._onLocalBoundsChanged = this._onLocalBoundsChanged.bind(this);

    const localBounds = this._localBounds;
    // @ts-ignore
    localBounds.min._onValueChanged = this._onLocalBoundsChanged;
    // @ts-ignore
    localBounds.max._onValueChanged = this._onLocalBoundsChanged;
  }

  /**
   * @internal
   */
  update(): void {
    if (!this._hasInitJoints) {
      this._initJoints();
      this._hasInitJoints = true;
    }
    if (this._skin) {
      const ibms = this._skin.inverseBindMatrices;
      const worldToLocal = this._rootBone.getInvModelMatrix();
      const { _jointEntitys: joints, _jointMatrixs: jointMatrixs } = this;

      for (let i = joints.length - 1; i >= 0; i--) {
        const joint = joints[i];
        const offset = i * 16;
        if (joint) {
          SkinnedMeshRenderer._matrixMultiply(joint.transform.worldMatrix, ibms[i].elements, 0, jointMatrixs, offset);
        } else {
          jointMatrixs.set(ibms[i].elements, offset);
        }
        SkinnedMeshRenderer._matrixMultiply(worldToLocal, jointMatrixs, offset, jointMatrixs, offset);
      }
      if (this._useJointTexture) {
        this._createJointTexture();
      }
    }
  }

  /**
   * @override
   */
  protected _updateShaderData(context: RenderContext): void {
    const worldMatrix = this._rootBone ? this._rootBone.transform.worldMatrix : this.entity.transform.worldMatrix;
    this._updateTransformShaderData(context, worldMatrix);

    const shaderData = this.shaderData;
    if (!this._useJointTexture && this._jointMatrixs) {
      shaderData.setFloatArray(SkinnedMeshRenderer._jointMatrixProperty, this._jointMatrixs);
    }

    const mesh = <ModelMesh>this.mesh;
    mesh._blendShapeManager._updateShaderData(shaderData, this);
  }

  /**
   * @internal
   */
  _cloneTo(target: SkinnedMeshRenderer): void {
    super._cloneTo(target);
    this._blendShapeWeights && (target._blendShapeWeights = this._blendShapeWeights.slice());
  }

  /**
   * @override
   */
  protected _registerEntityTransformListener(): void {
    // Cancle register listener to entity transform.
  }

  /**
   * @override
   */
  protected _updateBounds(worldBounds: BoundingBox): void {
    if (this._rootBone) {
      const localBounds = this._localBounds;
      const worldMatrix = this._rootBone.transform.worldMatrix;
      BoundingBox.transform(localBounds, worldMatrix, worldBounds);
    } else {
      super._updateBounds(worldBounds);
    }
  }

  private _createJointTexture(): void {
    if (!this._jointTexture) {
      const engine = this.engine;
      const rhi = engine._hardwareRenderer;
      if (!rhi) return;
      this._jointTexture = new Texture2D(engine, 4, this._jointEntitys.length, TextureFormat.R32G32B32A32, false);
      this._jointTexture.filterMode = TextureFilterMode.Point;
      this.shaderData.enableMacro("O3_USE_JOINT_TEXTURE");
      this.shaderData.setTexture(SkinnedMeshRenderer._jointSamplerProperty, this._jointTexture);
    }
    this._jointTexture.setPixelBuffer(this._jointMatrixs);
  }

  private _initJoints(): void {
    const rhi = this.entity.engine._hardwareRenderer;
    if (!rhi) return;

    const { _skin: skin, shaderData } = this;
    if (!skin) {
      shaderData.disableMacro("O3_HAS_SKIN");
      return;
    }

    const joints = skin.joints;
    const jointCount = joints.length;
    const jointEntitys = new Array<Entity>(jointCount);
    for (let i = jointCount - 1; i >= 0; i--) {
      jointEntitys[i] = this._findByEntityName(this.entity, joints[i]);
    }
    this._jointEntitys = jointEntitys;
    this._jointMatrixs = new Float32Array(jointCount * 16);

    const lastRootBone = this._rootBone;
    const rootBone = this._findByEntityName(this.entity, skin.skeleton);

    lastRootBone && lastRootBone.transform._updateFlagManager.removeListener(this._onTransformChanged);
    rootBone.transform._updateFlagManager.addListener(this._onTransformChanged);

    const rootIndex = joints.indexOf(skin.skeleton);
    if (rootIndex !== -1) {
      BoundingBox.transform(this._mesh.bounds, skin.inverseBindMatrices[rootIndex], this._localBounds);
    } else {
      // Root bone is not in joints list,we can only use default pose compute local bounds
      // Default pose is slightly less accurate than bind pose
      const inverseRootBone = SkinnedMeshRenderer._tempMatrix;
      Matrix.invert(rootBone.transform.worldMatrix, inverseRootBone);
      BoundingBox.transform(this._mesh.bounds, inverseRootBone, this._localBounds);
    }

    this._rootBone = rootBone;

    const maxJoints = Math.floor((this._maxVertexUniformVectors - 30) / 4);

    if (jointCount) {
      shaderData.enableMacro("O3_HAS_SKIN");
      shaderData.setInt(SkinnedMeshRenderer._jointCountProperty, jointCount);
      if (jointCount > maxJoints) {
        if (rhi.canIUseMoreJoints) {
          this._useJointTexture = true;
        } else {
          Logger.error(
            `component's joints count(${jointCount}) greater than device's MAX_VERTEX_UNIFORM_VECTORS number ${this._maxVertexUniformVectors}, and don't support jointTexture in this device. suggest joint count less than ${maxJoints}.`,
            this
          );
        }
      } else {
        const maxJoints = Math.max(SkinnedMeshRenderer._maxJoints, jointCount);
        SkinnedMeshRenderer._maxJoints = maxJoints;
        shaderData.disableMacro("O3_USE_JOINT_TEXTURE");
        shaderData.enableMacro("O3_JOINTS_NUM", maxJoints.toString());
      }
    } else {
      shaderData.disableMacro("O3_HAS_SKIN");
    }
  }

  private _findByEntityName(rootEnitity: Entity, name: string): Entity {
    if (!rootEnitity) {
      return null;
    }

    const result = rootEnitity.findByName(name);
    if (result) {
      return result;
    }

    return this._findByEntityName(rootEnitity.parent, name);
  }

  private _checkBlendShapeWeightLength(): void {
    const mesh = <ModelMesh>this._mesh;
    const newBlendShapeCount = mesh ? mesh.blendShapeCount : 0;
    const lastBlendShapeWeights = this._blendShapeWeights;
    if (lastBlendShapeWeights) {
      if (lastBlendShapeWeights.length !== newBlendShapeCount) {
        const newBlendShapeWeights = new Float32Array(newBlendShapeCount);
        if (newBlendShapeCount > lastBlendShapeWeights.length) {
          newBlendShapeWeights.set(lastBlendShapeWeights);
        } else {
          for (let i = 0, n = lastBlendShapeWeights.length; i < n; i++) {
            lastBlendShapeWeights[i] = newBlendShapeWeights[i];
          }
        }
        this._blendShapeWeights = newBlendShapeWeights;
      }
    } else {
      this._blendShapeWeights = new Float32Array(newBlendShapeCount);
    }
  }

  @ignoreClone
  private _onLocalBoundsChanged(): void {
    this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
  }
}
