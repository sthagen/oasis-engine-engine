import {
  Logger,
  Material,
  PBRMaterial,
  PBRSpecularMaterial,
  RenderFace,
  TextureCoordinate,
  UnlitMaterial
} from "@oasis-engine/core";
import { Color } from "@oasis-engine/math";
import { GLTFResource } from "../GLTFResource";
import { MaterialAlphaMode } from "../Schema";
import { Parser } from "./Parser";
import { ParserContext } from "./ParserContext";

export class MaterialParser extends Parser {
  /** @internal */
  static _parseTextureTransform(material: Material, extensions: any = {}, context: GLTFResource): void {
    const schema = extensions.KHR_texture_transform;
    if (schema) {
      Parser.parseEngineResource("KHR_texture_transform", schema, material, context);
    }
  }

  parse(context: ParserContext) {
    const { glTFResource, materialIndex } = context;

    const { gltf, engine, textures } = glTFResource;
    if (!gltf.materials) return;

    const materials: Material[] = [];

    for (let i = 0; i < gltf.materials.length; i++) {
      if (materialIndex >= 0 && materialIndex !== i) {
        continue;
      }
      const {
        extensions = {},
        pbrMetallicRoughness,
        normalTexture,
        occlusionTexture,
        emissiveTexture,
        emissiveFactor,
        alphaMode,
        alphaCutoff,
        doubleSided,
        name = ""
      } = gltf.materials[i];

      const {
        KHR_materials_unlit,
        KHR_materials_pbrSpecularGlossiness,
        KHR_materials_clearcoat,
        OASIS_materials_remap
      } = extensions;

      let material: UnlitMaterial | PBRMaterial | PBRSpecularMaterial = null;

      if (KHR_materials_unlit) {
        material = <UnlitMaterial>Parser.createEngineResource("KHR_materials_unlit", KHR_materials_unlit, glTFResource);
      } else if (KHR_materials_pbrSpecularGlossiness) {
        material = <PBRSpecularMaterial>(
          Parser.createEngineResource(
            "KHR_materials_pbrSpecularGlossiness",
            KHR_materials_pbrSpecularGlossiness,
            glTFResource
          )
        );
      } else {
        material = new PBRMaterial(engine);
      }

      material.name = name;

      if (KHR_materials_clearcoat) {
        Parser.parseEngineResource("KHR_materials_clearcoat", KHR_materials_clearcoat, material, glTFResource);
      }

      if (pbrMetallicRoughness) {
        const { baseColorFactor, baseColorTexture, metallicFactor, roughnessFactor, metallicRoughnessTexture } =
          pbrMetallicRoughness;

        if (baseColorFactor) {
          material.baseColor = new Color(
            Color.linearToGammaSpace(baseColorFactor[0]),
            Color.linearToGammaSpace(baseColorFactor[1]),
            Color.linearToGammaSpace(baseColorFactor[2]),
            baseColorFactor[3]
          );
        }
        if (baseColorTexture) {
          material.baseTexture = textures[baseColorTexture.index];
          MaterialParser._parseTextureTransform(material, baseColorTexture.extensions, glTFResource);
        }

        if (!KHR_materials_unlit && !KHR_materials_pbrSpecularGlossiness) {
          const m = material as PBRMaterial;
          m.metallic = metallicFactor ?? 1;
          m.roughness = roughnessFactor ?? 1;
          if (metallicRoughnessTexture) {
            m.roughnessMetallicTexture = textures[metallicRoughnessTexture.index];
            MaterialParser._parseTextureTransform(material, metallicRoughnessTexture.extensions, glTFResource);
          }
        }
      }

      if (!KHR_materials_unlit) {
        const m = material as PBRMaterial | PBRSpecularMaterial;

        if (emissiveTexture) {
          m.emissiveTexture = textures[emissiveTexture.index];
          MaterialParser._parseTextureTransform(material, emissiveTexture.extensions, glTFResource);
        }

        if (emissiveFactor) {
          m.emissiveColor = new Color(
            Color.linearToGammaSpace(emissiveFactor[0]),
            Color.linearToGammaSpace(emissiveFactor[1]),
            Color.linearToGammaSpace(emissiveFactor[2])
          );
        }

        if (normalTexture) {
          const { index, scale } = normalTexture;
          m.normalTexture = textures[index];
          MaterialParser._parseTextureTransform(material, normalTexture.extensions, glTFResource);
          if (scale !== undefined) {
            m.normalTextureIntensity = scale;
          }
        }

        if (occlusionTexture) {
          const { index, strength, texCoord } = occlusionTexture;
          m.occlusionTexture = textures[index];
          MaterialParser._parseTextureTransform(material, occlusionTexture.extensions, glTFResource);
          if (strength !== undefined) {
            m.occlusionTextureIntensity = strength;
          }
          if (texCoord === TextureCoordinate.UV1) {
            m.occlusionTextureCoord = TextureCoordinate.UV1;
          } else if (texCoord > TextureCoordinate.UV1) {
            Logger.warn("Occlusion texture uv coordinate must be UV0 or UV1.");
          }
        }
      }

      if (OASIS_materials_remap) {
        glTFResource.gltf.extensions = glTFResource.gltf.extensions ?? {};
        glTFResource.gltf.extensions["OASIS_materials_remap"] =
          glTFResource.gltf.extensions["OASIS_materials_remap"] ?? {};
        glTFResource.gltf.extensions["OASIS_materials_remap"][i] = Parser.createEngineResource(
          "OASIS_materials_remap",
          OASIS_materials_remap,
          glTFResource
        );
      }

      if (doubleSided) {
        material.renderFace = RenderFace.Double;
      } else {
        material.renderFace = RenderFace.Front;
      }

      switch (alphaMode) {
        case MaterialAlphaMode.OPAQUE:
          material.isTransparent = false;
          break;
        case MaterialAlphaMode.BLEND:
          material.isTransparent = true;
          break;
        case MaterialAlphaMode.MASK:
          material.alphaCutoff = alphaCutoff ?? 0.5;
          break;
      }

      materials[i] = material;
    }

    if (materialIndex >= 0) {
      const material = materials[materialIndex];
      if (material) {
        return material;
      } else {
        throw `material index not find in: ${materialIndex}`;
      }
    }

    glTFResource.materials = materials;
  }
}
