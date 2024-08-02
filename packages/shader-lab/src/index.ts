export { ShaderLab } from "./ShaderLab";

// #if _EDITOR
export { Preprocessor } from "./preprocessor";
// #endif

//@ts-ignore
export const version = `__buildVersion`;

let mode = "Release";
// #if _EDITOR
mode = "Editor";
// #endif

console.log(`Galacean ShaderLab version: ${version}. mode: ${mode}`);
