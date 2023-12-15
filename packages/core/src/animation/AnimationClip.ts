import { EngineObject } from "../base/EngineObject";
import { Component } from "../Component";
import { Entity } from "../Entity";
import { UpdateFlagManager } from "../UpdateFlagManager";
import { AnimationClipCurveBinding } from "./AnimationClipCurveBinding";
import { AnimationCurve } from "./animationCurve/AnimationCurve";
import { AnimationEvent } from "./AnimationEvent";
import { KeyframeValueType } from "./Keyframe";

/**
 * Stores keyframe based animations.
 */
export class AnimationClip extends EngineObject {
  /** @internal */
  _curveBindings: AnimationClipCurveBinding[] = [];

  /** @internal */
  _updateFlagManager: UpdateFlagManager = new UpdateFlagManager();

  private _length: number = 0;
  private _events: AnimationEvent[] = [];

  /**
   * Animation events for this animation clip.
   */
  get events(): Readonly<AnimationEvent[]> {
    return this._events;
  }

  /**
   * Animation curve bindings for this animation clip.
   */
  get curveBindings(): Readonly<AnimationClipCurveBinding[]> {
    return this._curveBindings;
  }

  /**
   * Animation length in seconds.
   */
  get length(): number {
    return this._length;
  }

  /**
   * @param name - The AnimationClip's name
   */
  constructor(public readonly name: string) {
    super(null);
  }

  /**
   * Adds an animation event to the clip.
   * @param functionName - The name of the method called in the script
   * @param time - The time when the event be triggered
   * @param parameter - The parameter that is stored in the event and will be sent to the function
   */
  addEvent(functionName: string, time: number, parameter: Object): void;

  /**
   * Adds an animation event to the clip.
   * @param event - The animation event
   */
  addEvent(event: AnimationEvent): void;

  addEvent(param: AnimationEvent | string, time?: number, parameter?: Object): void {
    let newEvent: AnimationEvent;
    if (typeof param === "string") {
      const event = new AnimationEvent();
      event.functionName = param;
      event.time = time;
      event.parameter = parameter;
      newEvent = event;
    } else {
      newEvent = param;
    }
    const events = this._events;
    const count = events.length;
    const eventTime = newEvent.time;
    const maxEventTime = count ? events[count - 1].time : 0;
    if (eventTime >= maxEventTime) {
      events.push(newEvent);
    } else {
      let index = count;
      while (--index >= 0 && eventTime < events[index].time);
      events.splice(index + 1, 0, newEvent);
    }

    this._updateFlagManager.dispatch();
  }

  /**
   * Clears all events from the clip.
   */
  clearEvents(): void {
    this._events.length = 0;
    this._updateFlagManager.dispatch();
  }

  /**
   * Add curve binding for the clip.
   * @param relativePath - Path to the game object this curve applies to. The relativePath is formatted similar to a pathname, e.g. "/root/spine/leftArm"
   * @param type- The class type of the component that is animated
   * @param propertyName - The name or path to the property being animated
   * @param curve - The animation curve
   */
  addCurveBinding<T extends Component>(
    relativePath: string,
    type: new (entity: Entity) => T,
    propertyName: string,
    curve: AnimationCurve<KeyframeValueType>
  ): void {
    const curveBinding = new AnimationClipCurveBinding();
    curveBinding.relativePath = relativePath;
    curveBinding.type = type;
    curveBinding.property = propertyName;
    curveBinding.curve = curve;
    if (curve.length > this._length) {
      this._length = curve.length;
    }
    this._curveBindings.push(curveBinding);
  }

  /**
   * Clears all curve bindings from the clip.
   */
  clearCurveBindings(): void {
    this._curveBindings.length = 0;
    this._length = 0;
  }

  /**
   * @internal
   * Samples an animation at a given time.
   * @param entity - The animated entity
   * @param time - The time to sample an animation
   */
  _sampleAnimation(entity: Entity, time: number): void {
    const { _curveBindings: curveBindings } = this;
    for (let i = curveBindings.length - 1; i >= 0; i--) {
      const curveData = curveBindings[i];
      const targetEntity = entity.findByPath(curveData.relativePath);
      if (targetEntity) {
        const component = targetEntity.getComponent(curveData.type);
        if (!component) {
          continue;
        }
        const curveOwner = curveData._getTempCurveOwner(targetEntity, component);
        if (curveOwner && curveData.curve.keys.length) {
          const value = curveOwner.evaluateValue(curveData.curve, time, false);
          curveOwner.applyValue(value, 1, false);
        }
      }
    }
  }
}
