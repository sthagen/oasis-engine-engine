import { ICollider, IStaticCollider } from "@oasis-engine/design";
import { BoolUpdateFlag } from "../BoolUpdateFlag";
import { ignoreClone } from "../clone/CloneManager";
import { Component } from "../Component";
import { dependentComponents } from "../ComponentsDependencies";
import { Entity } from "../Entity";
import { Transform } from "../Transform";
import { ColliderShape } from "./shape/ColliderShape";

/**
 * Base class for all colliders.
 * @decorator `@dependentComponents(Transform)`
 */
@dependentComponents(Transform)
export class Collider extends Component {
  /** @internal */
  @ignoreClone
  _index: number = -1;
  /** @internal */
  _nativeCollider: ICollider;

  protected _updateFlag: BoolUpdateFlag;
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
      this.engine.physicsManager._addColliderShape(shape);
      shape._collider = this;
      this._nativeCollider.addShape(shape._nativeShape);
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
      this.engine.physicsManager._removeColliderShape(shape);
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
      this.engine.physicsManager._removeColliderShape(shape);
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
   * @override
   * @internal
   */
  _onEnable(): void {
    this.engine.physicsManager._addCollider(this);
  }

  /**
   * @override
   * @internal
   */
  _onDisable(): void {
    this.engine.physicsManager._removeCollider(this);
  }

  /**
   * @override
   * @internal
   */
  _onDestroy(): void {
    this.clearShapes();
    this._nativeCollider.destroy();
  }
}
