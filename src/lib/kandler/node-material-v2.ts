// Kandler Node Material System — 50+ node types for shader graph editing.
import * as THREE from "three";

export type NodeCategory = "Input" | "Output" | "Shader" | "Texture" | "Color" | "Converter" | "Vector" | "Math" | "Script" | "Group";

export interface NodeSocketDef {
  id: string; name: string;
  type: "float" | "color" | "vector" | "normal" | "shader" | "boolean" | "matrix";
  defaultValue?: any;
}

export interface NodeParamDef {
  id: string; name: string;
  type: "float" | "int" | "color" | "vector" | "string" | "boolean" | "enum" | "image";
  default: any;
  options?: string[];
}

export interface NodeTypeDef {
  type: string; label: string; category: NodeCategory;
  description: string;
  inputs: NodeSocketDef[];
  outputs: NodeSocketDef[];
  params: NodeParamDef[];
}

export const COLOR_NODE: NodeTypeDef = {
  type: "color", label: "Color", category: "Input",
  description: "A solid color value.",
  inputs: [], outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [{ id: "color", name: "Color", type: "color", default: [1, 1, 1, 1] }],
};

export const VALUE_NODE: NodeTypeDef = {
  type: "value", label: "Value", category: "Input",
  description: "A floating point number.",
  inputs: [], outputs: [{ id: "value", name: "Value", type: "float" }],
  params: [{ id: "value", name: "Value", type: "float", default: 1.0 }],
};

export const VECTOR_NODE: NodeTypeDef = {
  type: "vector", label: "Vector", category: "Input",
  description: "A 3D vector.",
  inputs: [], outputs: [{ id: "vector", name: "Vector", type: "vector" }],
  params: [{ id: "vector", name: "Vector", type: "vector", default: [0, 0, 0] }],
};

export const TEX_COORD_NODE: NodeTypeDef = {
  type: "tex_coord", label: "Texture Coordinate", category: "Input",
  description: "UV, object, and world space coordinates.",
  inputs: [],
  outputs: [
    { id: "uv", name: "UV", type: "vector" },
    { id: "object", name: "Object", type: "vector" },
    { id: "world", name: "World", type: "vector" },
  ],
  params: [],
};

export const FRESNEL_NODE: NodeTypeDef = {
  type: "fresnel", label: "Fresnel", category: "Input",
  description: "Fresnel factor for viewing angle.",
  inputs: [
    { id: "normal", name: "Normal", type: "normal" },
    { id: "ior", name: "IOR", type: "float", defaultValue: 1.45 },
  ],
  outputs: [{ id: "fac", name: "Fac", type: "float" }],
  params: [{ id: "ior", name: "IOR", type: "float", default: 1.45 }],
};

export const GEOMETRY_NODE: NodeTypeDef = {
  type: "geometry", label: "Geometry", category: "Input",
  description: "Geometry data (position, normal, tangent).",
  inputs: [],
  outputs: [
    { id: "position", name: "Position", type: "vector" },
    { id: "normal", name: "Normal", type: "normal" },
    { id: "tangent", name: "Tangent", type: "vector" },
    { id: "true_normal", name: "True Normal", type: "normal" },
    { id: "incoming", name: "Incoming", type: "vector" },
    { id: "parametric", name: "Parametric", type: "vector" },
    { id: "backfacing", name: "Backfacing", type: "float" },
    { id: "pointiness", name: "Pointiness", type: "float" },
  ],
  params: [],
};

export const IMAGE_TEXTURE_NODE: NodeTypeDef = {
  type: "image_texture", label: "Image Texture", category: "Texture",
  description: "Sample an image file as a texture.",
  inputs: [{ id: "vector", name: "Vector", type: "vector" }],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "alpha", name: "Alpha", type: "float" },
  ],
  params: [
    { id: "image", name: "Image", type: "image", default: "" },
    { id: "mapping", name: "Mapping", type: "enum", options: ["UV", "Generated", "Object", "Window"], default: "UV" },
    { id: "interpolation", name: "Interpolation", type: "enum", options: ["Linear", "Closest", "Cubic"], default: "Linear" },
    { id: "projection", name: "Projection", type: "enum", options: ["Flat", "Box", "Sphere"], default: "Flat" },
    { id: "extension", name: "Extension", type: "enum", options: ["Repeat", "Extend", "Clip"], default: "Repeat" },
  ],
};

