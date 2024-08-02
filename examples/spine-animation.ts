/**
 * @title Spine Animation
 * @category 2D
 * @thumbnail https://mdn.alipayobjects.com/merchant_appfe/afts/img/A*IALeTYOXMXwAAAAAAAAAAAAADiR2AQ/original
 */
import { Camera, Entity, Logger, Vector3, WebGLEngine } from "@galacean/engine";
import { SpineAnimationRenderer } from "@galacean/engine-spine";

Logger.enable();

// Create engine
WebGLEngine.create({ canvas: "canvas" }).then((engine) => {
  engine.canvas.resizeByClientSize();

  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity();

  // camera
  const cameraEntity = rootEntity.createChild("camera_node");
  const camera = cameraEntity.addComponent(Camera);
  cameraEntity.transform.position = new Vector3(0, 0, 100);
  camera.nearClipPlane = 0.001;
  camera.farClipPlane = 20000;

  engine.resourceManager
    .load({
      url: "https://mdn.alipayobjects.com/huamei_kz4wfo/uri/file/as/2/kz4wfo/4/mp/qGISZ7QTJFkEL0Qx/spineboy/spineboy.json",
      type: "spine",
    })
    .then((spineResource: any) => {
      const spineEntity = new Entity(engine);
      spineEntity.transform.setPosition(0, -18, 0);
      const spine = spineEntity.addComponent(SpineAnimationRenderer);
      spine.resource = spineResource;
      spine.defaultState.scale = 0.05;
      rootEntity.addChild(spineEntity);
      const { state } = spine;
      state.data.defaultMix = 0.3;
      state.data.setMix('death', 'portal', 0);
      const queue = () => {
        state.setAnimation(0, 'portal', false);
        state.addAnimation(0, 'idle', true, 0);
        state.addAnimation(0, 'walk', true, 1);
        state.addAnimation(0, 'run', true, 2);
        state.addAnimation(0, 'jump', false, 2);
        state.addAnimation(0, 'death', false, 0);
      };
      queue();
      state.addListener({
        complete: (entry) => {
          if (entry?.animation?.name === 'death') {
            setTimeout(() => {
              queue();
            }, 1000);
          }
        }
      });
    });

  engine.run();
});
