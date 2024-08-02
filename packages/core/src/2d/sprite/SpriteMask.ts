import { BoundingBox } from "@galacean/engine-math";
import { Entity } from "../../Entity";
import { RenderQueueFlags } from "../../RenderPipeline/BasicRenderPipeline";
import { BatchUtils } from "../../RenderPipeline/BatchUtils";
import { PrimitiveChunkManager } from "../../RenderPipeline/PrimitiveChunkManager";
import { RenderContext } from "../../RenderPipeline/RenderContext";
import { RenderElement } from "../../RenderPipeline/RenderElement";
import { SubPrimitiveChunk } from "../../RenderPipeline/SubPrimitiveChunk";
import { SubRenderElement } from "../../RenderPipeline/SubRenderElement";
import { Renderer, RendererUpdateFlags } from "../../Renderer";
import { assignmentClone, ignoreClone } from "../../clone/CloneManager";
import { ShaderProperty } from "../../shader/ShaderProperty";
import { SimpleSpriteAssembler } from "../assembler/SimpleSpriteAssembler";
import { SpriteMaskLayer } from "../enums/SpriteMaskLayer";
import { SpriteModifyFlags } from "../enums/SpriteModifyFlags";
import { Sprite } from "./Sprite";

/**
 * A component for masking Sprites.
 */
export class SpriteMask extends Renderer {
  /** @internal */
  static _textureProperty: ShaderProperty = ShaderProperty.getByName("renderer_MaskTexture");
  /** @internal */
  static _alphaCutoffProperty: ShaderProperty = ShaderProperty.getByName("renderer_MaskAlphaCutoff");

  /** The mask layers the sprite mask influence to. */
  @assignmentClone
  influenceLayers: number = SpriteMaskLayer.Everything;
  /** @internal */
  _renderElement: RenderElement;

  /** @internal */
  @ignoreClone
  _subChunk: SubPrimitiveChunk;
  /** @internal */
  @ignoreClone
  _maskIndex: number = -1;

  @ignoreClone
  private _sprite: Sprite = null;

  @ignoreClone
  private _automaticWidth: number = 0;
  @ignoreClone
  private _automaticHeight: number = 0;
  @assignmentClone
  private _customWidth: number = undefined;
  @assignmentClone
  private _customHeight: number = undefined;
  @assignmentClone
  private _flipX: boolean = false;
  @assignmentClone
  private _flipY: boolean = false;

  @assignmentClone
  private _alphaCutoff: number = 0.5;

  /**
   * Render width (in world coordinates).
   *
   * @remarks
   * If width is set, return the set value,
   * otherwise return `SpriteMask.sprite.width`.
   */
  get width(): number {
    if (this._customWidth !== undefined) {
      return this._customWidth;
    } else {
      this._dirtyUpdateFlag & SpriteMaskUpdateFlags.AutomaticSize && this._calDefaultSize();
      return this._automaticWidth;
    }
  }

  set width(value: number) {
    if (this._customWidth !== value) {
      this._customWidth = value;
      this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
    }
  }

  /**
   * Render height (in world coordinates).
   *
   * @remarks
   * If height is set, return the set value,
   * otherwise return `SpriteMask.sprite.height`.
   */
  get height(): number {
    if (this._customHeight !== undefined) {
      return this._customHeight;
    } else {
      this._dirtyUpdateFlag & SpriteMaskUpdateFlags.AutomaticSize && this._calDefaultSize();
      return this._automaticHeight;
    }
  }

  set height(value: number) {
    if (this._customHeight !== value) {
      this._customHeight = value;
      this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
    }
  }

  /**
   * Flips the sprite on the X axis.
   */
  get flipX(): boolean {
    return this._flipX;
  }

  set flipX(value: boolean) {
    if (this._flipX !== value) {
      this._flipX = value;
      this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
    }
  }

  /**
   * Flips the sprite on the Y axis.
   */
  get flipY(): boolean {
    return this._flipY;
  }

  set flipY(value: boolean) {
    if (this._flipY !== value) {
      this._flipY = value;
      this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
    }
  }

  /**
   * The Sprite to render.
   */
  get sprite(): Sprite {
    return this._sprite;
  }

  set sprite(value: Sprite | null) {
    const lastSprite = this._sprite;
    if (lastSprite !== value) {
      if (lastSprite) {
        this._addResourceReferCount(lastSprite, -1);
        lastSprite._updateFlagManager.removeListener(this._onSpriteChange);
      }
      this._dirtyUpdateFlag |= SpriteMaskUpdateFlags.All;
      if (value) {
        this._addResourceReferCount(value, 1);
        value._updateFlagManager.addListener(this._onSpriteChange);
        this.shaderData.setTexture(SpriteMask._textureProperty, value.texture);
      } else {
        this.shaderData.setTexture(SpriteMask._textureProperty, null);
      }
      this._sprite = value;
    }
  }

  /**
   * The minimum alpha value used by the mask to select the area of influence defined over the mask's sprite. Value between 0 and 1.
   */
  get alphaCutoff(): number {
    return this._alphaCutoff;
  }

  set alphaCutoff(value: number) {
    if (this._alphaCutoff !== value) {
      this._alphaCutoff = value;
      this.shaderData.setFloat(SpriteMask._alphaCutoffProperty, value);
    }
  }

  /**
   * @internal
   */
  constructor(entity: Entity) {
    super(entity);
    SimpleSpriteAssembler.resetData(this);
    this.setMaterial(this._engine._spriteMaskDefaultMaterial);
    this.shaderData.setFloat(SpriteMask._alphaCutoffProperty, this._alphaCutoff);
    this._renderElement = new RenderElement();
    this._renderElement.addSubRenderElement(new SubRenderElement());
    this._onSpriteChange = this._onSpriteChange.bind(this);
  }

