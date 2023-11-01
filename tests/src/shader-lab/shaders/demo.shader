Shader "Water" {

  DepthState depthState {
    Enabled = true;
    WriteEnabled = false;
    CompareFunction = CompareFunction.Greater;
  }

  RasterState rasterState {
    CullMode = CullMode.Front;
    DepthBias = 0.1;
    SlopeScaledDepthBias = 0.8;
  }

  SubShader "subname" {
    Tags { LightMode = "ForwardBase", Tag2 = true, Tag3 = 1.2 }

    BlendFactor material_SrcBlend;

    BlendState blendState {
      SourceAlphaBlendFactor = material_SrcBlend;
      Enabled[0] = true;
      ColorWriteMask[0] = 0.8;
      BlendColor = vec4(1.0, 1.0, 1.0, 1.0);
      AlphaBlendOperation = BlendOperation.Max;
    }

    UsePass "pbr/Default/Forward"

    Pass "default" {
      Tags { ReplacementTag = "Opaque", Tag2 = true, Tag3 = 1.9 }

      struct a2v {
       vec4 POSITION;
       vec2 TEXCOORD_0; 
      }

      struct v2f {
       vec2 v_uv;
       vec3 v_position;
      }

      mat4 renderer_MVPMat;
      mat4 renderer_MVMat;

      sampler2D material_BaseTexture;
      vec4 u_color;
      vec4 u_fogColor;
      float u_fogDensity;
      
      VertexShader = vert;
      FragmentShader = frag;

      vec4 linearToGamma(vec4 linearIn) {
          return vec4(pow(linearIn.rgb, vec3(1.0 / 2.2)), linearIn.a);
    }

    BlendState = blendState;

    StencilState {
      Enabled = true;
      ReferenceValue = 2;
      Mask = 1.3; // 0xffffffff
      WriteMask = 0.32; // 0xffffffff
      CompareFunctionFront = CompareFunction.Less;
      PassOperationBack = StencilOperation.Zero;
    }

    DepthState = depthState;
    RasterState = rasterState;

    #define SCENE_SHADOW_TYPE 3

      v2f vert(a2v v) {
        v2f o;

        o.v_uv = v.TEXCOORD_0;
        vec4 tmp = renderer_MVMat * POSITION;
        o.v_position = tmp.xyz;
        gl_Position = renderer_MVPMat * v.POSITION;
        return o;
      }

      void frag(v2f i) {
        vec4 color = texture2D(material_BaseTexture, i.v_uv) * u_color;
        float fogDistance = length(i.v_position);
        float fogAmount = 1.0 - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * 1.442695);
        fogAmount = clamp(fogAmount, 0.0, 1.0);
        gl_FragColor = mix(color, u_fogColor, fogAmount); 
  
        #ifndef ENGINE_IS_COLORSPACE_GAMMA
          gl_FragColor = linearToGamma(gl_FragColor);
        #endif

        // For testing only (macro)
        #if SCENE_SHADOW_TYPE == 2 || defined(XX_Macro)
          gl_FragColor = linearToGamma(gl_FragColor);
        #elif SCENE_SHADOW_TYPE == 3
          gl_FragColor = linearToGamma(gl_FragColor);
        #else 
          gl_FragColor = vec4(1.0, 1.0, 0.0, 0.0);
        #endif

        #undef SCENE_SHADOW_TYPE

        #ifndef SCENE_SHADOW_TYPE
          gl_FragColor = linearToGamma(gl_FragColor);
        #else
          gl_FragColor = vec4(1.0, 1.0, 0.0, 0.0);
        #endif 

        #ifdef SCENE_SHADOW_TYPE
          gl_FragColor = vec4(1.0, 1.0, 0.0, 0.0);
        #endif 
      }
    }
    UsePass "blinn-phong/Default/Forward"
  }
}