import { ICollider, IStaticCollider } from "@galacean/engine-design";
import { BoolUpdateFlag } from "../BoolUpdateFlag";
import { Component } from "../Component";
import { DependentMode, dependentComponents } from "../ComponentsDependencies";
import { Entity } from "../Entity";
import { Transform } from "../Transform";
import { deepClone, ignoreClone } from "../clone/CloneManager";
import { ColliderShape } from "./shape/ColliderShape";
import { ICustomClone } from "../clone/ComponentCloner";

/**
 * Base class for all colliders.
 * @decorator `@dependentComponents(Transform, DependentMode.CheckOnly)`
 */
@dependentComponents(Transform, DependentMode.CheckOnly)
export class Collider extends Component implements ICustomClone {
  /** @internal */
  @ignoreClone
  _index: number = -1;
  /** @internal */
  @ignoreClone
  _nativeCollider: ICollider;
  @ignoreClone
  protected _updateFlag: BoolUpdateFlag;
  @deepClone
  protected _shapes: ColliderShape[] = [];

  /**
   * The shapes of this collider.
   */
  get shapes(): Readonly<ColliderShape[]> {
    return this._shapes;
  }

  /**
   * @internal
   */
  constructor(entity: Entity) {
    super(entity);
    this._updateFlag = this.entity.transform.registerWorldChangeFlag();
  }

  /**
   * Add collider shape on this collider.
   * @param shape - Collider shape
   */
  addShape(shape: ColliderShape): void {
    const oldCollider = shape._collider;
    if (oldCollider !== this) {
      if (oldCollider) {
        oldCollider.removeShape(shape);
      }

      this._shapes.push(shape);
      shape._collider = this;
      this._nativeCollider.addShape(shape._nativeShape);
      this._phasedActiveInScene && this.scene.physics._addColliderShape(shape);
    }
  }

  /**
   * Remove a collider shape.
   * @param shape - The collider shape.
   */
  removeShape(shape: ColliderShape): void {
    const index = this._shapes.indexOf(shape);
    if (index !== -1) {
      this._shapes.splice(index, 1);
      this._phasedActiveInScene && this.scene.physics._removeColliderShape(shape);
      shape._collider = null;
      this._nativeCollider.removeShape(shape._nativeShape);
    }
  }

  /**
   * Remove all shape attached.
   */
  clearShapes(): void {
    const shapes = this._shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      const shape = shapes[i];
      this._phasedActiveInScene && this.scene.physics._removeColliderShape(shape);
      shape._destroy();
      this._nativeCollider.removeShape(shape._nativeShape);
    }
    shapes.length = 0;
  }

  /**
   * @internal
   */
  _onUpdate(): void {
    if (this._updateFlag.flag) {
      const { transform } = this.entity;
      (<IStaticCollider>this._nativeCollider).setWorldTransform(
        transform.worldPosition,
        transform.worldRotationQuaternion
      );

      const worldScale = transform.lossyWorldScale;
      for (let i = 0, n = this.shapes.length; i < n; i++) {
        this.shapes[i]._nativeShape.setWorldScale(worldScale);
      }
      this._updateFlag.flag = false;
    }
  }

  /**
   * @internal
   */
  _onLateUpdate(): void {}

  /**
   * @internal
   */
  override _onEnableInScene(): void {
    const physics = this.scene.physics;
    physics._addCollider(this);
    const shapes = this.shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      physics._addColliderShape(shapes[i]);
    }
  }

  /**
   * @internal
   */
  override _onDisableInScene(): void {
    const physics = this.scene.physics;
    physics._removeCollider(this);
    const shapes = this.shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      physics._removeColliderShape(shapes[i]);
    }
  }

  /**
   * @internal
   */
  _cloneTo(target: Collider): void {
    const shapes = target._shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      target._addPhysicsShape(shapes[i]);
    }
  }

  /**
   * @internal
   */
  protected override _onDestroy(): void {
    super._onDestroy();
    this.clearShapes();
    this._nativeCollider.destroy();
  }

  protected _addPhysicsShape(shape: ColliderShape): void {
    shape._collider = this;

    this._nativeCollider.addShape(shape._nativeShape);
    this._phasedActiveInScene && this.scene.physics._addColliderShape(shape);
  }
}
