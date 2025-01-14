import { MathUtil, Matrix, Vector2 } from "@galacean/engine-math";
import { Logger } from "../../base";
import { StaticInterfaceImplement } from "../../base/StaticInterfaceImplement";
import { DisorderedArray } from "../../utils/DisorderedArray";
import { SpriteTileMode } from "../enums/SpriteTileMode";
import { ISpriteAssembler } from "./ISpriteAssembler";
import { ISpriteRenderer } from "./ISpriteRenderer";

/**
 * Assemble vertex data for the sprite renderer in tiled mode.
 */
@StaticInterfaceImplement<ISpriteAssembler>()
export class TiledSpriteAssembler {
  private static _matrix = new Matrix();
  private static _posRow = new DisorderedArray<number>();
  private static _posColumn = new DisorderedArray<number>();
  private static _uvRow = new DisorderedArray<number>();
  private static _uvColumn = new DisorderedArray<number>();

  static resetData(renderer: ISpriteRenderer, vertexCount: number): void {
    if (vertexCount) {
      const manager = renderer._getChunkManager();
      const lastSubChunk = renderer._subChunk;
      const sizeChanged = lastSubChunk && lastSubChunk.vertexArea.size !== vertexCount * 9;
      sizeChanged && manager.freeSubChunk(lastSubChunk);

      if (!lastSubChunk || sizeChanged) {
        const newSubChunk = manager.allocateSubChunk(vertexCount);
        newSubChunk.indices = [];
        renderer._subChunk = newSubChunk;
      }
    }
  }

  static updatePositions(
    renderer: ISpriteRenderer,
    worldMatrix: Matrix,
    width: number,
    height: number,
    pivot: Vector2,
    flipX: boolean,
    flipY: boolean,
    referenceResolutionPerUnit: number = 1
  ): void {
    // Calculate row and column
    const { _posRow: rPos, _posColumn: cPos, _uvRow: rUV, _uvColumn: cUV } = TiledSpriteAssembler;
    TiledSpriteAssembler.resetData(
      renderer,
      TiledSpriteAssembler._calculateDividing(renderer, width, height, rPos, cPos, rUV, cUV, referenceResolutionPerUnit)
    );
    // Update renderer's worldMatrix
    const { x: pivotX, y: pivotY } = pivot;
    const localTransX = width * pivotX;
    const localTransY = height * pivotY;
    // Position to World
    const modelMatrix = TiledSpriteAssembler._matrix;
    const { elements: wE } = modelMatrix;
    // Renderer's worldMatrix
    const { elements: pWE } = worldMatrix;
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    let wE0: number, wE1: number, wE2: number;
    let wE4: number, wE5: number, wE6: number;
    (wE0 = wE[0] = pWE[0] * sx), (wE1 = wE[1] = pWE[1] * sx), (wE2 = wE[2] = pWE[2] * sx);
    (wE4 = wE[4] = pWE[4] * sy), (wE5 = wE[5] = pWE[5] * sy), (wE6 = wE[6] = pWE[6] * sy);
    (wE[8] = pWE[8]), (wE[9] = pWE[9]), (wE[10] = pWE[10]);
    const wE12 = (wE[12] = pWE[12] - localTransX * wE0 - localTransY * wE4);
    const wE13 = (wE[13] = pWE[13] - localTransX * wE1 - localTransY * wE5);
    const wE14 = (wE[14] = pWE[14] - localTransX * wE2 - localTransY * wE6);
    // Assemble position and uv
    const rowLength = rPos.length - 1;
    const columnLength = cPos.length - 1;

    const subChunk = renderer._subChunk;
    const vertices = subChunk.chunk.vertices;
    const indices = subChunk.indices;
    let count = 0;
    let trianglesOffset = 0;
    for (let j = 0, o = subChunk.vertexArea.start; j < columnLength; j++) {
      const doubleJ = j << 1;
      if (Number.isNaN(cUV.get(doubleJ)) || Number.isNaN(cUV.get(doubleJ + 1))) {
        continue;
      }
      for (let i = 0; i < rowLength; i++) {
        const doubleI = i << 1;
        if (Number.isNaN(rUV.get(doubleI)) || Number.isNaN(rUV.get(doubleI + 1))) {
          continue;
        }
        indices[trianglesOffset++] = count;
        indices[trianglesOffset++] = count + 1;
        indices[trianglesOffset++] = count + 2;
        indices[trianglesOffset++] = count + 2;
        indices[trianglesOffset++] = count + 1;
        indices[trianglesOffset++] = count + 3;
        count += 4;
        const l = rPos.get(i);
        const b = cPos.get(j);
        const r = rPos.get(i + 1);
        const t = cPos.get(j + 1);

        // left and bottom
        vertices[o] = wE0 * l + wE4 * b + wE12;
        vertices[o + 1] = wE1 * l + wE5 * b + wE13;
        vertices[o + 2] = wE2 * l + wE6 * b + wE14;
        // right and bottom
        vertices[o + 9] = wE0 * r + wE4 * b + wE12;
        vertices[o + 10] = wE1 * r + wE5 * b + wE13;
        vertices[o + 11] = wE2 * r + wE6 * b + wE14;
        // left and top
        vertices[o + 18] = wE0 * l + wE4 * t + wE12;
        vertices[o + 19] = wE1 * l + wE5 * t + wE13;
        vertices[o + 20] = wE2 * l + wE6 * t + wE14;
        // right and top
        vertices[o + 27] = wE0 * r + wE4 * t + wE12;
        vertices[o + 28] = wE1 * r + wE5 * t + wE13;
        vertices[o + 29] = wE2 * r + wE6 * t + wE14;
        o += 36;
      }
    }

    // @ts-ignore
    const bounds = renderer._bounds;
    bounds.min.set(rPos.get(0), cPos.get(0), 0);
    bounds.max.set(rPos.get(rowLength), cPos.get(columnLength), 0);
    bounds.transform(modelMatrix);
  }

