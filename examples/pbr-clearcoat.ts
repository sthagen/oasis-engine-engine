/**
 * @title PBR Clearcoat
 * @category Material
 * @thumbnail https://mdn.alipayobjects.com/merchant_appfe/afts/img/A*8ws-SZJCuvoAAAAAAAAAAAAADiR2AQ/original
 */
import { OrbitControl } from "@galacean/engine-toolkit-controls";
import {
  AmbientLight,
  AssetType,
  BackgroundMode,
  Camera,
  DirectLight,
  GLTFResource,
  Logger,
  PrimitiveMesh,
  SkyBoxMaterial,
  WebGLEngine,
} from "@galacean/engine";
Logger.enable();
// Create engine
WebGLEngine.create({ canvas: "canvas" }).then((engine) => {
  engine.canvas.resizeByClientSize();

  const scene = engine.sceneManager.activeScene;
  const { background } = scene;
  const rootEntity = scene.createRootEntity();

  const directLightNode = rootEntity.createChild("dir_light");
  directLightNode.addComponent(DirectLight);
  directLightNode.transform.setRotation(30, 0, 0);

  //Create camera
  const cameraNode = rootEntity.createChild("camera_node");
  cameraNode.transform.setPosition(0, 0, 15);
  cameraNode.addComponent(Camera);
  cameraNode.addComponent(OrbitControl);

  // Create sky
  const sky = background.sky;
  const skyMaterial = new SkyBoxMaterial(engine);
  background.mode = BackgroundMode.Sky;

  sky.material = skyMaterial;
  sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

  Promise.all([
    engine.resourceManager
      .load<GLTFResource>(
        "https://gw.alipayobjects.com/os/bmw-prod/16875768-21cf-481f-b05f-454c17866ba0.glb"
      )
      .then((gltf) => {
        const { defaultSceneRoot } = gltf;
        const entity = rootEntity.createChild();
        entity.addChild(defaultSceneRoot);
      }),
    engine.resourceManager
      .load<AmbientLight>({
        type: AssetType.Env,
        url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin",
      })
      .then((ambientLight) => {
        scene.ambientLight = ambientLight;
        skyMaterial.texture = ambientLight.specularTexture;
        skyMaterial.textureDecodeRGBM = true;
      }),
  ]).then(() => {
    engine.run();
  });
});