export const NOISE_TEX_NODE: NodeTypeDef = {
  type: "noise_texture", label: "Noise Texture", category: "Texture",
  description: "Perlin noise texture.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
    { id: "detail", name: "Detail", type: "float", defaultValue: 2 },
    { id: "distortion", name: "Distortion", type: "float", defaultValue: 0 },
  ],
  outputs: [
    { id: "fac", name: "Fac", type: "float" },
    { id: "color", name: "Color", type: "color" },
  ],
  params: [{ id: "dimensions", name: "Dimensions", type: "enum", options: ["1D", "2D", "3D", "4D"], default: "3D" }],
};

export const VORONOI_TEX_NODE: NodeTypeDef = {
  type: "voronoi_texture", label: "Voronoi Texture", category: "Texture",
  description: "Voronoi cell texture.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
    { id: "smoothness", name: "Smoothness", type: "float", defaultValue: 0 },
  ],
  outputs: [
    { id: "distance", name: "Distance", type: "float" },
    { id: "color", name: "Color", type: "color" },
    { id: "position", name: "Position", type: "vector" },
  ],
  params: [
    { id: "feature", name: "Feature", type: "enum", options: ["F1", "F2", "Smooth F1", "Distance"], default: "F1" },
    { id: "distance", name: "Distance", type: "enum", options: ["Euclidean", "Manhattan", "Chebychev", "Minkowski"], default: "Euclidean" },
  ],
};

export const WAVE_TEX_NODE: NodeTypeDef = {
  type: "wave_texture", label: "Wave Texture", category: "Texture",
  description: "Bands or rings pattern.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
    { id: "distortion", name: "Distortion", type: "float", defaultValue: 0 },
  ],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "fac", name: "Fac", type: "float" },
  ],
  params: [
    { id: "wave_type", name: "Wave Type", type: "enum", options: ["Bands", "Rings"], default: "Bands" },
    { id: "wave_profile", name: "Wave Profile", type: "enum", options: ["Sine", "Saw", "Triangle"], default: "Sine" },
  ],
};

export const CHECKER_TEX_NODE: NodeTypeDef = {
  type: "checker_texture", label: "Checker Texture", category: "Texture",
  description: "Checkerboard pattern.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "color1", name: "Color 1", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "color2", name: "Color 2", type: "color", defaultValue: [0, 0, 0, 1] },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
  ],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "fac", name: "Fac", type: "float" },
  ],
  params: [],
};

export const BRICK_TEX_NODE: NodeTypeDef = {
  type: "brick_texture", label: "Brick Texture", category: "Texture",
  description: "Brick wall pattern.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "color1", name: "Color 1", type: "color", defaultValue: [0.8, 0.3, 0.2, 1] },
    { id: "color2", name: "Color 2", type: "color", defaultValue: [0.5, 0.2, 0.1, 1] },
    { id: "mortar", name: "Mortar", type: "color", defaultValue: [0.3, 0.3, 0.3, 1] },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
  ],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "fac", name: "Fac", type: "float" },
  ],
  params: [{ id: "offset", name: "Offset", type: "float", default: 0.5 }],
};

export const GRADIENT_TEX_NODE: NodeTypeDef = {
  type: "gradient_texture", label: "Gradient Texture", category: "Texture",
  description: "Gradient pattern.",
  inputs: [{ id: "vector", name: "Vector", type: "vector" }],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "fac", name: "Fac", type: "float" },
  ],
  params: [{ id: "gradient_type", name: "Type", type: "enum", options: ["Linear", "Quadratic", "Easing", "Diagonal", "Spherical", "Radial"], default: "Linear" }],
};

export const MAGIC_TEX_NODE: NodeTypeDef = {
  type: "magic_texture", label: "Magic Texture", category: "Texture",
  description: "Psychedelic color pattern.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "scale", name: "Scale", type: "float", defaultValue: 5 },
    { id: "distortion", name: "Distortion", type: "float", defaultValue: 2 },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [{ id: "depth", name: "Depth", type: "int", default: 2 }],
};

