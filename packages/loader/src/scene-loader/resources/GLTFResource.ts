import {
  AssetType,
  Entity,
  Logger,
  MeshRenderer,
  PBRMaterial,
  PBRSpecularMaterial,
  ResourceManager,
  UnlitMaterial
} from "@oasis-engine/core";
import { Oasis } from "../Oasis";
import { AssetConfig, LoadAttachedResourceResult } from "../types";
import { BlinnPhongMaterialResource } from "./BlinnPhongMaterialResource";
import { PBRMaterialResource } from "./PBRMaterialResource";
import { PBRSpecularMaterialResource } from "./PBRSpecularMaterialResource";
import { SchemaResource } from "./SchemaResource";
import { UnlitMaterialResource } from "./UnlitMaterialResource";

export class GLTFResource extends SchemaResource {
  load(resourceManager: ResourceManager, assetConfig: AssetConfig, oasis: Oasis): Promise<any> {
    return resourceManager
      .load<any>({ url: assetConfig.url, type: AssetType.Perfab })
      .then((res) => {
        const gltf = res;
        if (assetConfig.props) {
          gltf.newMaterial = (assetConfig.props as any).newMaterial;
        }
        this._resource = gltf;
      });
  }

  loadWithAttachedResources(
    resourceManager: ResourceManager,
    assetConfig: AssetConfig,
    oasis: Oasis
  ): Promise<LoadAttachedResourceResult> {
    return new Promise((resolve) => {
      this.load(resourceManager, assetConfig, oasis).then(() => {
        const gltf = this.resource;
        const { materials } = gltf;
        const loadPromises = [];
        const result = {
          resources: [this],
          structure: {
            index: 0,
            props: {
              newMaterial: []
            }
          }
        };
        if (materials?.length) {
          for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            let materialResource = null;
            let type = "";

            if (material instanceof PBRMaterial) {
              materialResource = new PBRMaterialResource(this.resourceManager);
              type = "PBRMaterial";
            } else if (material instanceof UnlitMaterial) {
              materialResource = new UnlitMaterialResource(this.resourceManager);
              type = "UnlitMaterial";
            } else if (material instanceof PBRSpecularMaterial) {
              materialResource = new PBRSpecularMaterialResource(this.resourceManager);
              type = "PBRSpecularMaterial";
            } else {
              materialResource = new BlinnPhongMaterialResource(this.resourceManager);
              type = "BlinnPhongMaterial";
            }

            this._attachedResources.push(materialResource);
            loadPromises.push(
              materialResource.loadWithAttachedResources(resourceManager, {
                type,
                name: material.name,
                resource: material
              })
            );
          }
        }
        Promise.all(loadPromises).then((res) => {
          const newMaterial = result.structure.props.newMaterial;
          res.forEach((mat) => {
            const matStructure = mat.structure;
            const matResource = mat.resources[matStructure.index];
            result.resources.push(matResource);
            matStructure.index = result.resources.length - 1;
            for (const key in matStructure.props) {
              if (matStructure.props.hasOwnProperty(key)) {
                const textureStructure = matStructure.props[key];
                const textureResource = mat.resources[textureStructure.index];
                result.resources.push(textureResource);
                textureStructure.index = result.resources.length - 1;
              }
            }
            newMaterial.push(matStructure);
          });
          resolve(result);
        });
      });
    });
  }

  setMeta(assetConfig?: AssetConfig) {
    if (assetConfig) {
      this.meta.name = assetConfig.name;
    }
  }

  bind() {
    const resource = this._resource;
    this.bindMaterials(resource.newMaterial);
  }

  update(key: string, value: any) {
    if (key === "newMaterial") {
      this.bindMaterials(value);
    } else {
      this._resource[key] = value;
    }
  }

  private bindMaterials(newMaterialsConfig) {
    const newMaterialCount = newMaterialsConfig.length;
    if (!newMaterialsConfig || !newMaterialsConfig.length) {
      return;
    }

    const gltf = this._resource;

    const newMaterials = new Array(newMaterialCount);
    gltf.newMaterial = newMaterials;

    for (let i = 0; i < newMaterialsConfig.length; i++) {
      const mtlResource = this.resourceManager.get(newMaterialsConfig[i].id);
      if (mtlResource) {
        this._attachedResources.push(mtlResource);
        newMaterials[i] = mtlResource.resource;
      } else {
        Logger.warn(
          `GLTFResource: ${this.meta.name} can't find asset "material", which id is: ${newMaterialsConfig[i].id}`
        );
      }
    }

    const gltfRoot = gltf.defaultSceneRoot as Entity;
    const originMaterials = gltf.materials;
    const meshRenderers: MeshRenderer[] = gltfRoot.getComponentsIncludeChildren(MeshRenderer, []);

    for (let i = 0; i < newMaterialCount; i++) {
      const newMaterial = newMaterials[i];
      const originMaterial = originMaterials[i];
      for (let j = 0; j < meshRenderers.length; j++) {
        const meshRenderer = meshRenderers[j];
        const meshMaterials = meshRenderer.getMaterials();
        for (let k = 0; k < meshMaterials.length; k++) {
          if (originMaterial === meshMaterials[k]) {
            meshRenderer.setMaterial(k, newMaterial);
          }
        }
      }
    }
  }
}
