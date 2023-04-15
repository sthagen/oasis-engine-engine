import { Color, Vector3, Vector4 } from "@galacean/engine-math";
import { Background } from "./Background";
import { EngineObject, Logger } from "./base";
import { Camera } from "./Camera";
import { Engine } from "./Engine";
import { Entity } from "./Entity";
import { FogMode } from "./enums/FogMode";
import { Light } from "./lighting";
import { AmbientLight } from "./lighting/AmbientLight";
import { ShaderProperty } from "./shader";
import { ShaderDataGroup } from "./shader/enums/ShaderDataGroup";
import { ShaderData } from "./shader/ShaderData";
import { ShaderMacroCollection } from "./shader/ShaderMacroCollection";
import { ShadowCascadesMode } from "./shadow/enum/ShadowCascadesMode";
import { ShadowResolution } from "./shadow/enum/ShadowResolution";
import { ShadowType } from "./shadow/enum/ShadowType";

/**
 * Scene.
 */
export class Scene extends EngineObject {
  private static _fogColorProperty = ShaderProperty.getByName("scene_FogColor");
  private static _fogParamsProperty = ShaderProperty.getByName("scene_FogParams");
  private static _sunlightColorProperty = ShaderProperty.getByName("scene_SunlightColor");
  private static _sunlightDirectionProperty = ShaderProperty.getByName("scene_SunlightDirection");

  /** Scene name. */
  name: string;

  /** The background of the scene. */
  readonly background: Background = new Background(this._engine);
  /** Scene-related shader data. */
  readonly shaderData: ShaderData = new ShaderData(ShaderDataGroup.Scene);

  /** If cast shadows. */
  castShadows: boolean = true;
  /** The resolution of the shadow maps. */
  shadowResolution: ShadowResolution = ShadowResolution.Medium;
  /** The splits of two cascade distribution. */
  shadowTwoCascadeSplits: number = 1.0 / 3.0;
  /** The splits of four cascade distribution. */
  shadowFourCascadeSplits: Vector3 = new Vector3(1.0 / 15, 3.0 / 15.0, 7.0 / 15.0);
  /** Max Shadow distance. */
  shadowDistance: number = 50;

  /** @internal */
  _activeCameras: Camera[] = [];
  /** @internal */
  _isActiveInEngine: boolean = false;
  /** @internal */
  _globalShaderMacro: ShaderMacroCollection = new ShaderMacroCollection();
  /** @internal */
  _rootEntities: Entity[] = [];
  /** @internal */
  _sunLight: Light;

  private _shadowCascades: ShadowCascadesMode = ShadowCascadesMode.NoCascades;
  private _ambientLight: AmbientLight;
  private _fogMode: FogMode = FogMode.None;
  private _fogColor: Color = new Color(0.5, 0.5, 0.5, 1.0);
  private _fogStart: number = 0;
  private _fogEnd: number = 300;
  private _fogDensity: number = 0.01;
  private _fogParams: Vector4 = new Vector4();

  /**
   *  Number of cascades to use for directional light shadows.
   */
  get shadowCascades(): ShadowCascadesMode {
    return this._shadowCascades;
  }

  set shadowCascades(value: ShadowCascadesMode) {
    if (this._shadowCascades !== value) {
      this.shaderData.enableMacro("SCENE_SHADOW_CASCADED_COUNT", value.toString());
      this._shadowCascades = value;
    }
  }

  /**
   * Ambient light.
   */
  get ambientLight(): AmbientLight {
    return this._ambientLight;
  }

  set ambientLight(value: AmbientLight) {
    if (!value) {
      Logger.warn("The scene must have one ambient light");
      return;
    }

    const lastAmbientLight = this._ambientLight;
    if (lastAmbientLight !== value) {
      lastAmbientLight && lastAmbientLight._removeFromScene(this);
      value._addToScene(this);
      this._ambientLight = value;
    }
  }

  /**
   * Fog mode.
   * @remarks
   * If set to `FogMode.None`, the fog will be disabled.
   * If set to `FogMode.Linear`, the fog will be linear and controlled by `fogStart` and `fogEnd`.
   * If set to `FogMode.Exponential`, the fog will be exponential and controlled by `fogDensity`.
   * If set to `FogMode.ExponentialSquared`, the fog will be exponential squared and controlled by `fogDensity`.
   */
  get fogMode(): FogMode {
    return this._fogMode;
  }

  set fogMode(value: FogMode) {
    if (this._fogMode !== value) {
      this.shaderData.enableMacro("SCENE_FOG_MODE", value.toString());
      this._fogMode = value;
    }
  }

  /**
   * Fog color.
   */
  get fogColor(): Color {
    return this._fogColor;
  }