export const MIX_RGB_NODE: NodeTypeDef = {
  type: "mix_rgb", label: "MixRGB", category: "Color",
  description: "Mix two colors with various blend modes.",
  inputs: [
    { id: "fac", name: "Fac", type: "float", defaultValue: 0.5 },
    { id: "color1", name: "Color 1", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "color2", name: "Color 2", type: "color", defaultValue: [0, 0, 0, 1] },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [{ id: "blend_type", name: "Blend Type", type: "enum", options: ["Mix", "Add", "Multiply", "Subtract", "Screen", "Divide", "Difference", "Darken", "Lighten", "Overlay", "Dodge", "Burn", "Hue", "Saturation", "Value", "Color", "Soft Light", "Linear Light"], default: "Mix" }],
};

export const HUE_SAT_VAL_NODE: NodeTypeDef = {
  type: "hue_saturation", label: "Hue/Saturation/Value", category: "Color",
  description: "Adjust hue, saturation, and value.",
  inputs: [
    { id: "hue", name: "Hue", type: "float", defaultValue: 0.5 },
    { id: "saturation", name: "Saturation", type: "float", defaultValue: 1 },
    { id: "value", name: "Value", type: "float", defaultValue: 1 },
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [],
};

export const BRIGHT_CONTRAST_NODE: NodeTypeDef = {
  type: "brightness_contrast", label: "Brightness/Contrast", category: "Color",
  description: "Adjust brightness and contrast.",
  inputs: [
    { id: "brightness", name: "Brightness", type: "float", defaultValue: 0 },
    { id: "contrast", name: "Contrast", type: "float", defaultValue: 0 },
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [],
};

export const GAMMA_NODE: NodeTypeDef = {
  type: "gamma", label: "Gamma", category: "Color",
  description: "Apply gamma correction.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "gamma", name: "Gamma", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [],
};

export const INVERT_NODE: NodeTypeDef = {
  type: "invert", label: "Invert", category: "Color",
  description: "Invert colors.",
  inputs: [
    { id: "fac", name: "Fac", type: "float", defaultValue: 1 },
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [],
};

export const MATH_NODE: NodeTypeDef = {
  type: "math", label: "Math", category: "Converter",
  description: "Mathematical operations on floats.",
  inputs: [
    { id: "a", name: "Value", type: "float", defaultValue: 0.5 },
    { id: "b", name: "Value", type: "float", defaultValue: 0.5 },
  ],
  outputs: [{ id: "result", name: "Value", type: "float" }],
  params: [{ id: "operation", name: "Operation", type: "enum", options: ["Add", "Subtract", "Multiply", "Divide", "Power", "Logarithm", "Square Root", "Absolute", "Exponent", "Minimum", "Maximum", "Less Than", "Greater Than", "Sign", "Round", "Floor", "Ceil", "Truncate", "Fraction", "Modulo", "Sine", "Cosine", "Tangent", "Arcsine", "Arccosine", "Arctangent"], default: "Add" }],
};

export const VECTOR_MATH_NODE: NodeTypeDef = {
  type: "vector_math", label: "Vector Math", category: "Converter",
  description: "Mathematical operations on vectors.",
  inputs: [
    { id: "a", name: "Vector", type: "vector", defaultValue: [0, 0, 0] },
    { id: "b", name: "Vector", type: "vector", defaultValue: [0, 0, 0] },
    { id: "scale", name: "Scale", type: "float", defaultValue: 1 },
  ],
  outputs: [
    { id: "vector", name: "Vector", type: "vector" },
    { id: "fac", name: "Fac", type: "float" },
  ],
  params: [{ id: "operation", name: "Operation", type: "enum", options: ["Add", "Subtract", "Multiply", "Divide", "Cross Product", "Dot Product", "Distance", "Length", "Scale", "Normalize", "Floor", "Ceil", "Modulo", "Absolute", "Minimum", "Maximum", "Sine", "Cosine", "Tangent"], default: "Add" }],
};

export const COLOR_RAMP_NODE: NodeTypeDef = {
  type: "color_ramp", label: "Color Ramp", category: "Converter",
  description: "Map a float to a color gradient.",
  inputs: [{ id: "fac", name: "Fac", type: "float", defaultValue: 0.5 }],
  outputs: [
    { id: "color", name: "Color", type: "color" },
    { id: "alpha", name: "Alpha", type: "float" },
  ],
  params: [
    { id: "interpolation", name: "Interpolation", type: "enum", options: ["Ease", "Cardinal", "Linear", "B-Spline", "Constant"], default: "Linear" },
  ],
};

export const MAP_RANGE_NODE: NodeTypeDef = {
  type: "map_range", label: "Map Range", category: "Converter",
  description: "Remap a value from one range to another.",
  inputs: [
    { id: "value", name: "Value", type: "float", defaultValue: 0.5 },
    { id: "from_min", name: "From Min", type: "float", defaultValue: 0 },
    { id: "from_max", name: "From Max", type: "float", defaultValue: 1 },
    { id: "to_min", name: "To Min", type: "float", defaultValue: 0 },
    { id: "to_max", name: "To Max", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "result", name: "Value", type: "float" }],
  params: [{ id: "interpolation_type", name: "Interpolation", type: "enum", options: ["Linear", "Stepped", "Smooth Step", "Smoother Step"], default: "Linear" }],
};

export const COMBINE_XYZ_NODE: NodeTypeDef = {
  type: "combine_xyz", label: "Combine XYZ", category: "Converter",
  description: "Combine X, Y, Z into a vector.",
  inputs: [
    { id: "x", name: "X", type: "float", defaultValue: 0 },
    { id: "y", name: "Y", type: "float", defaultValue: 0 },
    { id: "z", name: "Z", type: "float", defaultValue: 0 },
  ],
  outputs: [{ id: "vector", name: "Vector", type: "vector" }],
  params: [],
};

export const SEPARATE_XYZ_NODE: NodeTypeDef = {
  type: "separate_xyz", label: "Separate XYZ", category: "Converter",
  description: "Separate a vector into X, Y, Z.",
  inputs: [{ id: "vector", name: "Vector", type: "vector", defaultValue: [0, 0, 0] }],
  outputs: [
    { id: "x", name: "X", type: "float" },
    { id: "y", name: "Y", type: "float" },
    { id: "z", name: "Z", type: "float" },
  ],
  params: [],
};

export const COMBINE_COLOR_NODE: NodeTypeDef = {
  type: "combine_color", label: "Combine Color", category: "Converter",
  description: "Combine RGBA from individual channels.",
  inputs: [
    { id: "r", name: "Red", type: "float", defaultValue: 0 },
    { id: "g", name: "Green", type: "float", defaultValue: 0 },
    { id: "b", name: "Blue", type: "float", defaultValue: 0 },
    { id: "a", name: "Alpha", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [{ id: "mode", name: "Mode", type: "enum", options: ["RGB", "HSV", "HSL"], default: "RGB" }],
};

export const SEPARATE_COLOR_NODE: NodeTypeDef = {
  type: "separate_color", label: "Separate Color", category: "Converter",
  description: "Separate RGBA into individual channels.",
  inputs: [{ id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] }],
  outputs: [
    { id: "r", name: "Red", type: "float" },
    { id: "g", name: "Green", type: "float" },
    { id: "b", name: "Blue", type: "float" },
    { id: "a", name: "Alpha", type: "float" },
  ],
  params: [{ id: "mode", name: "Mode", type: "enum", options: ["RGB", "HSV", "HSL"], default: "RGB" }],
};

export const MAPPING_NODE: NodeTypeDef = {
  type: "mapping", label: "Mapping", category: "Vector",
  description: "Transform a vector.",
  inputs: [{ id: "vector", name: "Vector", type: "vector", defaultValue: [0, 0, 0] }],
  outputs: [{ id: "vector", name: "Vector", type: "vector" }],
  params: [
    { id: "translation", name: "Location", type: "vector", default: [0, 0, 0] },
    { id: "rotation", name: "Rotation", type: "vector", default: [0, 0, 0] },
    { id: "scale", name: "Scale", type: "vector", default: [1, 1, 1] },
  ],
};

export const BUMP_NODE: NodeTypeDef = {
  type: "bump", label: "Bump", category: "Vector",
  description: "Generate a normal from a height field.",
  inputs: [
    { id: "height", name: "Height", type: "float", defaultValue: 0.5 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "normal", name: "Normal", type: "normal" }],
  params: [
    { id: "strength", name: "Strength", type: "float", default: 1 },
    { id: "distance", name: "Distance", type: "float", default: 1 },
    { id: "invert", name: "Invert", type: "boolean", default: false },
  ],
};

export const NORMAL_MAP_NODE: NodeTypeDef = {
  type: "normal_map", label: "Normal Map", category: "Vector",
  description: "Use a color texture as a normal map.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.5, 0.5, 1, 1] },
    { id: "strength", name: "Strength", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "normal", name: "Normal", type: "normal" }],
  params: [
    { id: "space", name: "Space", type: "enum", options: ["Tangent Space", "Object Space", "World Space"], default: "Tangent Space" },
    { id: "uv_map", name: "UV Map", type: "string", default: "" },
  ],
};

export const VECTOR_ROTATE_NODE: NodeTypeDef = {
  type: "vector_rotate", label: "Vector Rotate", category: "Vector",
  description: "Rotate a vector.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector", defaultValue: [0, 0, 0] },
    { id: "center", name: "Center", type: "vector", defaultValue: [0, 0, 0] },
    { id: "axis", name: "Axis", type: "vector", defaultValue: [0, 0, 1] },
    { id: "angle", name: "Angle", type: "float", defaultValue: 0 },
  ],
  outputs: [{ id: "vector", name: "Vector", type: "vector" }],
  params: [{ id: "rotation_type", name: "Type", type: "enum", options: ["Axis Angle", "X Axis", "Y Axis", "Z Axis", "Euler"], default: "Axis Angle" }],
};

export const PRINCIPLED_BSDF_NODE: NodeTypeDef = {
  type: "principled_bsdf", label: "Principled BSDF", category: "Shader",
  description: "The ultimate PBR shader.",
  inputs: [
    { id: "base_color", name: "Base Color", type: "color", defaultValue: [0.8, 0.8, 0.8, 1] },
    { id: "metallic", name: "Metallic", type: "float", defaultValue: 0 },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0.5 },
    { id: "ior", name: "IOR", type: "float", defaultValue: 1.45 },
    { id: "alpha", name: "Alpha", type: "float", defaultValue: 1 },
    { id: "normal", name: "Normal", type: "normal" },
    { id: "subsurface", name: "Subsurface", type: "float", defaultValue: 0 },
    { id: "subsurface_color", name: "Subsurface Color", type: "color", defaultValue: [0.7, 0.1, 0.1, 1] },
    { id: "transmission", name: "Transmission", type: "float", defaultValue: 0 },
    { id: "emission", name: "Emission", type: "color", defaultValue: [0, 0, 0, 1] },
    { id: "emission_strength", name: "Emission Strength", type: "float", defaultValue: 1 },
    { id: "clearcoat", name: "Clearcoat", type: "float", defaultValue: 0 },
    { id: "clearcoat_roughness", name: "Clearcoat Roughness", type: "float", defaultValue: 0.03 },
    { id: "sheen", name: "Sheen", type: "float", defaultValue: 0 },
    { id: "anisotropic", name: "Anisotropic", type: "float", defaultValue: 0 },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann", "Ashikhmin-Shirley"], default: "GGX" }],
};

export const DIFFUSE_BSDF_NODE: NodeTypeDef = {
  type: "diffuse_bsdf", label: "Diffuse BSDF", category: "Shader",
  description: "Lambertian diffuse shading.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.8, 0.8, 0.8, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0.5 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [],
};

export const GLOSSY_BSDF_NODE: NodeTypeDef = {
  type: "glossy_bsdf", label: "Glossy BSDF", category: "Shader",
  description: "Specular reflection.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0.2 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann", "Ashikhmin-Shirley"], default: "GGX" }],
};

