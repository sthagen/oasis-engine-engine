import {
  Camera,
  CameraClearFlags,
  Canvas,
  ColorWriteMask,
  Engine,
  GLCapabilityType,
  IHardwareRenderer,
  IPlatformRenderTarget,
  IPlatformTexture2D,
  IPlatformTextureCube,
  Logger,
  Mesh,
  RenderTarget,
  SubMesh,
  Texture2D,
  Texture2DArray,
  TextureCube
} from "@oasis-engine/core";
import { IPlatformPrimitive } from "@oasis-engine/design";
import { Color, Vector4 } from "@oasis-engine/math";
import { GLCapability } from "./GLCapability";
import { GLExtensions } from "./GLExtensions";
import { GLPrimitive } from "./GLPrimitive";
import { GLRenderStates } from "./GLRenderStates";
import { GLRenderTarget } from "./GLRenderTarget";
import { GLTexture } from "./GLTexture";
import { GLTexture2D } from "./GLTexture2D";
import { GLTexture2DArray } from "./GLTexture2DArray";
import { GLTextureCube } from "./GLTextureCube";
import { WebGLExtension } from "./type";
import { WebCanvas } from "./WebCanvas";

/**
 * WebGL mode.
 */
export enum WebGLMode {
  /** Auto, use WebGL2.0 if support, or will fallback to WebGL1.0. */
  Auto = 0,
  /** WebGL2.0. */
  WebGL2 = 1,
  /** WebGL1.0, */
  WebGL1 = 2
}

/**
 * WebGL renderer options.
 */
export interface WebGLRendererOptions extends WebGLContextAttributes {
  /** WebGL mode.*/
  webGLMode?: WebGLMode;
}

/**
 * WebGL renderer, including WebGL1.0 and WebGL2.0.
 */
export class WebGLRenderer implements IHardwareRenderer {
  /** @internal */
  _readFrameBuffer: WebGLFramebuffer;

  _currentBind: any;

  private _options: WebGLRendererOptions;
  private _gl: (WebGLRenderingContext & WebGLExtension) | WebGL2RenderingContext;
  private _renderStates;
  private _extensions;
  private _capability: GLCapability;
  private _isWebGL2: boolean;
  private _webCanvas: WebCanvas;

  private _activeTextureID: number;
  private _activeTextures: GLTexture[] = new Array(32);

  // cache value
  private _lastViewport: Vector4 = new Vector4(null, null, null, null);
  private _lastClearColor: Color = new Color(null, null, null, null);
  private _scissorEnable: boolean = false;

  get isWebGL2() {
    return this._isWebGL2;
  }

  /**
   * GL Context
   * @member {WebGLRenderingContext}
   */
  get gl() {
    return this._gl;
  }

  get renderStates(): GLRenderStates {
    return this._renderStates;
  }

  get capability(): GLCapability {
    return this._capability;
  }

  get canIUseMoreJoints() {
    return this.capability.canIUseMoreJoints;
  }

  constructor(options: WebGLRendererOptions = {}) {
    this._options = options;
  }

  init(canvas: Canvas) {
    const option = this._options;
    option.alpha === undefined && (option.alpha = false);
    option.stencil === undefined && (option.stencil = true);
    const webCanvas = (this._webCanvas = (canvas as WebCanvas)._webCanvas);
    const webGLMode = option.webGLMode || WebGLMode.Auto;
    let gl: (WebGLRenderingContext & WebGLExtension) | WebGL2RenderingContext;

    if (webGLMode == WebGLMode.Auto || webGLMode == WebGLMode.WebGL2) {
      gl = webCanvas.getContext("webgl2", option);
      if (!gl && webCanvas instanceof HTMLCanvasElement) {
        gl = <WebGL2RenderingContext>webCanvas.getContext("experimental-webgl2", option);
      }
      this._isWebGL2 = true;

      // Prevent weird browsers to lie (such as safari!)
      if (gl && !(<WebGL2RenderingContext>gl).deleteQuery) {
        this._isWebGL2 = false;
      }
    }

    if (!gl) {
      if (webGLMode == WebGLMode.Auto || webGLMode == WebGLMode.WebGL1) {
        gl = <WebGLRenderingContext & WebGLExtension>webCanvas.getContext("webgl", option);
        if (!gl && webCanvas instanceof HTMLCanvasElement) {
          gl = <WebGLRenderingContext & WebGLExtension>webCanvas.getContext("experimental-webgl", option);
        }
        this._isWebGL2 = false;
      }
    }

    if (!gl) {
      throw new Error("Get GL Context FAILED.");
    }

    this._gl = gl;
    this._activeTextureID = gl.TEXTURE0;
    this._renderStates = new GLRenderStates(gl);
    this._extensions = new GLExtensions(this);
    this._capability = new GLCapability(this);
    // Make sure the active texture in gl context is on default, because gl context may be used in other webgl renderer.
    gl.activeTexture(gl.TEXTURE0);

    this._options = null;
  }

