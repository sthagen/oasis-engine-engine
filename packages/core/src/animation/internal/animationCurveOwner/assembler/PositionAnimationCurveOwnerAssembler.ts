import { Vector3 } from "@galacean/engine-math";
import { Transform } from "../../../../Transform";
import { KeyframeValueType } from "../../../Keyframe";
import { AnimationCurveOwner } from "../AnimationCurveOwner";
import { IAnimationCurveOwnerAssembler } from "./IAnimationCurveOwnerAssembler";

/**
 * @internal
 */
export class PositionAnimationCurveOwnerAssembler implements IAnimationCurveOwnerAssembler<Vector3> {
  private _transform: Transform;

  initialize(owner: AnimationCurveOwner<KeyframeValueType>): void {
    this._transform = owner.target.transform;
  }

  getTargetValue(): Vector3 {
    return this._transform.position;
  }
  setTargetValue(value: Vector3): void {
    this._transform.position = value;
  }
}

AnimationCurveOwner.registerAssembler(Transform, "position", PositionAnimationCurveOwnerAssembler);