export const GLASS_BSDF_NODE: NodeTypeDef = {
  type: "glass_bsdf", label: "Glass BSDF", category: "Shader",
  description: "Glass-like surface.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0 },
    { id: "ior", name: "IOR", type: "float", defaultValue: 1.45 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann", "Sharp"], default: "GGX" }],
};

export const EMISSION_SHADER_NODE: NodeTypeDef = {
  type: "emission", label: "Emission", category: "Shader",
  description: "Emissive surface.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "strength", name: "Strength", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "emission", name: "Emission", type: "shader" }],
  params: [],
};

export const TRANSMISSION_BSDF_NODE: NodeTypeDef = {
  type: "transmission_bsdf", label: "Transmission BSDF", category: "Shader",
  description: "Light transmission.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0 },
    { id: "ior", name: "IOR", type: "float", defaultValue: 1.45 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann"], default: "GGX" }],
};

export const TOON_BSDF_NODE: NodeTypeDef = {
  type: "toon_bsdf", label: "Toon BSDF", category: "Shader",
  description: "Cartoon-style shader.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.8, 0.8, 0.8, 1] },
    { id: "size", name: "Size", type: "float", defaultValue: 0.5 },
    { id: "smooth", name: "Smooth", type: "float", defaultValue: 0.1 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "component", name: "Component", type: "enum", options: ["Diffuse", "Glossy"], default: "Diffuse" }],
};

export const SUBSURFACE_SCATTER_NODE: NodeTypeDef = {
  type: "subsurface_scattering", label: "Subsurface Scattering", category: "Shader",
  description: "Subsurface scattering for skin/wax.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.8, 0.8, 0.8, 1] },
    { id: "radius", name: "Radius", type: "vector", defaultValue: [1, 0.2, 0.1] },
    { id: "scale", name: "Scale", type: "float", defaultValue: 0.01 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "falloff", name: "Falloff", type: "enum", options: ["Cubic", "Gaussian", "Burley"], default: "Cubic" }],
};

