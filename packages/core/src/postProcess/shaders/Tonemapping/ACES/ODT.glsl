#include <Tonescale>

// Output Device Transform - RGB computer monitor

const float CINEMA_WHITE = 48.0;
const float CINEMA_BLACK = 0.02; // CINEMA_WHITE / 2400.0;
const float ODT_SAT_FACTOR = 0.93;

mediump vec3 Y_2_linCV(mediump vec3 Y, mediump float Ymax, mediump float Ymin){
    return (Y - Ymin) / (Ymax - Ymin);
}

mediump vec3 XYZ_2_xyY(mediump vec3 XYZ){
    mediump float divisor = max(dot(XYZ, vec3(1.0)), 1e-4);
    return vec3(XYZ.xy / divisor, XYZ.y);
}

mediump vec3 xyY_2_XYZ(mediump vec3 xyY){
    mediump float m = xyY.z / max(xyY.y, 1e-4);
    mediump vec3 XYZ = vec3(xyY.xz, (1.0 - xyY.x - xyY.y));
    XYZ.xz *= m;
    return XYZ;
}

const mediump float DIM_SURROUND_GAMMA = 0.9811;

mediump vec3 darkSurround_to_dimSurround(mediump vec3 linearCV){
    // Extra conversions to float3/vec3 are required to avoid floating-point precision issues on some platforms.

    mediump vec3 XYZ = AP1_2_XYZ_MAT * linearCV;
    mediump vec3 xyY = XYZ_2_xyY(XYZ);
    xyY.z = clamp(xyY.z, 0.0, HALF_MAX);
    xyY.z = pow(xyY.z, DIM_SURROUND_GAMMA);
    XYZ = xyY_2_XYZ(xyY);

    return XYZ_2_AP1_MAT * XYZ;
}

//
// Summary :
//  This transform is intended for mapping OCES onto a desktop computer monitor
//  typical of those used in motion picture visual effects production. These
//  monitors may occasionally be referred to as "sRGB" displays, however, the
//  monitor for which this transform is designed does not exactly match the
//  specifications in IEC 61966-2-1:1999.
//
//  The assumed observer adapted white is D65, and the viewing environment is
//  that of a dim surround.
//
//  The monitor specified is intended to be more typical of those found in
//  visual effects production.
//
// Device Primaries :
//  Primaries are those specified in Rec. ITU-R BT.709
//  CIE 1931 chromaticities:  x         y         Y
//              Red:          0.64      0.33
//              Green:        0.3       0.6
//              Blue:         0.15      0.06
//              White:        0.3127    0.329     100 cd/m^2
//
// Display EOTF :
//  The reference electro-optical transfer function specified in
//  IEC 61966-2-1:1999.
//
// Signal Range:
//    This transform outputs full range code values.
//
// Assumed observer adapted white point:
//         CIE 1931 chromaticities:    x            y
//                                     0.3127       0.329
//

// Viewing Environment:
//   This ODT has a compensation for viewing environment variables more typical
//   of those associated with video mastering.
//
mediump vec3 ODT_RGBmonitor_100nits_dim(mediump vec3 oces){
    // The metal compiler does not optimize structure access
    // const SegmentedSplineParams_c9 ODT_48nits = SegmentedSplineParams_c9(
    //     // coefsLow[10]
    //     float[10]( -1.6989700043, -1.6989700043, -1.4779000000, -1.2291000000, -0.8648000000, -0.4480000000, 0.0051800000, 0.4511080334, 0.9113744414, 0.9113744414),
    //     // coefsHigh[10]
    //     float[10]( 0.5154386965, 0.8470437783, 1.1358000000, 1.3802000000, 1.5197000000, 1.5985000000, 1.6467000000, 1.6746091357, 1.6878733390, 1.6878733390 ),
    //     vec2(segmented_spline_c5_fwd(0.18*pow(2.,-6.5)),  0.02),    // minPoint
    //     vec2(segmented_spline_c5_fwd(0.18),                4.8),    // midPoint
    //     vec2(segmented_spline_c5_fwd(0.18*pow(2.,6.5)),   48.0),    // maxPoint
    //     0.0,  // slopeLow
    //     0.04  // slopeHigh
    // );

    // OCES to RGB rendering space
    mediump vec3 rgbPre = AP0_2_AP1_MAT * oces;

    // Apply the tonescale independently in rendering-space RGB
    mediump vec3 rgbPost;

    // rgbPost.r = segmented_spline_c9_fwd(rgbPre.r, ODT_48nits);
    // rgbPost.g = segmented_spline_c9_fwd(rgbPre.g, ODT_48nits);
    // rgbPost.b = segmented_spline_c9_fwd(rgbPre.b, ODT_48nits);

    rgbPost.r = segmented_spline_c9_fwd(rgbPre.r);
    rgbPost.g = segmented_spline_c9_fwd(rgbPre.g);
    rgbPost.b = segmented_spline_c9_fwd(rgbPre.b);

    // Scale luminance to linear code value
    mediump vec3 linearCV = Y_2_linCV(rgbPost, CINEMA_WHITE, CINEMA_BLACK);

     // Apply gamma adjustment to compensate for dim surround
    linearCV = darkSurround_to_dimSurround(linearCV);

    // Apply desaturation to compensate for luminance difference
    linearCV = mix(vec3(dot(linearCV, AP1_RGB2Y)), linearCV, ODT_SAT_FACTOR);

    // Convert to display primary encoding
    // Rendering space RGB to XYZ
    mediump vec3 XYZ = AP1_2_XYZ_MAT * linearCV;

    // Apply CAT from ACES white point to assumed observer adapted white point
    XYZ = D60_2_D65_CAT * XYZ;

    // CIE XYZ to display primaries
    linearCV = XYZ_2_REC709_MAT * XYZ;

    // Handle out-of-gamut values
    // Clip values < 0 or > 1 (i.e. projecting outside the display primaries)
    linearCV = clamp(linearCV, vec3(0), vec3(1));

    // Unity already draws to a sRGB target
    return linearCV;
}