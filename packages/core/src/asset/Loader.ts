import { LoadItem } from "./LoadItem";
import { AssetPromise } from "./AssetPromise";
import { RequestConfig, request } from "./request";
import { ResourceManager } from "./ResourceManager";
/**
 * Loader abstract class.
 */
export abstract class Loader<T> {
  /**
   * Register a class with a string name for serialization and deserialization.
   * @param key - class name
   * @param obj - class object
   */
  public static registerClass(className: string, classDefine: { new (...args: any): any }) {
    this._engineObjects[className] = classDefine;
  }

  /**
   * Get the class object by class name.
   * @param key - class name
   * @returns class object
   */
  public static getClass(className: string): { new (...args: any): any } {
    return this._engineObjects[className];
  }

  private static _engineObjects: { [key: string]: any } = {};
  request: <U>(url: string, config: RequestConfig) => AssetPromise<U> = request;
  abstract load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<T>;
  constructor(public readonly useCache: boolean) {}
}
