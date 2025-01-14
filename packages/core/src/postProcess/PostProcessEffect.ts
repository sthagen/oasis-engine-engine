import { PostProcessEffectParameter } from "./PostProcessEffectParameter";

/**
 * The base class for post process effect.
 */
export class PostProcessEffect {
  private _enabled = true;
  private _parameters: PostProcessEffectParameter<any>[] = [];
  private _parameterInitialized = false;

  /**
   * Indicates whether the post process effect is enabled.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    if (value === this._enabled) {
      return;
    }

    this._enabled = value;
  }

  /**
   * Whether the post process effect is valid.
   * @remarks
   * This method can be overridden to control the effect's real validity.
   */
  isValid(): boolean {
    return this._enabled;
  }

  /**
   * @internal
   */
  _lerp(to: PostProcessEffect, factor: number): void {
    const parameters = this._getParameters();
    const toParameters = to._getParameters();

    for (let i = 0, n = parameters.length; i < n; i++) {
      const toParameter = toParameters[i];
      if (toParameter.enabled) {
        parameters[i]._lerp(toParameter.value, factor);
      }
    }
  }

  /**
   * Get all parameters of the post process effect.
   * @remarks
   * Only get the parameters that are initialized in the constructor.
   * It will don't take effect if you add a new parameter after the post process effect is created, such as `effect.** = new PostProcessEffectParameter(1)`
   */
  private _getParameters(): PostProcessEffectParameter<any>[] {
    if (!this._parameterInitialized) {
      this._parameterInitialized = true;
      for (let key in this) {
        const value = this[key];
        if (value instanceof PostProcessEffectParameter) {
          this._parameters.push(value);
        }
      }
    }
    return this._parameters;
  }
}