  set fogColor(value: Color) {
    if (this._fogColor !== value) {
      this._fogColor.copyFrom(value);
    }
  }

  /**
   * Fog start.
   */
  get fogStart(): number {
    return this._fogStart;
  }

  set fogStart(value: number) {
    if (this._fogStart !== value) {
      this._computeLinearFogParams(value, this._fogEnd);
      this._fogStart = value;
    }
  }

  /**
   * Fog end.
   */
  get fogEnd(): number {
    return this._fogEnd;
  }

  set fogEnd(value: number) {
    if (this._fogEnd !== value) {
      this._computeLinearFogParams(this._fogStart, value);
      this._fogEnd = value;
    }
  }

  /**
   * Fog density.
   */
  get fogDensity(): number {
    return this._fogDensity;
  }

  set fogDensity(value: number) {
    if (this._fogDensity !== value) {
      this._computeExponentialFogParams(value);
      this._fogDensity = value;
    }
  }

  /**
   * Count of root entities.
   */
  get rootEntitiesCount(): number {
    return this._rootEntities.length;
  }

  /**
   * Root entity collection.
   */
  get rootEntities(): Readonly<Entity[]> {
    return this._rootEntities;
  }

  /**
   * Create scene.
   * @param engine - Engine
   * @param name - Name
   */
  constructor(engine: Engine, name?: string) {
    super(engine);
    this.name = name || "";

    const shaderData = this.shaderData;
    shaderData._addReferCount(1);
    this.ambientLight = new AmbientLight();
    engine.sceneManager._allScenes.push(this);

    shaderData.enableMacro("SCENE_FOG_MODE", this._fogMode.toString());
    shaderData.enableMacro("SCENE_SHADOW_CASCADED_COUNT", this.shadowCascades.toString());
    shaderData.setColor(Scene._fogColorProperty, this._fogColor);
    shaderData.setVector4(Scene._fogParamsProperty, this._fogParams);

    this._computeLinearFogParams(this._fogStart, this._fogEnd);
    this._computeExponentialFogParams(this._fogDensity);
  }

  /**
   * Create root entity.
   * @param name - Entity name
   * @returns Entity
   */
  createRootEntity(name?: string): Entity {
    const entity = new Entity(this._engine, name);
    this.addRootEntity(entity);
    return entity;
  }

  /**
   * Append an entity.
   * @param entity - The root entity to add
   */
  addRootEntity(entity: Entity): void;

  /**
   * Append an entity.
   * @param index - specified index
   * @param entity - The root entity to add
   */
  addRootEntity(index: number, entity: Entity): void;

  addRootEntity(indexOrChild: number | Entity, entity?: Entity): void {
    let index: number;
    if (typeof indexOrChild === "number") {
      index = indexOrChild;
    } else {
      index = undefined;
      entity = indexOrChild;
    }

    const isRoot = entity._isRoot;
    // let entity become root
    if (!isRoot) {
      entity._isRoot = true;
      entity._removeFromParent();
    }

    // add or remove from scene's rootEntities
    const oldScene = entity._scene;
    if (oldScene !== this) {
      if (oldScene && isRoot) {
        oldScene._removeFromEntityList(entity);
      }
      this._addToRootEntityList(index, entity);
      Entity._traverseSetOwnerScene(entity, this);
    } else if (!isRoot) {
      this._addToRootEntityList(index, entity);
    }

    // process entity active/inActive
    if (this._isActiveInEngine) {
      !entity._isActiveInHierarchy && entity._isActive && entity._processActive();
    } else {
      entity._isActiveInHierarchy && entity._processInActive();
    }
  }

  /**
   * Remove an entity.
   * @param entity - The root entity to remove
   */
  removeRootEntity(entity: Entity): void {
    if (entity._isRoot && entity._scene == this) {
      this._removeFromEntityList(entity);
      entity._isRoot = false;
      this._isActiveInEngine && entity._isActiveInHierarchy && entity._processInActive();
      Entity._traverseSetOwnerScene(entity, null);
    }
  }

  /**
   * Get root entity from index.
   * @param index - Index
   * @returns Entity
   */
  getRootEntity(index: number = 0): Entity | null {
    return this._rootEntities[index];
  }

