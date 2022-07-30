import { BoundingBox } from "./BoundingBox";
import { BoundingSphere } from "./BoundingSphere";
import { CollisionUtil } from "./CollisionUtil";
import { ContainmentType } from "./enums/ContainmentType";
import { IClone } from "./IClone";
import { ICopy } from "./ICopy";
import { Matrix } from "./Matrix";
import { Plane } from "./Plane";

/**
 * A bounding frustum.
 */
export class BoundingFrustum implements IClone<BoundingFrustum>, ICopy<BoundingFrustum, BoundingFrustum> {
  /** The near plane of this frustum. */
  public near: Plane;
  /** The far plane of this frustum. */
  public far: Plane;
  /** The left plane of this frustum. */
  public left: Plane;
  /** The right plane of this frustum. */
  public right: Plane;
  /** The top plane of this frustum. */
  public top: Plane;
  /** The bottom plane of this frustum. */
  public bottom: Plane;

  /**
   * Constructor of BoundingFrustum.
   * @param matrix - The view-projection matrix
   */
  constructor(matrix: Matrix = null) {
    this.near = new Plane();
    this.far = new Plane();
    this.left = new Plane();
    this.right = new Plane();
    this.top = new Plane();
    this.bottom = new Plane();

    matrix && this.calculateFromMatrix(matrix);
  }

  /**
   * Get the plane by the given index.
   * 0: near
   * 1: far
   * 2: left
   * 3: right
   * 4: top
   * 5: bottom
   * @param index - The index
   * @returns The plane get
   */
  getPlane(index: number): Plane {
    switch (index) {
      case 0:
        return this.near;
      case 1:
        return this.far;
      case 2:
        return this.left;
      case 3:
        return this.right;
      case 4:
        return this.top;
      case 5:
        return this.bottom;
      default:
        return null;
    }
  }

  /**
   * Update all planes from the given matrix.
   * @param matrix - The given view-projection matrix
   */
  public calculateFromMatrix(matrix: Matrix): void {
    const me = matrix.elements;
    const m11 = me[0];
    const m12 = me[1];
    const m13 = me[2];
    const m14 = me[3];
    const m21 = me[4];
    const m22 = me[5];
    const m23 = me[6];
    const m24 = me[7];
    const m31 = me[8];
    const m32 = me[9];
    const m33 = me[10];
    const m34 = me[11];
    const m41 = me[12];
    const m42 = me[13];
    const m43 = me[14];
    const m44 = me[15];

    // near
    const nearNormal = this.near.normal;
    nearNormal.set(-m14 - m13, -m24 - m23, -m34 - m33);
    this.near.distance = -m44 - m43;
    this.near.normalize();

    // far
    const farNormal = this.far.normal;
    farNormal.set(m13 - m14, m23 - m24, m33 - m34);
    this.far.distance = m43 - m44;

    this.far.normalize();

    // left
    const leftNormal = this.left.normal;
    leftNormal.set(-m14 - m11, -m24 - m21, -m34 - m31);
    this.left.distance = -m44 - m41;
    this.left.normalize();

    // right
    const rightNormal = this.right.normal;
    rightNormal.set(m11 - m14, m21 - m24, m31 - m34);
    this.right.distance = m41 - m44;
    this.right.normalize();

    // top
    const topNormal = this.top.normal;
    topNormal.set(m12 - m14, m22 - m24, m32 - m34);
    this.top.distance = m42 - m44;
    this.top.normalize();

    // bottom
    const bottomNormal = this.bottom.normal;
    bottomNormal.set(-m14 - m12, -m24 - m22, -m34 - m32);
    this.bottom.distance = -m44 - m42;
    this.bottom.normalize();
  }

  /**
   * Get whether or not a specified bounding box intersects with this frustum (Contains or Intersects).
   * @param box - The box for testing
   * @returns True if bounding box intersects with this frustum, false otherwise
   */
  public intersectsBox(box: BoundingBox): boolean {
    return CollisionUtil.intersectsFrustumAndBox(this, box);
  }

  /**
   * Get whether or not a specified bounding sphere intersects with this frustum (Contains or Intersects).
   * @param sphere - The sphere for testing
   * @returns True if bounding sphere intersects with this frustum, false otherwise
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return CollisionUtil.frustumContainsSphere(this, sphere) !== ContainmentType.Disjoint;
  }

  /**
   * Creates a clone of this frustum.
   * @returns A clone of this frustum
   */
  clone(): BoundingFrustum {
    const out = new BoundingFrustum();
    out.copyFrom(this);
    return out;
  }

  /**
   * Copy this frustum from the specified frustum.
   * @param source - The specified frustum
   * @returns This frustum
   */
  copyFrom(source: BoundingFrustum): BoundingFrustum {
    this.near.copyFrom(source.near);
    this.far.copyFrom(source.far);
    this.left.copyFrom(source.left);
    this.right.copyFrom(source.right);
    this.top.copyFrom(source.top);
    this.bottom.copyFrom(source.bottom);
    return this;
  }
}
