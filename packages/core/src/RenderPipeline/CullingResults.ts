import { RenderQueueType } from "../shader";
import { BatcherManager } from "./BatcherManager";
import { RenderQueue } from "./RenderQueue";

/**
 * @internal
 * Culling results.
 */
export class CullingResults {
  readonly opaqueQueue: RenderQueue;
  readonly transparentQueue: RenderQueue;
  readonly alphaTestQueue: RenderQueue;

  constructor() {
    this.opaqueQueue = new RenderQueue(RenderQueueType.Opaque);
    this.transparentQueue = new RenderQueue(RenderQueueType.Transparent);
    this.alphaTestQueue = new RenderQueue(RenderQueueType.AlphaTest);
  }

  reset(): void {
    this.opaqueQueue.clear();
    this.transparentQueue.clear();
    this.alphaTestQueue.clear();
  }

  sortBatch(batcherManager: BatcherManager) {
    this.opaqueQueue.sortBatch(RenderQueue.compareForOpaque, batcherManager);
    this.alphaTestQueue.sortBatch(RenderQueue.compareForOpaque, batcherManager);
    this.transparentQueue.sortBatch(RenderQueue.compareForTransparent, batcherManager);
  }

  destroy(): void {
    this.opaqueQueue.destroy();
    this.transparentQueue.destroy();
    this.alphaTestQueue.destroy();
  }
}
