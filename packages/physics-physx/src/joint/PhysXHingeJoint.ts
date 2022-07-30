import { PhysXCollider } from "../PhysXCollider";
import { PhysXJoint } from "./PhysXJoint";
import { IHingeJoint } from "@oasis-engine/design";
import { PhysXPhysics } from "../PhysXPhysics";
import { Quaternion, Vector3 } from "oasis-engine";

/**
 * A joint which behaves in a similar way to a hinge or axle.
 */
export class PhysXHingeJoint extends PhysXJoint implements IHingeJoint {
  private _axisRotationQuaternion = new Quaternion();
  private _swingOffset = new Vector3();
  private _velocity = new Vector3();

  constructor(collider: PhysXCollider) {
    super();
    this._collider = collider;
    this._pxJoint = PhysXPhysics._pxPhysics.createRevoluteJoint(
      null,
      PhysXJoint._defaultVec,
      PhysXJoint._defaultQuat,
      collider._pxActor,
      PhysXJoint._defaultVec,
      PhysXJoint._defaultQuat
    );
  }

  /**
   * {@inheritDoc IHingeJoint.setAxis }
   */
  setAxis(value: Vector3): void {
    const xAxis = PhysXJoint._xAxis;
    const axisRotationQuaternion = this._axisRotationQuaternion;
    xAxis.set(1, 0, 0);
    value.normalize();
    const angle = Math.acos(Vector3.dot(xAxis, value));
    Vector3.cross(xAxis, value, xAxis);
    Quaternion.rotationAxisAngle(xAxis, angle, axisRotationQuaternion);

    this._setLocalPose(0, this._swingOffset, axisRotationQuaternion);
  }

  /**
   * {@inheritDoc IHingeJoint.setSwingOffset }
   */
  setSwingOffset(value: Vector3): void {
    this._swingOffset.copyFrom(value);
    this._setLocalPose(1, this._swingOffset, this._axisRotationQuaternion);
  }

  /**
   * {@inheritDoc IHingeJoint.getAngle }
   */
  getAngle(): number {
    return this._pxJoint.getAngle();
  }

  /**
   * {@inheritDoc IHingeJoint.getVelocity }
   */
  getVelocity(): Readonly<Vector3> {
    const velocity = this._velocity;
    velocity.copyFrom(this._pxJoint.getVelocity());
    return velocity;
  }

  /**
   * {@inheritDoc IHingeJoint.setHardLimitCone }
   */
  setHardLimit(lowerLimit: number, upperLimit: number, contactDist: number): void {
    this._pxJoint.setHardLimit(lowerLimit, upperLimit, contactDist);
  }

  /**
   * {@inheritDoc IHingeJoint.setHardLimitCone }
   */
  setSoftLimit(lowerLimit: number, upperLimit: number, stiffness: number, damping: number): void {
    this._pxJoint.setSoftLimit(lowerLimit, upperLimit, stiffness, damping);
  }

  /**
   * {@inheritDoc IHingeJoint.setDriveVelocity }
   */
  setDriveVelocity(velocity: number): void {
    this._pxJoint.setDriveVelocity(velocity);
  }

  /**
   * {@inheritDoc IHingeJoint.setDriveForceLimit }
   */
  setDriveForceLimit(limit: number): void {
    this._pxJoint.setDriveForceLimit(limit);
  }

  /**
   * {@inheritDoc IHingeJoint.setDriveGearRatio }
   */
  setDriveGearRatio(ratio: number): void {
    this._pxJoint.setDriveGearRatio(ratio);
  }

  /**
   * {@inheritDoc IHingeJoint.setHingeJointFlag }
   */
  setHingeJointFlag(flag: number, value: boolean): void {
    this._pxJoint.setRevoluteJointFlag(flag, value);
  }
}
