import { AssetType, ResourceManager, Texture2D } from "@galacean/engine";
import "@galacean/engine-loader";
import { WebGLEngine } from "@galacean/engine-rhi-webgl";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("ResourceManager", () => {
  let engine: WebGLEngine;
  beforeAll(async function () {
    engine = await WebGLEngine.create({ canvas: document.createElement("canvas") });
    engine.run();
  });

  beforeEach(() => {
    engine.sceneManager.activeScene.createRootEntity("root");
  });
  describe("getFromCache test", () => {
    it("findEntityByName", () => {
      const texture = new Texture2D(engine, 128, 128);
      const textureUrl = "aa/bb/cc";

      // @ts-ignore
      engine.resourceManager._assetUrlPool[textureUrl] = texture;

      let getResource = engine.resourceManager.getFromCache(textureUrl);
      expect(getResource).equal(texture);

      const wrongUrl = "aa/bb/ccX";
      getResource = engine.resourceManager.getFromCache(wrongUrl);
      expect(getResource).equal(null);
    });
  });

  describe("findResourcesByType", () => {
    it("findResourcesByType", () => {
      const textures = engine.resourceManager.findResourcesByType(Texture2D);
      expect(textures.length).equal(5);
    });
  });

  describe("queryPath", () => {
    it("no encode", () => {
      // @ts-ignore
      const { assetBaseURL } = engine.resourceManager._parseURL(
        "https://cdn.ali.com/inner.jpg?x-oss-process=image/resize,l_1024"
      );
      expect(assetBaseURL).equal("https://cdn.ali.com/inner.jpg?x-oss-process=image/resize,l_1024");
    });

    it("encode", () => {
      // @ts-ignore
      const { assetBaseURL } = engine.resourceManager._parseURL(
        "https://cdn.ali.com/inner.jpg?x-oss-process=image%25resize,l_1024"
      );
      expect(assetBaseURL).equal("https://cdn.ali.com/inner.jpg?x-oss-process=image%25resize,l_1024");
    });

    it("query path", () => {
      // @ts-ignore
      const { assetBaseURL, queryPath } = engine.resourceManager._parseURL("https://cdn.ali.com/inner.jpg?q=abc");
      expect(assetBaseURL).equal("https://cdn.ali.com/inner.jpg");
      expect(queryPath).equal("abc");
    });
  });

  describe("load subAsset", () => {
    it("no repeat network query", () => {
      // @ts-ignore
      const glTFLoader = ResourceManager._loaders["GLTF"];

      const loaderSpy = vi.spyOn(glTFLoader, "load");

      engine.resourceManager.load("https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb");
      engine.resourceManager.load("https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb");
      engine.resourceManager.load(
        "https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb?q=materials[0]"
      );
      expect(loaderSpy).toHaveBeenCalled();
    });
  });

  describe("gltf subAsset load", () => {
    it("invalid q case", async () => {
      const loadRes = await engine.resourceManager.load({
        // contains invalid q value cdn url.
        url: "https://mdn.alipayobjects.com/huamei_aftkdx/afts/file/A*_Ao1QZtL9fMAAAAAAAAAAAAADteEAQ/mock-project.json",
        type: AssetType.Project
      });
      expect(loadRes).to.equal(undefined);
    });

    // TODO: case for gltf loader load invalid q url, expect to throw
  });

  describe("load asset", () => {
    it("not found", async () => {
      try {
        await engine.resourceManager.load("/model.glb");
      } catch (e) {
        expect(e).to.be.an.instanceOf(Error);
      }
    });
  });
});