  /**
   * @internal
   */
  override _updateTransformShaderData(context: RenderContext, onlyMVP: boolean, batched: boolean): void {
    //@todo: Always update world positions to buffer, should opt
    super._updateTransformShaderData(context, onlyMVP, true);
  }

  /**
   * @internal
   */
  override _cloneTo(target: SpriteMask, srcRoot: Entity, targetRoot: Entity): void {
    super._cloneTo(target, srcRoot, targetRoot);
    target.sprite = this._sprite;
  }

  /**
   * @internal
   */
  override _canBatch(elementA: SubRenderElement, elementB: SubRenderElement): boolean {
    return BatchUtils.canBatchSpriteMask(elementA, elementB);
  }

  /**
   * @internal
   */
  override _batch(elementA: SubRenderElement, elementB?: SubRenderElement): void {
    BatchUtils.batchFor2D(elementA, elementB);
  }

  /**
   * @internal
   */
  override _onEnableInScene(): void {
    super._onEnableInScene();
    this.scene._maskManager.addSpriteMask(this);
  }

  /**
   * @internal
   */
  override _onDisableInScene(): void {
    super._onDisableInScene();
    this.scene._maskManager.removeSpriteMask(this);
  }

  /**
   * @internal
   */
  _getChunkManager(): PrimitiveChunkManager {
    return this.engine._batcherManager.primitiveChunkManagerMask;
  }

  protected override _updateBounds(worldBounds: BoundingBox): void {
    if (this.sprite) {
      SimpleSpriteAssembler.updatePositions(this);
    } else {
      worldBounds.min.set(0, 0, 0);
      worldBounds.max.set(0, 0, 0);
    }
  }

  /**
   * @inheritdoc
   */
  protected override _render(context: RenderContext): void {
    if (!this.sprite?.texture || !this.width || !this.height) {
      return;
    }

    let material = this.getMaterial();
    if (!material) {
      return;
    }
    const { _engine: engine } = this;
    // @todo: This question needs to be raised rather than hidden.
    if (material.destroyed) {
      material = engine._spriteMaskDefaultMaterial;
    }

    // Update position
    if (this._dirtyUpdateFlag & RendererUpdateFlags.WorldVolume) {
      SimpleSpriteAssembler.updatePositions(this);
      this._dirtyUpdateFlag &= ~RendererUpdateFlags.WorldVolume;
    }

    // Update uv
    if (this._dirtyUpdateFlag & SpriteMaskUpdateFlags.UV) {
      SimpleSpriteAssembler.updateUVs(this);
      this._dirtyUpdateFlag &= ~SpriteMaskUpdateFlags.UV;
    }

    const renderElement = this._renderElement;
    const subRenderElement = renderElement.subRenderElements[0];
    renderElement.set(this.priority, this._distanceForSort);

    const subChunk = this._subChunk;
    subRenderElement.set(this, material, subChunk.chunk.primitive, subChunk.subMesh, this.sprite.texture, subChunk);
    subRenderElement.shaderPasses = material.shader.subShaders[0].passes;
    subRenderElement.renderQueueFlags = RenderQueueFlags.All;
    renderElement.addSubRenderElement(subRenderElement);
  }

  /**
   * @inheritdoc
   */
  protected override _onDestroy(): void {
    const sprite = this._sprite;
    if (sprite) {
      this._addResourceReferCount(sprite, -1);
      sprite._updateFlagManager.removeListener(this._onSpriteChange);
    }

    super._onDestroy();

    this._sprite = null;
    if (this._subChunk) {
      this._getChunkManager().freeSubChunk(this._subChunk);
      this._subChunk = null;
    }

    this._renderElement = null;
  }

  private _calDefaultSize(): void {
    const sprite = this._sprite;
    if (sprite) {
      this._automaticWidth = sprite.width;
      this._automaticHeight = sprite.height;
    } else {
      this._automaticWidth = this._automaticHeight = 0;
    }
    this._dirtyUpdateFlag &= ~SpriteMaskUpdateFlags.AutomaticSize;
  }

  @ignoreClone
  private _onSpriteChange(type: SpriteModifyFlags): void {
    switch (type) {
      case SpriteModifyFlags.texture:
        this.shaderData.setTexture(SpriteMask._textureProperty, this.sprite.texture);
        break;
      case SpriteModifyFlags.size:
        this._dirtyUpdateFlag |= SpriteMaskUpdateFlags.AutomaticSize;
        if (this._customWidth === undefined || this._customHeight === undefined) {
          this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
        }
        break;
      case SpriteModifyFlags.region:
      case SpriteModifyFlags.atlasRegionOffset:
        this._dirtyUpdateFlag |= SpriteMaskUpdateFlags.RenderData;
        break;
      case SpriteModifyFlags.atlasRegion:
        this._dirtyUpdateFlag |= SpriteMaskUpdateFlags.UV;
        break;
      case SpriteModifyFlags.pivot:
        this._dirtyUpdateFlag |= RendererUpdateFlags.WorldVolume;
        break;
      case SpriteModifyFlags.destroy:
        this.sprite = null;
        break;
      default:
        break;
    }
  }
}

/**
 * @remarks Extends `RendererUpdateFlag`.
 */
enum SpriteMaskUpdateFlags {
  /** UV. */
  UV = 0x2,
  /** WorldVolume and UV . */
  RenderData = 0x3,
  /** Automatic Size. */
  AutomaticSize = 0x4,
  /** All. */
  All = 0x7
}
