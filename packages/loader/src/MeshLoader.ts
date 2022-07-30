import {
  resourceLoader,
  Loader,
  AssetPromise,
  AssetType,
  LoadItem,
  ResourceManager,
  ModelMesh
} from "@oasis-engine/core";
import { decode } from "./resource-deserialize";

@resourceLoader(AssetType.Mesh, ["mesh"])
class MeshLoader extends Loader<ModelMesh> {
  load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<ModelMesh> {
    return new AssetPromise((resolve) => {
      this.request<any>(item.url, {
        ...item,
        type: "arraybuffer"
      })
        .then((data) => {
          return decode<ModelMesh>(data, resourceManager.engine);
        })
        .then((mesh) => {
          resolve(mesh);
        });
    });
  }
}