  createPlatformPrimitive(primitive: Mesh): IPlatformPrimitive {
    return new GLPrimitive(this, primitive);
  }

  createPlatformTexture2D(texture2D: Texture2D): IPlatformTexture2D {
    return new GLTexture2D(this, texture2D);
  }

  createPlatformTexture2DArray(texture2D: Texture2DArray): GLTexture2DArray {
    return new GLTexture2DArray(this, texture2D);
  }

  createPlatformTextureCube(textureCube: TextureCube): IPlatformTextureCube {
    return new GLTextureCube(this, textureCube);
  }

  createPlatformRenderTarget(target: RenderTarget): IPlatformRenderTarget {
    return new GLRenderTarget(this, target);
  }

  requireExtension(ext) {
    return this._extensions.requireExtension(ext);
  }

  canIUse(capabilityType: GLCapabilityType) {
    return this.capability.canIUse(capabilityType);
  }

  canIUseCompressedTextureInternalFormat(type: number) {
    return this.capability.canIUseCompressedTextureInternalFormat(type);
  }

  viewport(x: number, y: number, width: number, height: number): void {
    const { _gl: gl, _lastViewport: lv } = this;
    if (x !== lv.x || y !== lv.y || width !== lv.z || height !== lv.w) {
      const { _webCanvas: webCanvas } = this;
      if (x === 0 && y === 0 && width === webCanvas.width && height === webCanvas.height) {
        if (this._scissorEnable) {
          gl.disable(gl.SCISSOR_TEST);
          this._scissorEnable = false;
        }
      } else {
        if (!this._scissorEnable) {
          gl.enable(gl.SCISSOR_TEST);
          this._scissorEnable = true;
        }
        gl.scissor(x, y, width, height);
      }
      gl.viewport(x, y, width, height);
      lv.set(x, y, width, height);
    }
  }

  colorMask(r, g, b, a) {
    this._gl.colorMask(r, g, b, a);
  }

  clearRenderTarget(engine: Engine, clearFlags: CameraClearFlags, clearColor: Color) {
    const gl = this._gl;
    const {
      blendState: { targetBlendState },
      depthState,
      stencilState
    } = engine._lastRenderState;
    let clearFlag = 0;
    if (clearFlags & CameraClearFlags.Color) {
      clearFlag |= gl.COLOR_BUFFER_BIT;

      const lc = this._lastClearColor;
      const { r, g, b, a } = clearColor;
      if (clearColor && (r !== lc.r || g !== lc.g || b !== lc.b || a !== lc.a)) {
        gl.clearColor(r, g, b, a);
        lc.set(r, g, b, a);
      }

      if (targetBlendState.colorWriteMask !== ColorWriteMask.All) {
        gl.colorMask(true, true, true, true);
        targetBlendState.colorWriteMask = ColorWriteMask.All;
      }
    }
    if (clearFlags & CameraClearFlags.Depth) {
      clearFlag |= gl.DEPTH_BUFFER_BIT;
      if (depthState.writeEnabled !== true) {
        gl.depthMask(true);
        depthState.writeEnabled = true;
      }
    }
    if (clearFlags & CameraClearFlags.Stencil) {
      clearFlag |= gl.STENCIL_BUFFER_BIT;
      if (stencilState.writeMask !== 0xff) {
        gl.stencilMask(0xff);
        stencilState.writeMask = 0xff;
      }
    }
    gl.clear(clearFlag);
  }

  drawPrimitive(primitive: Mesh, subPrimitive: SubMesh, shaderProgram: any) {
    // todo: VAO not support morph animation
    if (primitive) {
      //@ts-ignore
      primitive._draw(shaderProgram, subPrimitive);
    } else {
      Logger.error("draw primitive failed.");
    }
  }

  activeRenderTarget(renderTarget: RenderTarget, camera: Camera, mipLevel: number) {
    const gl = this._gl;
    if (renderTarget) {
      /** @ts-ignore */
      (renderTarget._platformRenderTarget as GLRenderTarget)?._activeRenderTarget();
      const { width, height } = renderTarget;
      this.viewport(0, 0, width >> mipLevel, height >> mipLevel);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const viewport = camera.viewport;
      const { drawingBufferWidth, drawingBufferHeight } = gl;
      const width = drawingBufferWidth * viewport.z;
      const height = drawingBufferHeight * viewport.w;
      const x = viewport.x * drawingBufferWidth;
      const y = drawingBufferHeight - viewport.y * drawingBufferHeight - height;
      this.viewport(x, y, width, height);
    }
  }

  destroy() {}

  activeTexture(textureID: number): void {
    if (this._activeTextureID !== textureID) {
      this._gl.activeTexture(textureID);
      this._activeTextureID = textureID;
    }
  }

  bindTexture(texture: GLTexture): void {
    const index = this._activeTextureID - this._gl.TEXTURE0;
    if (this._activeTextures[index] !== texture) {
      this._gl.bindTexture(texture._target, texture._glTexture);
      this._activeTextures[index] = texture;
    }
  }
}