export const MIX_SHADER_NODE: NodeTypeDef = {
  type: "mix_shader", label: "Mix Shader", category: "Shader",
  description: "Mix two shaders.",
  inputs: [
    { id: "fac", name: "Fac", type: "float", defaultValue: 0.5 },
    { id: "shader1", name: "Shader", type: "shader" },
    { id: "shader2", name: "Shader", type: "shader" },
  ],
  outputs: [{ id: "shader", name: "Shader", type: "shader" }],
  params: [],
};

export const ADD_SHADER_NODE: NodeTypeDef = {
  type: "add_shader", label: "Add Shader", category: "Shader",
  description: "Add two shaders.",
  inputs: [
    { id: "shader1", name: "Shader", type: "shader" },
    { id: "shader2", name: "Shader", type: "shader" },
  ],
  outputs: [{ id: "shader", name: "Shader", type: "shader" }],
  params: [],
};

export const MATERIAL_OUTPUT_NODE: NodeTypeDef = {
  type: "material_output", label: "Material Output", category: "Output",
  description: "Final material output.",
  inputs: [
    { id: "surface", name: "Surface", type: "shader" },
    { id: "volume", name: "Volume", type: "shader" },
    { id: "displacement", name: "Displacement", type: "vector" },
  ],
  outputs: [],
  params: [],
};

