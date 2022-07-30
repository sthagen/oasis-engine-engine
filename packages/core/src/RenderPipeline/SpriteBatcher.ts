import { SpriteMaskInteraction } from "../2d/enums/SpriteMaskInteraction";
import { SpriteRenderer } from "../2d/sprite/SpriteRenderer";
import { Camera } from "../Camera";
import { Engine } from "../Engine";
import { VertexElementFormat } from "../graphic/enums/VertexElementFormat";
import { VertexElement } from "../graphic/VertexElement";
import { Shader } from "../shader/Shader";
import { ShaderMacroCollection } from "../shader/ShaderMacroCollection";
import { ShaderProperty } from "../shader/ShaderProperty";
import { Basic2DBatcher } from "./Basic2DBatcher";
import { SpriteElement } from "./SpriteElement";

/**
 * @internal
 */
export class SpriteBatcher extends Basic2DBatcher {
  private static _textureProperty: ShaderProperty = Shader.getPropertyByName("u_spriteTexture");

  createVertexElements(vertexElements: VertexElement[]): number {
    vertexElements[0] = new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0);
    vertexElements[1] = new VertexElement("TEXCOORD_0", 12, VertexElementFormat.Vector2, 0);
    vertexElements[2] = new VertexElement("COLOR_0", 20, VertexElementFormat.Vector4, 0);
    return 36;
  }

  canBatch(preElement: SpriteElement, curElement: SpriteElement): boolean {
    const preRenderer = <SpriteRenderer>preElement.component;
    const curRenderer = <SpriteRenderer>curElement.component;

    // Compare mask
    if (!this.checkBatchWithMask(preRenderer, curRenderer)) {
      return false;
    }

    // Compare texture
    if (preElement.texture !== curElement.texture) {
      return false;
    }

    // Compare material
    return preElement.material === curElement.material;
  }

  checkBatchWithMask(left: SpriteRenderer, right: SpriteRenderer): boolean {
    const leftMaskInteraction = left.maskInteraction;

    if (leftMaskInteraction !== right.maskInteraction) {
      return false;
    }
    if (leftMaskInteraction === SpriteMaskInteraction.None) {
      return true;
    }
    return left.maskLayer === right.maskLayer;
  }

  updateVertices(element: SpriteElement, vertices: Float32Array, vertexIndex: number): number {
    const { positions, uvs, color, vertexCount } = element.renderData;
    for (let i = 0; i < vertexCount; i++) {
      const curPos = positions[i];
      const curUV = uvs[i];
      vertices[vertexIndex++] = curPos.x;
      vertices[vertexIndex++] = curPos.y;
      vertices[vertexIndex++] = curPos.z;
      vertices[vertexIndex++] = curUV.x;
      vertices[vertexIndex++] = curUV.y;
      vertices[vertexIndex++] = color.r;
      vertices[vertexIndex++] = color.g;
      vertices[vertexIndex++] = color.b;
      vertices[vertexIndex++] = color.a;
    }

    return vertexIndex;
  }

  drawBatches(camera: Camera): void {
    const { _engine: engine, _batchedQueue: batchedQueue } = this;
    const mesh = this._meshes[this._flushId];
    const subMeshes = mesh.subMeshes;
    const maskManager = engine._spriteMaskManager;
    const sceneData = camera.scene.shaderData;
    const cameraData = camera.shaderData;

    for (let i = 0, len = subMeshes.length; i < len; i++) {
      const subMesh = subMeshes[i];
      const spriteElement = <SpriteElement>batchedQueue[i];

      if (!subMesh || !spriteElement) {
        return;
      }

      const renderer = <SpriteRenderer>spriteElement.component;
      const material = spriteElement.material;
      maskManager.preRender(camera, renderer);

      const compileMacros = Shader._compileMacros;
      // union render global macro and material self macro.
      ShaderMacroCollection.unionCollection(
        renderer._globalShaderMacro,
        material.shaderData._macroCollection,
        compileMacros
      );

      const program = material.shader._getShaderProgram(engine, compileMacros);
      if (!program.isValid) {
        return;
      }

      renderer.shaderData.setTexture(SpriteBatcher._textureProperty, spriteElement.texture);

      program.bind();
      program.groupingOtherUniformBlock();
      program.uploadAll(program.sceneUniformBlock, sceneData);
      program.uploadAll(program.cameraUniformBlock, cameraData);
      program.uploadAll(program.rendererUniformBlock, renderer.shaderData);
      program.uploadAll(program.materialUniformBlock, material.shaderData);

      material.renderState._apply(engine, false);

      engine._hardwareRenderer.drawPrimitive(mesh, subMesh, program);

      maskManager.postRender(renderer);
    }
  }

  destroy(): void {
    this._batchedQueue = null;

    const { _meshes: meshes, _vertexBuffers: vertexBuffers, _indiceBuffers: indiceBuffers } = this;

    for (let i = 0, n = meshes.length; i < n; ++i) {
      meshes[i].destroy();
    }
    this._meshes = null;

    for (let i = 0, n = vertexBuffers.length; i < n; ++i) {
      vertexBuffers[i].destroy();
    }
    this._vertexBuffers = null;

    for (let i = 0, n = indiceBuffers.length; i < n; ++i) {
      indiceBuffers[i].destroy();
    }
    this._indiceBuffers = null;
  }
}
