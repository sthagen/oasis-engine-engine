#include <common>
#include <camera_declare>

#include <FogFragmentDeclaration>

#include <uv_share>
#include <normal_share>
#include <color_share>
#include <worldpos_share>

#include <light_frag_define>


#include <pbr_frag_define>
#include <pbr_helper>

void main() {
    #include <pbr_frag>
    #include <FogFragment>
}
