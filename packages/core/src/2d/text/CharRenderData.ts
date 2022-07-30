import { Vector2, Vector3 } from "@oasis-engine/math";
import { Texture2D } from "../../texture";
import { RenderData2D } from "../data/RenderData2D";

/**
 * @internal
 */
export class CharRenderData {
  static triangles: number[] = [0, 2, 1, 2, 0, 3];

  texture: Texture2D;
  localPositions: Vector3[];
  renderData: RenderData2D;

  constructor() {
    const positions = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    const uvs = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];
    this.localPositions = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    this.renderData = new RenderData2D(4, positions, uvs, CharRenderData.triangles, null);
  }
}
