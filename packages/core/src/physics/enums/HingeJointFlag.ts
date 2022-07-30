/**
 * Flags specific to the Hinge Joint.
 * @internal
 */
export enum HingeJointFlag {
  /** enable the limit */
  LimitEnabled = 1,
  /** enable the drive */
  DriveEnabled = 2,
  /** if the existing velocity is beyond the drive velocity, do not add force */
  DriveFreeSpin = 4
}
