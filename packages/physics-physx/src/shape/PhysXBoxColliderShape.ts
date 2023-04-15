import { IBoxColliderShape } from "@galacean/engine-design";
import { Vector3 } from "@galacean/engine";
import { PhysXPhysics } from "../PhysXPhysics";
import { PhysXPhysicsMaterial } from "../PhysXPhysicsMaterial";
import { PhysXColliderShape } from "./PhysXColliderShape";

/**
 * Box collider shape in PhysX.
 */
export class PhysXBoxColliderShape extends PhysXColliderShape implements IBoxColliderShape {
  private static _tempHalfExtents = new Vector3();
  /** @internal */
  _halfSize: Vector3 = new Vector3();

  constructor(physXPhysics: PhysXPhysics, uniqueID: number, size: Vector3, material: PhysXPhysicsMaterial) {
    super(physXPhysics);

    this._halfSize.set(size.x * 0.5, size.y * 0.5, size.z * 0.5);

    this._pxGeometry = new physXPhysics._physX.PxBoxGeometry(
      this._halfSize.x * this._scale.x,
      this._halfSize.y * this._scale.y,
      this._halfSize.z * this._scale.z
    );
    this._initialize(material, uniqueID);
    this._setLocalPose();
  }

  /**
   * {@inheritDoc IBoxColliderShape.setSize }
   */
  setSize(value: Vector3): void {
    const tempExtents = PhysXBoxColliderShape._tempHalfExtents;
    this._halfSize.set(value.x * 0.5, value.y * 0.5, value.z * 0.5);
    Vector3.multiply(this._halfSize, this._scale, tempExtents);
    this._pxGeometry.halfExtents = tempExtents;
    this._pxShape.setGeometry(this._pxGeometry);

    this._updateController(tempExtents);
  }

  /**
   * {@inheritDoc IColliderShape.setWorldScale }
   */
  setWorldScale(scale: Vector3): void {
    super.setWorldScale(scale);

    const tempExtents = PhysXBoxColliderShape._tempHalfExtents;
    Vector3.multiply(this._halfSize, this._scale, tempExtents);
    this._pxGeometry.halfExtents = tempExtents;
    this._pxShape.setGeometry(this._pxGeometry);

    this._updateController(tempExtents);
  }

  private _updateController(extents: Vector3) {
    const controllers = this._controllers;
    for (let i = 0, n = controllers.length; i < n; i++) {
      const pxController = controllers.get(i)._pxController;
      pxController.setHalfHeight(extents.x);
      pxController.setHalfSideExtent(extents.y);
      pxController.setHalfForwardExtent(extents.z);
    }
  }
}
