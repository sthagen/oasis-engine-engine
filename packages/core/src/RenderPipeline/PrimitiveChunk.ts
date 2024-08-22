import { Engine } from "../Engine";
import {
  Buffer,
  BufferBindFlag,
  BufferUsage,
  IndexBufferBinding,
  IndexFormat,
  MeshTopology,
  Primitive,
  SetDataOptions,
  SubMesh,
  VertexBufferBinding,
  VertexElement,
  VertexElementFormat
} from "../graphic";
import { ReturnableObjectPool } from "../utils/ReturnableObjectPool";
import { SubPrimitiveChunk } from "./SubPrimitiveChunk";
import { VertexArea } from "./VertexArea";

/**
 * @internal
 */
export class PrimitiveChunk {
  static areaPool = new ReturnableObjectPool(VertexArea, 10);
  static subChunkPool = new ReturnableObjectPool(SubPrimitiveChunk, 10);
  static subMeshPool = new ReturnableObjectPool(SubMesh, 10);

  primitive: Primitive;
  vertices: Float32Array;
  indices: Uint16Array;

  updateVertexStart = Number.MAX_SAFE_INTEGER;
  updateVertexEnd = Number.MIN_SAFE_INTEGER;
  updateIndexLength = 0;

  vertexFreeAreas: Array<VertexArea>;

  constructor(engine: Engine, maxVertexCount: number) {
    const primitive = new Primitive(engine);

    // Vertex elements
    primitive.addVertexElement(new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0));
    primitive.addVertexElement(new VertexElement("TEXCOORD_0", 12, VertexElementFormat.Vector2, 0));
    primitive.addVertexElement(new VertexElement("COLOR_0", 20, VertexElementFormat.Vector4, 0));
    primitive._addReferCount(1);

    // Vertices
    const vertexStride = 36;
    const vertexBuffer = new Buffer(
      engine,
      BufferBindFlag.VertexBuffer,
      maxVertexCount * vertexStride,
      BufferUsage.Dynamic,
      true
    );
    primitive.setVertexBufferBinding(0, new VertexBufferBinding(vertexBuffer, vertexStride));

    // Indices
    const indexBuffer = new Buffer(engine, BufferBindFlag.IndexBuffer, maxVertexCount * 8, BufferUsage.Dynamic, true);
    primitive.setIndexBufferBinding(new IndexBufferBinding(indexBuffer, IndexFormat.UInt16));

    this.primitive = primitive;
    this.vertices = new Float32Array(vertexBuffer.data.buffer);
    this.indices = new Uint16Array(indexBuffer.data.buffer);
    this.vertexFreeAreas = [new VertexArea(0, maxVertexCount * 9)];
  }

  allocateSubChunk(vertexCount: number): SubPrimitiveChunk | null {
    const area = this._allocateArea(vertexCount * 9);
    if (area) {
      const subChunk = PrimitiveChunk.subChunkPool.get();
      subChunk.chunk = this;
      subChunk.vertexArea = area;

      const subMesh = PrimitiveChunk.subMeshPool.get();
      subMesh.topology = MeshTopology.Triangles;
      subChunk.subMesh = subMesh;
      return subChunk;
    }

    return null;
  }

  freeSubChunk(subChunk: SubPrimitiveChunk): void {
    this._freeArea(subChunk.vertexArea);
    PrimitiveChunk.subMeshPool.return(subChunk.subMesh);
    PrimitiveChunk.subChunkPool.return(subChunk);
  }

  uploadBuffer(): void {
    // Set data option use Discard, or will resulted in performance slowdown when open antialias and cross-rendering of 3D and 2D elements.
    // Device: iphone X(16.7.2)、iphone 15 pro max(17.1.1)、iphone XR(17.1.2) etc.
    const { primitive, updateVertexStart, updateVertexEnd } = this;
    if (updateVertexStart !== Number.MAX_SAFE_INTEGER && updateVertexEnd !== Number.MIN_SAFE_INTEGER) {
      primitive.vertexBufferBindings[0].buffer.setData(
        this.vertices,
        updateVertexStart * 4,
        updateVertexStart,
        updateVertexEnd - updateVertexStart,
        SetDataOptions.Discard
      );

      this.updateVertexStart = Number.MAX_SAFE_INTEGER;
      this.updateVertexEnd = Number.MIN_SAFE_INTEGER;
    }

    primitive.indexBufferBinding.buffer.setData(this.indices, 0, 0, this.updateIndexLength, SetDataOptions.Discard);
    this.updateIndexLength = 0;
  }

  destroy(): void {
    this.primitive._addReferCount(-1);
    this.primitive.destroy();
    this.primitive = null;
    this.vertices = null;
    this.indices = null;
  }

  private _allocateArea(needSize: number): VertexArea | null {
    const areas = this.vertexFreeAreas;
    const pool = PrimitiveChunk.areaPool;
    for (let i = 0, n = areas.length; i < n; ++i) {
      const area = areas[i];
      const size = area.size;
      if (size > needSize) {
        const newArea = pool.get();
        newArea.start = area.start;
        newArea.size = needSize;
        area.start += needSize;
        area.size -= needSize;
        return newArea;
      } else if (size === needSize) {
        areas.splice(i, 1);
        return area;
      }
    }
    return null;
  }

  private _freeArea(area: VertexArea): void {
    const { start, size } = area;
    const freeAreas = this.vertexFreeAreas;
    const end = start + size;
    const pool = PrimitiveChunk.areaPool;
    for (let i = 0, areaLen = freeAreas.length; i < areaLen; ++i) {
      const curFreeArea = freeAreas[i];
      const curStart = curFreeArea.start;
      const curEnd = curStart + curFreeArea.size;

      if (end < curStart) {
        // The area to be freed is to the left of the current free area and is not connected
        freeAreas.splice(i, 0, area);
        return;
      } else if (end === curStart) {
        // The area to be freed is to the left of the current free area and is connected
        curFreeArea.start = start;
        curFreeArea.size += size;
        pool.return(area);
        return;
      } else if (start === curEnd) {
        // The area to be freed is to the right of the current free area and is connected
        curFreeArea.size += size;
        pool.return(area);
        const nextIndex = i + 1;
        if (nextIndex < areaLen) {
          const nextFreeArea = freeAreas[nextIndex];
          if (end === nextFreeArea.start) {
            // The cur free area after merge is to the left of the next free area and is connected
            curFreeArea.size += nextFreeArea.size;
            freeAreas.splice(nextIndex, 1);
            pool.return(nextFreeArea);
          }
        }
        return;
      }
    }

    // The area to be freed is to the right of the last free area and is not connected or free areas is empty
    freeAreas.push(area);
  }
}
