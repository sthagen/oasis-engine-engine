#ifdef ENGINE_NO_DEPTH_TEXTURE
  /**
   * Decompose and save depth value.
  */
  vec4 pack (float depth) {
    // Use rgba 4 bytes with a total of 32 bits to store the z value, and the accuracy of 1 byte is 1/256.
    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);

    vec4 rgbaDepth = fract(depth * bitShift); // Calculate the z value of each point

    // Cut off the value which do not fit in 8 bits
    rgbaDepth -= rgbaDepth.gbaa * bitMask;

    return rgbaDepth;
  }
#endif


uniform vec4 material_BaseColor;
uniform sampler2D material_BaseTexture;
uniform float material_AlphaCutoff;
varying vec2 v_uv;

void main() {
  #if defined(MATERIAL_IS_ALPHA_CUTOFF) || (defined(SCENE_ENABLE_TRANSPARENT_SHADOW) && defined(MATERIAL_IS_TRANSPARENT))
    float alpha = material_BaseColor.a;
    #ifdef MATERIAL_HAS_BASETEXTURE
        alpha *= texture2D(material_BaseTexture, v_uv).a;
    #endif
  
    #ifdef MATERIAL_IS_ALPHA_CUTOFF
      if(alpha < material_AlphaCutoff){
        discard;
      }
    #endif
  
    #if defined(SCENE_ENABLE_TRANSPARENT_SHADOW) && defined(MATERIAL_IS_TRANSPARENT)
      // Interleaved gradient noise
      float noise = fract(52.982919 * fract(dot(vec2(0.06711, 0.00584), gl_FragCoord.xy)));
      if (alpha <= noise) {
        discard;
      };
    #endif
  #endif

  #ifdef ENGINE_NO_DEPTH_TEXTURE
      gl_FragColor = pack(gl_FragCoord.z);
  #else
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  #endif
}