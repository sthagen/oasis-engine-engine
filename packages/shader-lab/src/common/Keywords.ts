export enum EKeyword {
  ATTRIBUTE = 0,
  CONST,
  BOOL,
  FLOAT,
  DOUBLE,
  INT,
  UINT,
  BREAK,
  CONTINUE,
  DO,
  ELSE,
  FOR,
  IF,
  WHILE,
  DISCARD,
  RETURN,
  BVEC2,
  BVEC3,
  BVEC4,
  IVEC2,
  IVEC3,
  IVEC4,
  UVEC2,
  UVEC3,
  UVEC4,
  VEC2,
  VEC3,
  VEC4,
  VEC4_ARRAY,
  MAT2,
  MAT3,
  MAT4,
  MAT2X3,
  MAT2X4,
  MAT3X2,
  MAT3X4,
  MAT4X2,
  MAT4X3,
  IN,
  OUT,
  INOUT,
  CENTROID,
  SAMPLER2D,
  SAMPLER3D,
  SAMPLER_CUBE,
  SAMPLER2D_SHADOW,
  SAMPLER_CUBE_SHADOW,
  SAMPLER2D_ARRAY,
  SAMPLER2D_ARRAY_SHADOW,
  I_SAMPLER2D,
  I_SAMPLER3D,
  I_SAMPLER_CUBE,
  I_SAMPLER2D_ARRAY,
  U_SAMPLER2D,
  U_SAMPLER3D,
  U_SAMPLER_CUBE,
  U_SAMPLER2D_ARRAY,
  STRUCT,
  LAYOUT,
  LOCATION,
  VOID,
  TRUE,
  FALSE,
  PRECISION,
  PRECISE,
  HIGHP,
  MEDIUMP,
  LOWP,
  INVARIANT,
  SMOOTH,
  FLAT,
  NOPERSPECTIVE,

  // galacean internals
  GS_RenderQueueType,
  GS_BlendState,
  GS_DepthState,
  GS_StencilState,
  GS_RasterState,
  GS_EditorProperties,
  GS_EditorMacros,
  GS_Editor,
  GS_Tags,
  GS_ReplacementTag,
  GS_LightMode,
  GS_PipelineStage,
  GS_VertexShader,
  GS_FragmentShader,
  GS_SubShader,
  GS_Pass,
  GS_BlendFactor,
  GS_BlendOperation,
  GS_Bool,
  GS_Number,
  GS_Color,
  GS_CompareFunction,
  GS_StencilOperation,
  GS_CullMode,
  GS_UsePass
}
