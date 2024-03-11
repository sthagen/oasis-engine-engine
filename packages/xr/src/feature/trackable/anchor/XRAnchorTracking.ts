import { Quaternion, Vector3 } from "@galacean/engine";
import { XRManagerExtended, registerXRFeature } from "../../../XRManagerExtended";
import { XRFeatureType } from "../../XRFeatureType";
import { XRTrackableFeature } from "../XRTrackableFeature";
import { XRAnchor } from "./XRAnchor";
import { XRRequestAnchor } from "./XRRequestAnchor";

/**
 * The manager of XR anchor tracking.
 */
@registerXRFeature(XRFeatureType.AnchorTracking)
export class XRAnchorTracking extends XRTrackableFeature<XRAnchor, XRRequestAnchor> {
  private _anchors: XRAnchor[] = [];

  /**
   * The anchors to tracking.
   */
  get trackingAnchors(): readonly XRAnchor[] {
    return this._anchors;
  }

  /**
   * The tracked anchors.
   */
  get trackedAnchors(): readonly XRAnchor[] {
    return this._tracked;
  }

  /**
   * @param xrManager - The xr manager
   */
  constructor(xrManager: XRManagerExtended) {
    super(xrManager, XRFeatureType.AnchorTracking);
  }

  /**
   * Add a anchor in XR space.
   * @param anchor - The anchor to be added
   */
  addAnchor(position: Vector3, rotation: Quaternion): XRAnchor {
    if (!this._enabled) {
      throw new Error("Cannot add an anchor from a disabled anchor manager.");
    }
    const { _anchors: anchors } = this;
    const requestAnchor = new XRRequestAnchor(position, rotation);
    const xrAnchor = this._generateTracked();
    requestAnchor.tracked[0] = xrAnchor;
    this._addRequestTracking(requestAnchor);
    anchors.push(xrAnchor);
    return xrAnchor;
  }

  /**
   * Remove a anchor in XR space.
   * @param anchor - The anchor to be removed
   */
  removeAnchor(anchor: XRAnchor): void {
    if (!this._enabled) {
      throw new Error("Cannot remove an anchor from a disabled anchor manager.");
    }
    const { _requestTrackings: requestTrackings, _anchors: anchors } = this;
    for (let i = 0, n = requestTrackings.length; i < n; i++) {
      const requestAnchor = requestTrackings[i];
      if (requestAnchor.tracked[0] === anchor) {
        this._removeRequestTracking(requestAnchor);
        break;
      }
    }
    anchors.splice(anchors.indexOf(anchor), 1);
  }

  /**
   * Remove all tracking anchors.
   */
  clearAnchors(): void {
    if (!this._enabled) {
      throw new Error("Cannot remove anchors from a disabled anchor manager.");
    }
    this._removeAllRequestTrackings();
  }

  protected override _generateTracked(): XRAnchor {
    const anchor = new XRAnchor();
    anchor.id = XRTrackableFeature._uuid++;
    return anchor;
  }
}
