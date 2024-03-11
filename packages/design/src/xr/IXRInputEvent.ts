/**
 * Unified XR input events.
 */
export interface IXRInputEvent {
  /** Interaction type. */
  targetRayMode: number;
  /** Specific interactions. */
  type: number;
  /** Type of interactive input. */
  input: number;
  /** Touch id. (Meaningful when and only when targetRayMode is screen) */
  id?: number;
  /** X coordinate on screen. (Meaningful when and only when targetRayMode is screen) */
  x?: number;
  /** Y coordinate on screen. (Meaningful when and only when targetRayMode is screen) */
  y?: number;
}
