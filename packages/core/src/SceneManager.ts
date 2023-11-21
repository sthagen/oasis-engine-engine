import { Engine } from "./Engine";
import { Scene } from "./Scene";
import { AssetPromise } from "./asset/AssetPromise";
import { AssetType } from "./asset/AssetType";
import { SafeLoopArray } from "./utils/SafeLoopArray";

/**
 * Scene manager.
 */
export class SceneManager {
  /** @internal */
  _allCreatedScenes: Scene[] = [];
  /** @internal */
  _scenes: SafeLoopArray<Scene> = new SafeLoopArray<Scene>();

  /**
   * Get the scene list.
   */
  get scenes(): ReadonlyArray<Scene> {
    return this._scenes.getArray();
  }

  /**
   * @internal
   */
  constructor(public readonly engine: Engine) {}

  /**
   * Add scene.
   * @param scene - The scene which want to be added
   */
  addScene(scene: Scene): void;

  /**
   * Add scene at specified index.
   * @param index - specified index
   * @param child - The scene which want to be added
   */
  addScene(index: number, scene: Scene): void;

  addScene(indexOrScene: number | Scene, scene?: Scene): void {
    const scenes = this._scenes;

    let index: number;
    if (typeof indexOrScene === "number") {
      if (indexOrScene < 0 || indexOrScene > scenes.length) {
        throw "The index is out of range.";
      }
      index = indexOrScene;
    } else {
      index = scenes.length;
      scene = indexOrScene;
    }

    if (scene.engine !== this.engine) {
      throw "The scene is not belong to this engine.";
    }

    if (scene._sceneManager) {
      const currentIndex = scenes.indexOf(scene);
      if (currentIndex !== index) {
        scenes.removeByIndex(currentIndex);
        scenes.add(index, scene);
      }
    } else {
      scene._sceneManager = this;
      scenes.add(index, scene);
      scene.isActive && scene._processActive(true);
    }
  }

  /**
   * Remove scene.
   * @param scene - The scene which want to be removed
   */
  removeScene(scene: Scene): void {
    const scenes = this._scenes;
    const index = scenes.indexOf(scene);
    if (index !== -1) {
      const removedScene = scenes.getArray()[index];
      scenes.removeByIndex(index);
      scene._sceneManager = null;
      removedScene.isActive && removedScene._processActive(false);
    }
  }

  /**
   * Load and activate scene.
   * @param url - the path of the scene
   * @param destroyOldScene - whether to destroy old scene
   * @returns scene promise
   */
  loadScene(url: string, destroyOldScene: boolean = true): AssetPromise<Scene> {
    const scenePromise = this.engine.resourceManager.load<Scene>({ url, type: AssetType.Scene });
    scenePromise.then((scene: Scene) => {
      if (destroyOldScene) {
        const scenes = this._scenes.getArray();
        for (let i = 0, n = scenes.length; i < n; i++) {
          scenes[i].destroy();
        }
      }
      this.addScene(scene);
    });
    return scenePromise;
  }

  /**
   * Merge the source scene into the target scene.
   * @remarks the global information of destScene will be used after the merge, and the lightingMap information will be merged.
   * @param sourceScene - source scene
   * @param destScene - target scene
   */
  mergeScenes(sourceScene: Scene, destScene: Scene): void {
    const oldRootEntities = sourceScene.rootEntities;
    while (oldRootEntities.length > 0) {
      destScene.addRootEntity(oldRootEntities[0]);
    }
  }

  /**
   * @internal
   */
  _destroyAllScene(): void {
    const allCreatedScenes = this._allCreatedScenes;
    while (allCreatedScenes.length > 0) {
      allCreatedScenes[0].destroy();
    }
  }

  /**
   * @deprecated
   * Please use `scenes` instead.
   *
   * Get the first scene.
   */
  get activeScene(): Scene {
    return this._scenes.getArray()[0];
  }

  set activeScene(scene: Scene) {
    const firstScene = this.scenes[0];
    if (firstScene) {
      this.removeScene(firstScene);
    }
    scene && this.addScene(0, scene);
  }
}
