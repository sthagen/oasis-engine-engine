import { WebGLEngine } from "@oasis-engine/rhi-webgl";
import { RenderBufferDepthFormat, RenderTarget, Texture2D } from "@oasis-engine/core";
import { expect } from "chai";

describe("RenderTarget", () => {
  const width = 1024;
  const height = 1024;

  const canvas = document.createElement("canvas");
  const engine = new WebGLEngine(canvas);
  const rhi = engine._hardwareRenderer;
  const isWebGL2 = rhi.isWebGL2;
  const maxAntiAliasing = rhi.capability._maxAntiAliasing;

  beforeEach(() => {
    rhi._isWebGL2 = isWebGL2;
    rhi.capability._maxAntiAliasing = maxAntiAliasing;
  });

  describe("创建渲染目标", () => {
    const renderColorTexture = new Texture2D(engine, width, height);
    const renderColorTexture2 = new Texture2D(engine, width, height);
    const renderDepthTexture = new Texture2D(engine, width, height);

    it("创建渲染目标-通过颜色纹理和深度格式", () => {
      const renderTarget = new RenderTarget(engine, width, height, renderColorTexture);

      expect(renderTarget.colorTextureCount).to.eq(1);
      expect(renderTarget.getColorTexture(0)).to.eq(renderColorTexture);
      expect(renderTarget.depthTexture).to.be.undefined;
    });

    it("创建渲染目标-通过颜色纹理和深度纹理", () => {
      // const renderTarget = new RenderTarget(engine, width, height, renderColorTexture, renderDepthTexture);
      // expect(renderTarget.colorTextureCount).toBe(1);
      // expect(renderTarget.getColorTexture(0)).toBe(renderColorTexture);
      // expect(renderTarget.depthTexture).toBe(renderDepthTexture);
    });

    it("创建渲染目标-只生成深度纹理", () => {
      // const renderTarget = new RenderTarget(engine, width, height, null, renderDepthTexture);
      // expect(renderTarget.colorTextureCount).toBe(0);
      // expect(renderTarget.getColorTexture(0)).toBeUndefined();
      // expect(renderTarget.depthTexture).toBe(renderDepthTexture);
    });

    it("创建渲染目标-通过颜色纹理数组和深度格式", () => {
      const renderTarget = new RenderTarget(engine, width, height, [renderColorTexture, renderColorTexture2]);

      expect(renderTarget.colorTextureCount).to.eq(2);
      expect(renderTarget.getColorTexture(0)).to.eq(renderColorTexture);
      expect(renderTarget.getColorTexture(1)).to.eq(renderColorTexture2);
      expect(renderTarget.depthTexture).to.be.undefined;
    });

    it("创建渲染目标-通过颜色纹理数组和深度纹理", () => {
      // const renderTarget = new RenderTarget(
      //   engine,
      //   width,
      //   height,
      //   [renderColorTexture, renderColorTexture2],
      //   renderDepthTexture
      // );
      // expect(renderTarget.colorTextureCount).toBe(2);
      // expect(renderTarget.getColorTexture(0)).toBe(renderColorTexture);
      // expect(renderTarget.getColorTexture(1)).toBe(renderColorTexture2);
      // expect(renderTarget.depthTexture).toBe(renderDepthTexture);
    });

    it("创建失败-不支持高精度深度缓冲", () => {
      expect(() => {
        rhi.canIUse.mockReturnValueOnce(false);
        new RenderTarget(engine, width, height, renderColorTexture, RenderBufferDepthFormat.Depth32);
      }).to.throw;
    });

    it("创建失败-不支持高精度深度模版缓冲", () => {
      expect(() => {
        rhi.canIUse.mockReturnValueOnce(false);
        new RenderTarget(engine, width, height, renderColorTexture, RenderBufferDepthFormat.Depth32Stencil8);
      }).to.throw;
    });

    it("创建失败-不支持MRT", () => {
      expect(() => {
        rhi.canIUse.mockReturnValueOnce(false);
        new RenderTarget(engine, width, height, [renderColorTexture, renderColorTexture2]);
      }).to.throw;
    });

    // it("创建失败-不支持MRT+Cube+[,MSAA]", () => {
    //   expect(() => {
    //     const cubeRenderColorTexture = new TextureCube(engine, width);
    //     new RenderTarget(engine, width, height, [renderColorTexture, cubeRenderColorTexture]);
    //   }).toThrow();
    // });

    it("创建降级-MSAA自动降级", () => {
      rhi.capability._maxAntiAliasing = 1;

      const renderTarget = new RenderTarget(engine, width, height, renderColorTexture, undefined, 2);

      expect(renderTarget.antiAliasing).to.eq(1);
    });

    it("销毁", () => {
      const renderTarget = new RenderTarget(engine, width, height, renderColorTexture);

      expect(renderTarget.colorTextureCount).to.eq(1);
      expect(renderTarget.getColorTexture()).to.eq(renderColorTexture);

      renderTarget.destroy();

      expect(renderTarget.colorTextureCount).to.eq(0);
      expect(renderTarget.getColorTexture()).to.be.undefined;
    });
  });
});