  /**
   * Find entity globally by name.
   * @param name - Entity name
   * @returns Entity
   */
  findEntityByName(name: string): Entity | null {
    const rootEntities = this._rootEntities;
    for (let i = 0, n = rootEntities.length; i < n; i++) {
      const entity = rootEntities[i].findByName(name);
      if (entity) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Find entity globally by name,use ‘/’ symbol as a path separator.
   * @param path - Entity's path
   * @returns Entity
   */
  findEntityByPath(path: string): Entity | null {
    const splits = path.split("/").filter(Boolean);
    for (let i = 0, n = this.rootEntitiesCount; i < n; i++) {
      let findEntity = this.getRootEntity(i);
      if (findEntity.name != splits[0]) continue;
      for (let j = 1, m = splits.length; j < m; ++j) {
        findEntity = Entity._findChildByName(findEntity, splits[j]);
        if (!findEntity) break;
      }
      return findEntity;
    }
    return null;
  }

  /**
   * Destroy this scene.
   */
  destroy(): void {
    if (this._destroyed) {
      return;
    }

    this._destroy();

    const allScenes = this.engine.sceneManager._allScenes;
    allScenes.splice(allScenes.indexOf(this), 1);
  }

  /**
   * @internal
   */
  _attachRenderCamera(camera: Camera): void {
    const index = this._activeCameras.indexOf(camera);
    if (index === -1) {
      this._activeCameras.push(camera);
    } else {
      Logger.warn("Camera already attached.");
    }
  }

  /**
   * @internal
   */
  _detachRenderCamera(camera: Camera): void {
    const index = this._activeCameras.indexOf(camera);
    if (index !== -1) {
      this._activeCameras.splice(index, 1);
    }
  }

  /**
   * @internal
   */
  _processActive(active: boolean): void {
    this._isActiveInEngine = active;
    const rootEntities = this._rootEntities;
    for (let i = rootEntities.length - 1; i >= 0; i--) {
      const entity = rootEntities[i];
      if (entity._isActive) {
        active ? entity._processActive() : entity._processInActive();
      }
    }
  }

  /**
   * @internal
   */
  _updateShaderData(): void {
    const shaderData = this.shaderData;
    const engine = this._engine;
    const lightManager = engine._lightManager;

    engine.time._updateSceneShaderData(shaderData);

    lightManager._updateShaderData(this.shaderData);

    const sunLightIndex = lightManager._getSunLightIndex();
    if (sunLightIndex !== -1) {
      const sunlight = lightManager._directLights.get(sunLightIndex);
      shaderData.setColor(Scene._sunlightColorProperty, sunlight.color);
      shaderData.setVector3(Scene._sunlightDirectionProperty, sunlight.direction);
      this._sunLight = sunlight;
    }

    if (this.castShadows && this._sunLight && this._sunLight.shadowType !== ShadowType.None) {
      shaderData.enableMacro("SCENE_SHADOW_TYPE", this._sunLight.shadowType.toString());
    } else {
      shaderData.disableMacro("SCENE_SHADOW_TYPE");
    }

    // union scene and camera macro.
    ShaderMacroCollection.unionCollection(
      this.engine._macroCollection,
      shaderData._macroCollection,
      this._globalShaderMacro
    );
  }

  /**
   * @internal
   */
  _removeFromEntityList(entity: Entity): void {
    const rootEntities = this._rootEntities;
    let index = entity._siblingIndex;
    rootEntities.splice(index, 1);
    for (let n = rootEntities.length; index < n; index++) {
      rootEntities[index]._siblingIndex--;
    }
    entity._siblingIndex = -1;
  }

  /**
   * @internal
   */
  _destroy(): void {
    this._isActiveInEngine && (this._engine.sceneManager.activeScene = null);
    while (this.rootEntitiesCount > 0) {
      this._rootEntities[0].destroy();
    }
    this._activeCameras.length = 0;
    this.shaderData._addReferCount(-1);
  }

  private _addToRootEntityList(index: number, rootEntity: Entity): void {
    const rootEntities = this._rootEntities;
    const rootEntityCount = rootEntities.length;
    if (index === undefined) {
      rootEntity._siblingIndex = rootEntityCount;
      rootEntities.push(rootEntity);
    } else {
      if (index < 0 || index > rootEntityCount) {
        throw `The index ${index} is out of child list bounds ${rootEntityCount}`;
      }
      rootEntity._siblingIndex = index;
      rootEntities.splice(index, 0, rootEntity);
      for (let i = index + 1, n = rootEntityCount + 1; i < n; i++) {
        rootEntities[i]._siblingIndex++;
      }
    }
  }

  private _computeLinearFogParams(fogStart: number, fogEnd: number): void {
    const fogRange = fogEnd - fogStart;
    const fogParams = this._fogParams;
    fogParams.x = -1 / fogRange;
    fogParams.y = fogEnd / fogRange;
  }

  private _computeExponentialFogParams(density: number) {
    this._fogParams.z = density / Math.LN2;
    this._fogParams.w = density / Math.sqrt(Math.LN2);
  }
}
