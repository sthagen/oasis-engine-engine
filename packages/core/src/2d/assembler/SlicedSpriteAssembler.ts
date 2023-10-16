import { Matrix, Vector2, Vector3 } from "@galacean/engine-math";
import { StaticInterfaceImplement } from "../../base/StaticInterfaceImplement";
import { SpriteRenderer } from "../sprite/SpriteRenderer";
import { IAssembler } from "./IAssembler";
import { SimpleSpriteAssembler } from "./SimpleSpriteAssembler";

/**
 * @internal
 */
@StaticInterfaceImplement<IAssembler>()
export class SlicedSpriteAssembler {
  static _rectangleTriangles: number[] = [
    0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 3, 7, 6, 4, 5, 8, 5, 9, 8, 5, 6, 9, 6, 10, 9, 6, 7, 10, 7, 11, 10, 8,
    9, 12, 9, 13, 12, 9, 10, 13, 10, 14, 13, 10, 11, 14, 11, 15, 14
  ];
  static _worldMatrix: Matrix = new Matrix();
  static resetData(renderer: SpriteRenderer): void {
    const { _verticesData: verticesData } = renderer;
    const { positions, uvs } = verticesData;
    verticesData.vertexCount = positions.length = uvs.length = 16;
    for (let i = 0; i < 16; i++) {
      positions[i] ||= new Vector3();
      uvs[i] ||= new Vector2();
    }
    verticesData.triangles = SlicedSpriteAssembler._rectangleTriangles;
  }

  static updatePositions(renderer: SpriteRenderer): void {
    const { width, height, sprite } = renderer;
    const { positions, uvs } = renderer._verticesData;
    const { border } = sprite;
    const spriteUVs = sprite._getUVs();
    // Update local positions.
    const spritePositions = sprite._getPositions();
    const { x: left, y: bottom } = spritePositions[0];
    const { x: right, y: top } = spritePositions[3];
    const { width: expectWidth, height: expectHeight } = sprite;
    const fixedLeft = expectWidth * border.x;
    const fixedBottom = expectHeight * border.y;
    const fixedRight = expectWidth * border.z;
    const fixedTop = expectHeight * border.w;

    // ------------------------
    //     [3]
    //      |
    //     [2]
    //      |
    //     [1]
    //      |
    // row [0] - [1] - [2] - [3]
    //    column
    // ------------------------
    // Calculate row and column.
    let row: number[], column: number[];
    if (fixedLeft + fixedRight > width) {
      const widthScale = width / (fixedLeft + fixedRight);
      row = [
        expectWidth * left * widthScale,
        fixedLeft * widthScale,
        fixedLeft * widthScale,
        width - expectWidth * (1 - right) * widthScale
      ];
    } else {
      row = [expectWidth * left, fixedLeft, width - fixedRight, width - expectWidth * (1 - right)];
    }

    if (fixedTop + fixedBottom > height) {
      const heightScale = height / (fixedTop + fixedBottom);
      column = [
        expectHeight * bottom * heightScale,
        fixedBottom * heightScale,
        fixedBottom * heightScale,
        height - expectHeight * (1 - top) * heightScale
      ];
    } else {
      column = [expectHeight * bottom, fixedBottom, height - fixedTop, height - expectHeight * (1 - top)];
    }

    // Update renderer's worldMatrix.
    const { x: pivotX, y: pivotY } = renderer.sprite.pivot;
    const localTransX = renderer.width * pivotX;
    const localTransY = renderer.height * pivotY;
    // Renderer's worldMatrix.
    const { _worldMatrix: worldMatrix } = SlicedSpriteAssembler;
    const { elements: wE } = worldMatrix;
    // Parent's worldMatrix.
    const { elements: pWE } = renderer.entity.transform.worldMatrix;
    const sx = renderer.flipX ? -1 : 1;
    const sy = renderer.flipY ? -1 : 1;
    (wE[0] = pWE[0] * sx), (wE[1] = pWE[1] * sx), (wE[2] = pWE[2] * sx);
    (wE[4] = pWE[4] * sy), (wE[5] = pWE[5] * sy), (wE[6] = pWE[6] * sy);
    (wE[8] = pWE[8]), (wE[9] = pWE[9]), (wE[10] = pWE[10]);
    wE[12] = pWE[12] - localTransX * wE[0] - localTransY * wE[4];
    wE[13] = pWE[13] - localTransX * wE[1] - localTransY * wE[5];
    wE[14] = pWE[14] - localTransX * wE[2] - localTransY * wE[6];

    // ------------------------
    //  3 - 7 - 11 - 15
    //  |   |   |    |
    //  2 - 6 - 10 - 14
    //  |   |   |    |
    //  1 - 5 - 9  - 13
    //  |   |   |    |
    //  0 - 4 - 8  - 12
    // ------------------------
    // Assemble position and uv.
    for (let i = 0; i < 4; i++) {
      const rowValue = row[i];
      const rowU = spriteUVs[i].x;
      for (let j = 0; j < 4; j++) {
        const columnValue = column[j];
        const idx = i * 4 + j;
        positions[idx].set(
          wE[0] * rowValue + wE[4] * columnValue + wE[12],
          wE[1] * rowValue + wE[5] * columnValue + wE[13],
          wE[2] * rowValue + wE[6] * columnValue + wE[14]
        );
        uvs[idx].set(rowU, spriteUVs[j].y);
      }
    }

    const { min, max } = renderer._bounds;
    min.set(row[0], column[0], 0);
    max.set(row[3], column[3], 0);
    renderer._bounds.transform(worldMatrix);
  }

  static updateUVs(renderer: SpriteRenderer): void {}
}
