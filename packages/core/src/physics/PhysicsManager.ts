import { IPhysics, IPhysicsManager } from "@oasis-engine/design";
import { Ray, Vector3 } from "@oasis-engine/math";
import { Engine } from "../Engine";
import { Layer } from "../Layer";
import { Collider } from "./Collider";
import { HitResult } from "./HitResult";
import { ColliderShape } from "./shape/ColliderShape";

/**
 * A physics manager is a collection of bodies and constraints which can interact.
 */
export class PhysicsManager {
  /** @internal */
  static _nativePhysics: IPhysics;
  /** @internal */
  _initialized: boolean = false;

  private _engine: Engine;
  private _restTime: number = 0;

  private _gravity: Vector3 = new Vector3(0, -9.81, 0);
  private _nativePhysicsManager: IPhysicsManager;
  private _physicalObjectsMap: Record<number, ColliderShape> = {};
  private _onContactEnter = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionEnter(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionEnter(shape1);
    }
  };
  private _onContactExit = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionExit(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionExit(shape1);
    }
  };
  private _onContactStay = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionStay(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onCollisionStay(shape1);
    }
  };
  private _onTriggerEnter = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerEnter(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerEnter(shape1);
    }
  };

  private _onTriggerExit = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, n = scripts.length; i < n; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerExit(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, n = scripts.length; i < n; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerExit(shape1);
    }
  };

  private _onTriggerStay = (obj1: number, obj2: number) => {
    const shape1 = this._physicalObjectsMap[obj1];
    const shape2 = this._physicalObjectsMap[obj2];

    let scripts = shape1.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerStay(shape2);
    }

    scripts = shape2.collider.entity._scripts;
    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts.get(i);
      script._waitHandlingInValid || script.onTriggerStay(shape1);
    }
  };

  /** The fixed time step in seconds at which physics are performed. */
  fixedTimeStep: number = 1 / 60;

  /** The max sum of time step in seconds one frame. */
  maxSumTimeStep: number = 1 / 3;

  get gravity(): Vector3 {
    return this._gravity;
  }

  set gravity(value: Vector3) {
    const gravity = this._gravity;
    if (gravity !== value) {
      value.cloneTo(gravity);
    }
    this._nativePhysicsManager.setGravity(gravity);
  }

  constructor(engine: Engine) {
    this._engine = engine;
  }

  /**
   * initialize PhysicsManager.
   * @param physics - Physics Engine
   */
  initialize(physics: IPhysics): void {
    if (this._initialized) {
      return;
    }
    PhysicsManager._nativePhysics = physics;
    this._nativePhysicsManager = PhysicsManager._nativePhysics.createPhysicsManager(
      this._onContactEnter,
      this._onContactExit,
      this._onContactStay,
      this._onTriggerEnter,
      this._onTriggerExit,
      this._onTriggerStay
    );
    this._initialized = true;
  }

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @returns Returns True if the ray intersects with a collider, otherwise false
   */
  raycast(ray: Ray): boolean;

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @param outHitResult - If true is returned, outHitResult will contain more detailed collision information
   * @returns Returns True if the ray intersects with a collider, otherwise false
   */
  raycast(ray: Ray, outHitResult: HitResult): boolean;

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @param distance - The max distance the ray should check
   * @returns Returns True if the ray intersects with a collider, otherwise false
   */
  raycast(ray: Ray, distance: number): boolean;

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @param distance - The max distance the ray should check
   * @param outHitResult - If true is returned, outHitResult will contain more detailed collision information
   * @returns Returns True if the ray intersects with a collider, otherwise false
   */
  raycast(ray: Ray, distance: number, outHitResult: HitResult): boolean;

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @param distance - The max distance the ray should check
   * @param layerMask - Layer mask that is used to selectively ignore Colliders when casting
   * @returns Returns True if the ray intersects with a collider, otherwise false
   */
  raycast(ray: Ray, distance: number, layerMask: Layer): boolean;

  /**
   * Casts a ray through the Scene and returns the first hit.
   * @param ray - The ray
   * @param distance - The max distance the ray should check
   * @param layerMask - Layer mask that is used to selectively ignore Colliders when casting
   * @param outHitResult - If true is returned, outHitResult will contain more detailed collision information
   * @returns Returns True if the ray intersects with a collider, otherwise false.
   */
  raycast(ray: Ray, distance: number, layerMask: Layer, outHitResult: HitResult): boolean;

  raycast(
    ray: Ray,
    distanceOrResult?: number | HitResult,
    layerMaskOrResult?: Layer | HitResult,
    outHitResult?: HitResult
  ): boolean {
    let hitResult: HitResult;

    let distance = Number.MAX_VALUE;
    if (typeof distanceOrResult === "number") {
      distance = distanceOrResult;
    } else if (distanceOrResult != undefined) {
      hitResult = distanceOrResult;
    }

    let layerMask = Layer.Everything;
    if (typeof layerMaskOrResult === "number") {
      layerMask = layerMaskOrResult;
    } else if (layerMaskOrResult != undefined) {
      hitResult = layerMaskOrResult;
    }

    if (outHitResult) {
      hitResult = outHitResult;
    }

    if (hitResult != undefined) {
      const result = this._nativePhysicsManager.raycast(ray, distance, (idx, distance, position, normal) => {
        hitResult.entity = this._physicalObjectsMap[idx]._collider.entity;
        hitResult.distance = distance;
        normal.cloneTo(hitResult.normal);
        position.cloneTo(hitResult.point);
      });

      if (result) {
        if (hitResult.entity.layer & layerMask) {
          return true;
        } else {
          hitResult.entity = null;
          hitResult.distance = 0;
          hitResult.point.setValue(0, 0, 0);
          hitResult.normal.setValue(0, 0, 0);
          return false;
        }
      }
      return false;
    } else {
      return this._nativePhysicsManager.raycast(ray, distance);
    }
  }

  /**
   * Call on every frame to update pose of objects.
   * @internal
   */
  _update(deltaTime: number): void {
    const { fixedTimeStep: fixedTimeStep, _nativePhysicsManager: nativePhysicsManager } = this;
    const componentsManager = this._engine._componentsManager;

    const simulateTime = deltaTime + this._restTime;
    const step = Math.floor(Math.min(this.maxSumTimeStep, simulateTime) / fixedTimeStep);
    this._restTime = simulateTime - step * fixedTimeStep;
    for (let i = 0; i < step; i++) {
      componentsManager.callScriptOnPhysicsUpdate();
      componentsManager.callColliderOnUpdate();
      nativePhysicsManager.update(fixedTimeStep);
      componentsManager.callColliderOnLateUpdate();
    }
  }

  /**
   * Add ColliderShape into the manager.
   * @param colliderShape - The Collider Shape.
   * @internal
   */
  _addColliderShape(colliderShape: ColliderShape): void {
    this._physicalObjectsMap[colliderShape.id] = colliderShape;
    this._nativePhysicsManager.addColliderShape(colliderShape._nativeShape);
  }

  /**
   * Remove ColliderShape.
   * @param colliderShape - The Collider Shape.
   * @internal
   */
  _removeColliderShape(colliderShape: ColliderShape): void {
    delete this._physicalObjectsMap[colliderShape.id];
    this._nativePhysicsManager.removeColliderShape(colliderShape._nativeShape);
  }

  /**
   * Add collider into the manager.
   * @param collider - StaticCollider or DynamicCollider.
   * @internal
   */
  _addCollider(collider: Collider): void {
    this._nativePhysicsManager.addCollider(collider._nativeCollider);
  }

  /**
   * Remove collider.
   * @param collider - StaticCollider or DynamicCollider.
   * @internal
   */
  _removeCollider(collider: Collider): void {
    this._nativePhysicsManager.removeCollider(collider._nativeCollider);
  }
}