export const CLAMP_NODE: NodeTypeDef = {
  type: "clamp", label: "Clamp", category: "Converter",
  description: "Clamp a value.",
  inputs: [
    { id: "value", name: "Value", type: "float", defaultValue: 0.5 },
    { id: "min", name: "Min", type: "float", defaultValue: 0 },
    { id: "max", name: "Max", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "result", name: "Value", type: "float" }],
  params: [],
};

export const BOOLEAN_MATH_NODE: NodeTypeDef = {
  type: "boolean_math", label: "Boolean Math", category: "Converter",
  description: "Boolean operations.",
  inputs: [
    { id: "a", name: "Boolean", type: "boolean", defaultValue: false },
    { id: "b", name: "Boolean", type: "boolean", defaultValue: false },
  ],
  outputs: [{ id: "result", name: "Boolean", type: "boolean" }],
  params: [{ id: "operation", name: "Operation", type: "enum", options: ["And", "Or", "Not", "Nand", "Nor", "Xnor", "Xor"], default: "And" }],
};

export const FLOAT_COMPARE_NODE: NodeTypeDef = {
  type: "float_compare", label: "Float Compare", category: "Converter",
  description: "Compare two floats.",
  inputs: [
    { id: "a", name: "A", type: "float", defaultValue: 0 },
    { id: "b", name: "B", type: "float", defaultValue: 0 },
    { id: "epsilon", name: "Epsilon", type: "float", defaultValue: 0.001 },
  ],
  outputs: [{ id: "result", name: "Result", type: "boolean" }],
  params: [{ id: "operation", name: "Operation", type: "enum", options: ["Less Than", "Less Than or Equal", "Greater Than", "Greater Than or Equal", "Equal"], default: "Less Than" }],
};

export const LIGHT_PATH_NODE: NodeTypeDef = {
  type: "light_path", label: "Light Path", category: "Input",
  description: "Ray type information.",
  inputs: [],
  outputs: [
    { id: "is_camera_ray", name: "Is Camera Ray", type: "float" },
    { id: "is_shadow_ray", name: "Is Shadow Ray", type: "float" },
    { id: "is_diffuse_ray", name: "Is Diffuse Ray", type: "float" },
    { id: "is_glossy_ray", name: "Is Glossy Ray", type: "float" },
    { id: "is_singular_ray", name: "Is Singular Ray", type: "float" },
    { id: "is_reflection_ray", name: "Is Reflection Ray", type: "float" },
    { id: "is_transmission_ray", name: "Is Transmission Ray", type: "float" },
    { id: "ray_length", name: "Ray Length", type: "float" },
    { id: "ray_depth", name: "Ray Depth", type: "float" },
    { id: "transparent_depth", name: "Transparent Depth", type: "float" },
  ],
  params: [],
};

export const OBJECT_INFO_NODE: NodeTypeDef = {
  type: "object_info", label: "Object Info", category: "Input",
  description: "Object location, scale, and random.",
  inputs: [],
  outputs: [
    { id: "location", name: "Location", type: "vector" },
    { id: "scale", name: "Scale", type: "vector" },
    { id: "object_index", name: "Object Index", type: "float" },
    { id: "material_index", name: "Material Index", type: "float" },
    { id: "random", name: "Random", type: "float" },
  ],
  params: [],
};

