import { Camera, dependentComponents, DependentMode, Entity, MeshRenderer, Script } from "@galacean/engine-core";
import { WebGLEngine } from "@galacean/engine-rhi-webgl";
import { expect } from "chai";

const canvasDOM = document.createElement("canvas");
canvasDOM.width = 1024;
canvasDOM.height = 1024;

describe("Component dependencies test", function () {
  let entity: Entity;
  let camera: Camera;
  before(async () => {
    const engine = await WebGLEngine.create({ canvas: canvasDOM });
    entity = engine.sceneManager.activeScene.createRootEntity();
    camera = entity.addComponent(Camera);
  });

  it("Super dependencies add check", () => {
    expect(() => {
      entity.addComponent(CustomScriptB);
    }).throw("Should add MeshRenderer before adding CustomScriptA");
  });

  it("Super dependencies remove check", () => {
    expect(() => {
      const meshRenderer = entity.addComponent(MeshRenderer);
      entity.addComponent(CustomScriptB);
      meshRenderer.destroy();
    }).throw("Should remove CustomScriptA before adding MeshRenderer");
  });
});

@dependentComponents(MeshRenderer, DependentMode.CheckOnly)
export class CustomScriptA extends Script {}

export class CustomScriptB extends CustomScriptA {}
