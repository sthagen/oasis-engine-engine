import { VertexData2D } from "../2d/data/VertexData2D";
import { Material } from "../material/Material";
import { Renderer } from "../Renderer";
import { Texture2D } from "../texture";
import { RenderData } from "./RenderData";

export class SpriteRenderData extends RenderData {
  verticesData: VertexData2D;
  texture: Texture2D;
  dataIndex: number; // Add for CanvasRenderer plugin.

  constructor() {
    super();
    this.multiRenderData = false;
  }

  set(
    component: Renderer,
    material: Material,
    verticesData: VertexData2D,
    texture: Texture2D,
    dataIndex: number = 0
  ): void {
    this.component = component;
    this.material = material;

    this.verticesData = verticesData;
    this.texture = texture;
    this.dataIndex = dataIndex;
  }
}