  static updateUVs(renderer: ISpriteRenderer): void {
    const { _posRow: posRow, _posColumn: posColumn, _uvRow: uvRow, _uvColumn: uvColumn } = TiledSpriteAssembler;
    const rowLength = posRow.length - 1;
    const columnLength = posColumn.length - 1;
    const subChunk = renderer._subChunk;
    const vertices = subChunk.chunk.vertices;
    for (let j = 0, o = subChunk.vertexArea.start + 3; j < columnLength; j++) {
      const doubleJ = 2 * j;
      for (let i = 0; i < rowLength; i++) {
        const uvL = uvRow.get(2 * i);
        const uvB = uvColumn.get(doubleJ);
        const uvR = uvRow.get(2 * i + 1);
        const uvT = uvColumn.get(doubleJ + 1);
        if (Number.isNaN(uvL) || Number.isNaN(uvB) || Number.isNaN(uvR) || Number.isNaN(uvT)) {
          continue;
        }

        // left and bottom
        vertices[o] = uvL;
        vertices[o + 1] = uvB;
        // right and bottom
        vertices[o + 9] = uvR;
        vertices[o + 10] = uvB;
        // left and top
        vertices[o + 18] = uvL;
        vertices[o + 19] = uvT;
        // right and top
        vertices[o + 27] = uvR;
        vertices[o + 28] = uvT;
        o += 36;
      }
    }
  }

  static updateColor(renderer: ISpriteRenderer, alpha: number): void {
    const subChunk = renderer._subChunk;
    const { r, g, b, a } = renderer.color;
    const finalAlpha = a * alpha;
    const vertices = subChunk.chunk.vertices;
    const vertexArea = subChunk.vertexArea;
    for (let i = 0, o = vertexArea.start + 5, n = vertexArea.size / 9; i < n; ++i, o += 9) {
      vertices[o] = r;
      vertices[o + 1] = g;
      vertices[o + 2] = b;
      vertices[o + 3] = finalAlpha;
    }
  }

