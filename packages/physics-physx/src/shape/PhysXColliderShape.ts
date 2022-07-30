import { IColliderShape } from "@oasis-engine/design";
import { Quaternion, Vector3 } from "oasis-engine";
import { DisorderedArray } from "../DisorderedArray";
import { PhysXCharacterController } from "../PhysXCharacterController";
import { PhysXPhysics } from "../PhysXPhysics";
import { PhysXPhysicsMaterial } from "../PhysXPhysicsMaterial";

/**
 * Flags which affect the behavior of Shapes.
 */
export enum ShapeFlag {
  /** The shape will partake in collision in the physical simulation. */
  SIMULATION_SHAPE = 1 << 0,
  /** The shape will partake in scene queries (ray casts, overlap tests, sweeps, ...). */
  SCENE_QUERY_SHAPE = 1 << 1,
  /** The shape is a trigger which can send reports whenever other shapes enter/leave its volume. */
  TRIGGER_SHAPE = 1 << 2
}

/**
 * Abstract class for collider shapes.
 */
export abstract class PhysXColliderShape implements IColliderShape {
  static readonly halfSqrt: number = 0.70710678118655;
  static transform = {
    translation: new Vector3(),
    rotation: null
  };

  /** @internal */
  _controllers: DisorderedArray<PhysXCharacterController> = new DisorderedArray<PhysXCharacterController>();

  protected _position: Vector3 = new Vector3();
  protected _rotation: Quaternion = new Quaternion();
  protected _scale: Vector3 = new Vector3(1, 1, 1);

  private _shapeFlags: ShapeFlag = ShapeFlag.SCENE_QUERY_SHAPE | ShapeFlag.SIMULATION_SHAPE;

  /** @internal */
  _pxMaterials: any[] = new Array(1);
  /** @internal */
  _pxShape: any;
  /** @internal */
  _pxGeometry: any;
  /** @internal */
  _id: number;
  /** @internal */
  _contactOffset: number = 0;

  /**
   * {@inheritDoc IColliderShape.setPosition }
   */
  setPosition(value: Vector3): void {
    if (value !== this._position) {
      this._position.copyFrom(value);
    }
    this._setLocalPose();
  }

  /**
   * {@inheritDoc IColliderShape.setWorldScale }
   */
  abstract setWorldScale(scale: Vector3): void;

  /**
   * {@inheritDoc IColliderShape.setContactOffset }
   */
  setContactOffset(offset: number): void {
    this._contactOffset = offset;
    this._pxShape.setContactOffset(offset);

    const controllers = this._controllers;
    for (let i = 0, n = controllers.length; i < n; i++) {
      controllers.get(i)._pxController.setContactOffset(offset);
    }
  }

  /**
   * {@inheritDoc IColliderShape.setMaterial }
   */
  setMaterial(value: PhysXPhysicsMaterial): void {
    this._pxMaterials[0] = value._pxMaterial;
    this._pxShape.setMaterials(this._pxMaterials);
  }

  /**
   * {@inheritDoc IColliderShape.setIsTrigger }
   */
  setIsTrigger(value: boolean): void {
    this._modifyFlag(ShapeFlag.SIMULATION_SHAPE, !value);
    this._modifyFlag(ShapeFlag.TRIGGER_SHAPE, value);
    this._setShapeFlags(this._shapeFlags);
  }

  /**
   * {@inheritDoc IColliderShape.setIsSceneQuery }
   */
  setIsSceneQuery(value: boolean): void {
    this._modifyFlag(ShapeFlag.SCENE_QUERY_SHAPE, value);
    this._setShapeFlags(this._shapeFlags);
  }

  /**
   * {@inheritDoc IColliderShape.destroy }
   */
  destroy(): void {
    this._pxShape.release();
  }

  /**
   *  @internal
   */
  _setShapeFlags(flags: ShapeFlag) {
    this._shapeFlags = flags;
    this._pxShape.setFlags(new PhysXPhysics._physX.PxShapeFlags(this._shapeFlags));
  }

  protected _setLocalPose(): void {
    const transform = PhysXColliderShape.transform;
    Vector3.multiply(this._position, this._scale, transform.translation);
    transform.rotation = this._rotation;
    this._pxShape.setLocalPose(transform);
  }

  protected _initialize(material: PhysXPhysicsMaterial, id: number): void {
    this._id = id;
    this._pxMaterials[0] = material._pxMaterial;
    this._pxShape = PhysXPhysics._pxPhysics.createShape(
      this._pxGeometry,
      material._pxMaterial,
      false,
      new PhysXPhysics._physX.PxShapeFlags(this._shapeFlags)
    );
    this._pxShape.setQueryFilterData(new PhysXPhysics._physX.PxFilterData(id, 0, 0, 0));
  }

  private _modifyFlag(flag: ShapeFlag, value: boolean): void {
    this._shapeFlags = value ? this._shapeFlags | flag : this._shapeFlags & ~flag;
  }
}
