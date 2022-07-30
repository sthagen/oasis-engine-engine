import { BoundingBox, Matrix, Vector2, Vector3 } from "@oasis-engine/math";
import { SpriteMask } from "../sprite";
import { SpriteRenderer } from "../sprite/SpriteRenderer";
import { IAssembler } from "./IAssembler";
import { StaticInterfaceImplement } from "./StaticInterfaceImplement";

/**
 * @internal
 */
@StaticInterfaceImplement<IAssembler>()
export class SimpleSpriteAssembler {
  static _rectangleTriangles: number[] = [0, 1, 2, 2, 1, 3];
  static _worldMatrix: Matrix = new Matrix();

  static resetData(renderer: SpriteRenderer | SpriteMask): void {
    const { _renderData: renderData } = renderer;
    const vertexCount = (renderData.vertexCount = 4);
    const { positions, uvs } = renderData;
    if (positions.length < vertexCount) {
      for (let i = positions.length; i < vertexCount; i++) {
        positions.push(new Vector3());
        uvs.push(new Vector2());
      }
    }
    renderData.triangles = SimpleSpriteAssembler._rectangleTriangles;
  }

  static updatePositions(renderer: SpriteRenderer | SpriteMask): void {
    const { width, height, sprite } = renderer;
    const { x: pivotX, y: pivotY } = sprite.pivot;
    // Renderer's worldMatrix;
    const { _worldMatrix: worldMatrix } = SimpleSpriteAssembler;
    const { elements: wE } = worldMatrix;
    // Parent's worldMatrix.
    const { elements: pWE } = renderer.entity.transform.worldMatrix;
    const sx = renderer.flipX ? -width : width;
    const sy = renderer.flipY ? -height : height;
    (wE[0] = pWE[0] * sx), (wE[1] = pWE[1] * sx), (wE[2] = pWE[2] * sx);
    (wE[4] = pWE[4] * sy), (wE[5] = pWE[5] * sy), (wE[6] = pWE[6] * sy);
    (wE[8] = pWE[8]), (wE[9] = pWE[9]), (wE[10] = pWE[10]);
    wE[12] = pWE[12] - pivotX * wE[0] - pivotY * wE[4];
    wE[13] = pWE[13] - pivotX * wE[1] - pivotY * wE[5];
    wE[14] = pWE[14];

    // ---------------
    //  2 - 3
    //  |   |
    //  0 - 1
    // ---------------
    // Update positions.
    const spritePositions = sprite._getPositions();
    const { positions } = renderer._renderData;
    for (let i = 0; i < 4; i++) {
      const { x, y } = spritePositions[i];
      positions[i].set(wE[0] * x + wE[4] * y + wE[12], wE[1] * x + wE[5] * y + wE[13], wE[2] * x + wE[6] * y + wE[14]);
    }

    BoundingBox.transform(sprite._getBounds(), worldMatrix, renderer._bounds);
  }

  static updateUVs(renderer: SpriteRenderer | SpriteMask): void {
    const spriteUVs = renderer.sprite._getUVs();
    const renderUVs = renderer._renderData.uvs;
    const { x: left, y: bottom } = spriteUVs[0];
    const { x: right, y: top } = spriteUVs[3];
    renderUVs[0].set(left, bottom);
    renderUVs[1].set(right, bottom);
    renderUVs[2].set(left, top);
    renderUVs[3].set(right, top);
  }
}