export const PARTICLE_INFO_NODE: NodeTypeDef = {
  type: "particle_info", label: "Particle Info", category: "Input",
  description: "Particle attributes.",
  inputs: [],
  outputs: [
    { id: "index", name: "Index", type: "float" },
    { id: "age", name: "Age", type: "float" },
    { id: "lifetime", name: "Lifetime", type: "float" },
    { id: "location", name: "Location", type: "vector" },
    { id: "size", name: "Size", type: "float" },
    { id: "velocity", name: "Velocity", type: "vector" },
  ],
  params: [],
};

export const TIME_NODE: NodeTypeDef = {
  type: "time", label: "Time", category: "Input",
  description: "Scene time.",
  inputs: [],
  outputs: [{ id: "time", name: "Time", type: "float" }],
  params: [],
};

export const REROUTE_NODE: NodeTypeDef = {
  type: "reroute", label: "Reroute", category: "Group",
  description: "Reroute a connection.",
  inputs: [{ id: "input", name: "Input", type: "float" }],
  outputs: [{ id: "output", name: "Output", type: "float" }],
  params: [],
};

export const SKY_TEXTURE_NODE: NodeTypeDef = {
  type: "sky_texture", label: "Sky Texture", category: "Texture",
  description: "Procedural sky.",
  inputs: [{ id: "vector", name: "Vector", type: "vector" }],
  outputs: [{ id: "color", name: "Color", type: "color" }],
  params: [
    { id: "sky_type", name: "Type", type: "enum", options: ["Preetham", "Hosek-Wilkie", "Nishita"], default: "Preetham" },
    { id: "sun_direction", name: "Sun Direction", type: "vector", default: [0, 0, 1] },
    { id: "turbidity", name: "Turbidity", type: "float", default: 2.2 },
  ],
};

export const VOLUME_ABSORPTION_NODE: NodeTypeDef = {
  type: "volume_absorption", label: "Volume Absorption", category: "Shader",
  description: "Absorb light in a volume.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.5, 0.5, 0.5, 1] },
    { id: "density", name: "Density", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "volume", name: "Volume", type: "shader" }],
  params: [],
};

export const VOLUME_SCATTER_NODE: NodeTypeDef = {
  type: "volume_scatter", label: "Volume Scatter", category: "Shader",
  description: "Scatter light in a volume.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.8, 0.8, 0.8, 1] },
    { id: "density", name: "Density", type: "float", defaultValue: 1 },
    { id: "anisotropy", name: "Anisotropy", type: "float", defaultValue: 0 },
  ],
  outputs: [{ id: "volume", name: "Volume", type: "shader" }],
  params: [],
};

export const ANISOTROPIC_BSDF_NODE: NodeTypeDef = {
  type: "anisotropic_bsdf", label: "Anisotropic BSDF", category: "Shader",
  description: "Anisotropic reflection (brushed metal).",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0.5 },
    { id: "anisotropy", name: "Anisotropy", type: "float", defaultValue: 0.5 },
    { id: "rotation", name: "Rotation", type: "float", defaultValue: 0 },
    { id: "normal", name: "Normal", type: "normal" },
    { id: "tangent", name: "Tangent", type: "vector" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann", "Ashikhmin-Shirley"], default: "GGX" }],
};

export const VELVET_BSDF_NODE: NodeTypeDef = {
  type: "velvet_bsdf", label: "Velvet BSDF", category: "Shader",
  description: "Velvet/fabric shader.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "sigma", name: "Sigma", type: "float", defaultValue: 1 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [],
};

export const HAIR_BSDF_NODE: NodeTypeDef = {
  type: "hair_bsdf", label: "Hair BSDF", category: "Shader",
  description: "Hair rendering shader.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [0.2, 0.1, 0.05, 1] },
    { id: "offset", name: "Offset", type: "float", defaultValue: 0 },
    { id: "roughness_u", name: "Roughness U", type: "float", defaultValue: 0.1 },
    { id: "roughness_v", name: "Roughness V", type: "float", defaultValue: 0.3 },
    { id: "tangent", name: "Tangent", type: "vector" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "component", name: "Component", type: "enum", options: ["Reflection", "Transmission"], default: "Reflection" }],
};

export const REFRACTION_BSDF_NODE: NodeTypeDef = {
  type: "refraction_bsdf", label: "Refraction BSDF", category: "Shader",
  description: "Light refraction.",
  inputs: [
    { id: "color", name: "Color", type: "color", defaultValue: [1, 1, 1, 1] },
    { id: "roughness", name: "Roughness", type: "float", defaultValue: 0 },
    { id: "ior", name: "IOR", type: "float", defaultValue: 1.45 },
    { id: "normal", name: "Normal", type: "normal" },
  ],
  outputs: [{ id: "bsdf", name: "BSDF", type: "shader" }],
  params: [{ id: "distribution", name: "Distribution", type: "enum", options: ["GGX", "Beckmann", "Sharp"], default: "GGX" }],
};