  private static _calculateDividing(
    renderer: ISpriteRenderer,
    width: number,
    height: number,
    rPos: DisorderedArray<number>,
    cPos: DisorderedArray<number>,
    rUV: DisorderedArray<number>,
    cUV: DisorderedArray<number>,
    referenceResolutionPerUnit: number
  ): number {
    const { sprite, tiledAdaptiveThreshold: threshold } = renderer;
    const { border } = sprite;
    const spritePositions = sprite._getPositions();
    const { x: left, y: bottom } = spritePositions[0];
    const { x: right, y: top } = spritePositions[3];
    const [spriteUV0, spriteUV1, spriteUV2, spriteUV3] = sprite._getUVs();
    const expectWidth = sprite.width * referenceResolutionPerUnit;
    const expectHeight = sprite.height * referenceResolutionPerUnit;
    const fixedL = expectWidth * border.x;
    const fixedR = expectWidth * border.z;
    const fixedLR = fixedL + fixedR;
    const fixedCW = expectWidth - fixedLR;
    const fixedT = expectHeight * border.w;
    const fixedB = expectHeight * border.y;
    const fixedTB = fixedT + fixedB;
    const fixedCH = expectHeight - fixedTB;
    const isAdaptive = renderer.tileMode === SpriteTileMode.Adaptive;
    let rType: TiledType, rBlocksCount: number, rTiledCount: number;
    let cType: TiledType, cBlocksCount: number, cTiledCount: number;
    if (fixedLR >= width) {
      rBlocksCount = 2;
      rType = TiledType.Compressed;
    } else {
      if (fixedCW > MathUtil.zeroTolerance) {
        rTiledCount = (width - fixedLR) / fixedCW;
        if (isAdaptive) {
          rTiledCount = rTiledCount % 1 >= threshold ? Math.ceil(rTiledCount) : Math.floor(rTiledCount);
          rBlocksCount = 2 + rTiledCount;
        } else {
          rBlocksCount = 2 + Math.ceil(rTiledCount);
        }
        rType = TiledType.WithTiled;
      } else {
        rBlocksCount = 2;
        rType = TiledType.WithoutTiled;
      }
    }
    if (fixedTB >= height) {
      cBlocksCount = 2;
      cType = TiledType.Compressed;
    } else {
      if (fixedCH > MathUtil.zeroTolerance) {
        cTiledCount = (height - fixedTB) / fixedCH;
        if (isAdaptive) {
          cTiledCount = cTiledCount % 1 >= threshold ? Math.ceil(cTiledCount) : Math.floor(cTiledCount);
          cBlocksCount = 2 + cTiledCount;
        } else {
          cBlocksCount = 2 + Math.ceil(cTiledCount);
        }
        cType = TiledType.WithTiled;
      } else {
        cBlocksCount = 2;
        cType = TiledType.WithoutTiled;
      }
    }

    rPos.length = cPos.length = rUV.length = cUV.length = 0;
    const vertexCount = rBlocksCount * cBlocksCount * 4;
    const maxVertexCount = renderer._getChunkManager().maxVertexCount;
    if (vertexCount > maxVertexCount) {
      rPos.add(width * left), rPos.add(width * right);
      cPos.add(height * bottom), cPos.add(height * top);
      rUV.add(spriteUV0.x), rUV.add(spriteUV3.x);
      cUV.add(spriteUV0.y), cUV.add(spriteUV3.y);
      Logger.warn(`The number of vertices exceeds the upper limit(${maxVertexCount}).`);
      return 4;
    }

    switch (rType) {
      case TiledType.Compressed:
        const scale = width / fixedLR;
        rPos.add(expectWidth * left * scale), rPos.add(fixedL * scale);
        rPos.add(width - expectWidth * (1 - right) * scale);
        rUV.add(spriteUV0.x), rUV.add(spriteUV1.x), rUV.add(spriteUV2.x), rUV.add(spriteUV3.x);
        break;
      case TiledType.WithoutTiled:
        rPos.add(expectWidth * left), rPos.add(fixedL), rPos.add(width - fixedR);
        rPos.add(width - expectWidth * (1 - right));
        rUV.add(spriteUV0.x), rUV.add(spriteUV1.x), rUV.add(NaN), rUV.add(NaN);
        rUV.add(spriteUV2.x), rUV.add(spriteUV3.x);
        break;
      case TiledType.WithTiled:
        const uv1 = spriteUV1.x;
        const uv2 = spriteUV2.x;
        const repeatWidth = (width - fixedLR) / rTiledCount;
        rPos.add(expectWidth * left), rPos.add(fixedL);
        rUV.add(spriteUV0.x), rUV.add(uv1), rUV.add(uv1);
        for (let i = 1, l = rBlocksCount - 2; i < l; i++) {
          rPos.add(fixedL + i * repeatWidth), rUV.add(uv2), rUV.add(uv1);
        }
        rPos.add(width - fixedR), rPos.add(width - expectWidth * (1 - right));
        isAdaptive ? rUV.add(uv2) : rUV.add((rTiledCount - (Math.ceil(rTiledCount) - 1)) * (uv2 - uv1) + uv1);
        rUV.add(uv2), rUV.add(spriteUV3.x);
        break;
      default:
        break;
    }

    switch (cType) {
      case TiledType.Compressed:
        const scale = height / fixedTB;
        cPos.add(expectHeight * bottom * scale), cPos.add(fixedB * scale);
        cPos.add(height - expectHeight * (1 - top) * scale);
        cUV.add(spriteUV0.y), cUV.add(spriteUV1.y), cUV.add(spriteUV2.y), cUV.add(spriteUV3.y);
        break;
      case TiledType.WithoutTiled:
        cPos.add(expectHeight * bottom), cPos.add(fixedB), cPos.add(height - fixedT);
        cPos.add(height - expectHeight * (1 - top));
        cUV.add(spriteUV0.y), cUV.add(spriteUV1.y), cUV.add(NaN), cUV.add(NaN);
        cUV.add(spriteUV2.y), cUV.add(spriteUV3.y);
        break;
      case TiledType.WithTiled:
        const uv1 = spriteUV1.y;
        const uv2 = spriteUV2.y;
        const repeatHeight = (height - fixedTB) / cTiledCount;
        cPos.add(expectHeight * bottom), cPos.add(fixedB);
        cUV.add(spriteUV0.y), cUV.add(uv1), cUV.add(uv1);
        for (let i = 1, l = cBlocksCount - 2; i < l; i++) {
          cPos.add(fixedB + i * repeatHeight), cUV.add(uv2), cUV.add(uv1);
        }
        cPos.add(height - fixedT), cPos.add(height - expectHeight * (1 - top));
        isAdaptive ? cUV.add(uv2) : cUV.add((cTiledCount - (Math.ceil(cTiledCount) - 1)) * (uv2 - uv1) + uv1);
        cUV.add(uv2), cUV.add(spriteUV3.y);
        break;
      default:
        break;
    }
    return vertexCount;
  }
}

enum TiledType {
  Compressed,
  WithoutTiled,
  WithTiled
}
