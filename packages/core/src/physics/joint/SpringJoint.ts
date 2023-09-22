import { ISpringJoint } from "@galacean/engine-design";
import { Vector3 } from "@galacean/engine-math";
import { ICustomClone } from "../../clone/ComponentCloner";
import { Collider } from "../Collider";
import { PhysicsScene } from "../PhysicsScene";
import { Joint } from "./Joint";

/**
 * A joint that maintains an upper or lower bound (or both) on the distance between two points on different objects.
 */
export class SpringJoint extends Joint {
  private _minDistance: number = 0;
  private _maxDistance: number = 0;
  private _tolerance: number = 0.25;
  private _stiffness: number = 0;
  private _damping: number = 0;

  /**
   * The swing offset.
   */
  get swingOffset(): Vector3 {
    return this._colliderInfo.localPosition;
  }

  set swingOffset(value: Vector3) {
    const swingOffset = this._colliderInfo.localPosition;
    if (value !== swingOffset) {
      swingOffset.copyFrom(value);
    }
    (<ISpringJoint>this._nativeJoint).setSwingOffset(value);
  }

  /**
   * The minimum distance.
   */
  get minDistance(): number {
    return this._minDistance;
  }

  set minDistance(value: number) {
    if (this._minDistance !== value) {
      this._minDistance = value;
      (<ISpringJoint>this._nativeJoint).setMinDistance(value);
    }
  }

  /**
   * The maximum distance.
   */
  get maxDistance(): number {
    return this._maxDistance;
  }

  set maxDistance(value: number) {
    if (this._maxDistance !== value) {
      this._maxDistance = value;
      (<ISpringJoint>this._nativeJoint).setMaxDistance(value);
    }
  }

  /**
   * The distance beyond the allowed range at which the joint becomes active.
   */
  get tolerance(): number {
    return this._tolerance;
  }

  set tolerance(value: number) {
    if (this._tolerance !== value) {
      this._tolerance = value;
      (<ISpringJoint>this._nativeJoint).setTolerance(value);
    }
  }

  /**
   * The spring strength of the joint.
   */
  get stiffness(): number {
    return this._stiffness;
  }

  set stiffness(value: number) {
    if (this._stiffness !== value) {
      this._stiffness = value;
      (<ISpringJoint>this._nativeJoint).setStiffness(value);
    }
  }

  /**
   * The degree of damping of the joint spring of the joint.
   */
  get damping(): number {
    return this._damping;
  }

  set damping(value: number) {
    if (this._damping !== value) {
      this._damping = value;
      (<ISpringJoint>this._nativeJoint).setDamping(value);
    }
  }

  /**
   * @internal
   */
  override _onAwake() {
    const collider = this._colliderInfo;
    collider.localPosition = new Vector3();
    collider.collider = this.entity.getComponent(Collider);
    this._nativeJoint = PhysicsScene._nativePhysics.createSpringJoint(collider.collider._nativeCollider);
  }

  /**
   * @internal
   */
  override _cloneTo(target: SpringJoint): void {
    target.swingOffset = this.swingOffset;
    target.minDistance = this.minDistance;
    target.maxDistance = this.maxDistance;
    target.tolerance = this.tolerance;
    target.stiffness = this.stiffness;
    target.damping = this.damping;
  }
}