export const VECTOR_DISPLACEMENT_NODE: NodeTypeDef = {
  type: "vector_displacement", label: "Vector Displacement", category: "Vector",
  description: "Displace vertices along a vector.",
  inputs: [
    { id: "vector", name: "Vector", type: "vector", defaultValue: [0, 0, 0] },
    { id: "midlevel", name: "Midlevel", type: "float", defaultValue: 0.5 },
    { id: "scale", name: "Scale", type: "float", defaultValue: 1 },
  ],
  outputs: [{ id: "vector", name: "Vector", type: "vector" }],
  params: [{ id: "space", name: "Space", type: "enum", options: ["Tangent Space", "Object Space", "World Space"], default: "Tangent Space" }],
};

export const GROUP_INPUT_NODE: NodeTypeDef = {
  type: "group_input", label: "Group Input", category: "Group",
  description: "Input for node groups.",
  inputs: [],
  outputs: [],
  params: [],
};

export const GROUP_OUTPUT_NODE: NodeTypeDef = {
  type: "group_output", label: "Group Output", category: "Group",
  description: "Output for node groups.",
  inputs: [],
  outputs: [],
  params: [{ id: "is_active_output", name: "Active Output", type: "boolean", default: true }],
};

export const FRAME_NODE: NodeTypeDef = {
  type: "frame", label: "Frame", category: "Group",
  description: "Organizational frame.",
  inputs: [],
  outputs: [],
  params: [{ id: "label", name: "Label", type: "string", default: "" }],
};

export const ALL_NODE_TYPES: NodeTypeDef[] = [
  COLOR_NODE, VALUE_NODE, VECTOR_NODE, TEX_COORD_NODE, FRESNEL_NODE, GEOMETRY_NODE,
  LIGHT_PATH_NODE, OBJECT_INFO_NODE, PARTICLE_INFO_NODE, TIME_NODE,
  IMAGE_TEXTURE_NODE, NOISE_TEX_NODE, VORONOI_TEX_NODE, WAVE_TEX_NODE, CHECKER_TEX_NODE,
  BRICK_TEX_NODE, GRADIENT_TEX_NODE, MAGIC_TEX_NODE, SKY_TEXTURE_NODE,
  MIX_RGB_NODE, HUE_SAT_VAL_NODE, BRIGHT_CONTRAST_NODE, GAMMA_NODE, INVERT_NODE,
  MATH_NODE, VECTOR_MATH_NODE, COLOR_RAMP_NODE, MAP_RANGE_NODE, CLAMP_NODE,
  BOOLEAN_MATH_NODE, FLOAT_COMPARE_NODE, COMBINE_XYZ_NODE, SEPARATE_XYZ_NODE,
  COMBINE_COLOR_NODE, SEPARATE_COLOR_NODE,
  MAPPING_NODE, BUMP_NODE, NORMAL_MAP_NODE, VECTOR_ROTATE_NODE, VECTOR_DISPLACEMENT_NODE,
  PRINCIPLED_BSDF_NODE, DIFFUSE_BSDF_NODE, GLOSSY_BSDF_NODE, GLASS_BSDF_NODE,
  EMISSION_SHADER_NODE, TRANSMISSION_BSDF_NODE, TOON_BSDF_NODE, SUBSURFACE_SCATTER_NODE,
  MIX_SHADER_NODE, ADD_SHADER_NODE, VOLUME_ABSORPTION_NODE, VOLUME_SCATTER_NODE,
  ANISOTROPIC_BSDF_NODE, VELVET_BSDF_NODE, HAIR_BSDF_NODE, REFRACTION_BSDF_NODE,
  MATERIAL_OUTPUT_NODE, REROUTE_NODE, GROUP_INPUT_NODE, GROUP_OUTPUT_NODE, FRAME_NODE,
];

export function getNodeType(type: string): NodeTypeDef | undefined {
  return ALL_NODE_TYPES.find(n => n.type === type);
}

export function getNodeTypesByCategory(category: NodeCategory): NodeTypeDef[] {
  return ALL_NODE_TYPES.filter(n => n.category === category);
}

export function getAllCategories(): NodeCategory[] {
  return ["Input", "Output", "Shader", "Texture", "Color", "Converter", "Vector", "Math", "Script", "Group"];
}
