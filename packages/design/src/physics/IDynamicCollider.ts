import { Quaternion, Vector3 } from "@oasis-engine/math";
import { ICollider } from "./ICollider";

/**
 * Interface of physics dynamic collider.
 */
export interface IDynamicCollider extends ICollider {
  /**
   * Set global transform of collider.
   * @param position - The global position
   * @param rotation - The global rotation
   */
  setWorldTransform(position: Vector3, rotation: Quaternion): void;

  /**
   * Get global transform of collider.
   * @param outPosition - The global position
   * @param outRotation - The global rotation
   */
  getWorldTransform(outPosition: Vector3, outRotation: Quaternion): void;

  /**
   * Sets the linear damping coefficient.
   * @param value - Linear damping coefficient.
   */
  setLinearDamping(value: number): void;

  /**
   * Sets the angular damping coefficient.
   * @param value - Angular damping coefficient.
   */
  setAngularDamping(value: number): void;

  /**
   * Sets the linear velocity of the actor.
   * @param value - New linear velocity of actor.
   */
  setLinearVelocity(value: Vector3): void;

  /**
   * Sets the angular velocity of the actor.
   * @param value - New angular velocity of actor.
   */
  setAngularVelocity(value: Vector3): void;

  /**
   *  Sets the mass of a dynamic actor.
   * @param value - New mass value for the actor.
   */
  setMass(value: number): void;

  /**
   * Sets the pose of the center of mass relative to the actor.
   * @param value - Mass frame offset transform relative to the actor frame.
   */
  setCenterOfMass(value: Vector3): void;

  /**
   * Sets the inertia tensor, using a parameter specified in mass space coordinates.
   * @param value - New mass space inertia tensor for the actor.
   */
  setInertiaTensor(value: Vector3): void;

  /**
   * Set the maximum angular velocity permitted for this actor.
   * @param value - Max allowable angular velocity for actor.
   */
  setMaxAngularVelocity(value: number): void;

  /**
   * Sets the maximum depenetration velocity permitted to be introduced by the solver.
   * @param value - The maximum velocity to de-penetrate
   */
  setMaxDepenetrationVelocity(value: number): void;

  /**
   * Sets the mass-normalized kinetic energy threshold below which an actor may go to sleep.
   * @param value - Energy below which an actor may go to sleep.
   */
  setSleepThreshold(value: number): void;

  /**
   * Sets the solver iteration counts for the body.
   * @param value - Number of position iterations the solver should perform for this body.
   */
  setSolverIterations(value: number): void;

  /**
   * Sets the colliders' collision detection mode.
   * @param value - rigid body flag
   */
  setCollisionDetectionMode(value: number): void;

  /**
   * Controls whether physics affects the dynamic collider.
   * @param value - is or not
   */
  setIsKinematic(value: boolean): void;

  /**
   * Raises or clears a particular rigid dynamic lock flag.
   * @param flags - the flag to raise(set) or clear.
   */
  setConstraints(flags: number): void;

  /**
   * Apply a force to the dynamic collider.
   * @param force - The force make the collider move
   */
  addForce(force: Vector3): void;

  /**
   * Apply a torque to the dynamic collider.
   * @param torque - The force make the collider rotate
   */
  addTorque(torque: Vector3): void;

  /**
   * Moves kinematically controlled dynamic actors through the game world.
   * @param positionOrRotation - The desired position or rotation for the kinematic actor
   * @param rotation - The desired rotation for the kinematic actor
   */
  move(positionOrRotation: Vector3 | Quaternion, rotation?: Quaternion): void;

  /**
   * Forces a collider to sleep at least one frame.
   */
  sleep(): void;

  /**
   * Forces a collider to wake up.
   */
  wakeUp(): void;
}
