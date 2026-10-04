import { Vector2, Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';

// Uniforms read by the shader. You normally don't touch them directly:
// use the controller returned by mountBackground() (setColors, setParam, setSpeed).

// ── Runtime ────────────────────────────────────────────────────────────────
// u_time is the animation phase in seconds, already multiplied by the speed.
export const u_time = uniform(0);
export const u_resolution = uniform(new Vector2(1, 1));
// Pointer position, 0..1, origin bottom-left (smoothed on the CPU).
export const u_mouse = uniform(new Vector2(0.5, 0.5));

// ── Palette ────────────────────────────────────────────────────────────────
// Colors are OKLab (L, a, b) so every blend happens in a perceptual space.
export const u_color1 = uniform(new Vector3(0.2, 0, 0));
export const u_color2 = uniform(new Vector3(0.5, 0, 0));
export const u_color3 = uniform(new Vector3(0.7, 0, 0));
export const u_color4 = uniform(new Vector3(0.9, 0, 0));

// ── Finishing ──────────────────────────────────────────────────────────────
export const u_brightness = uniform(0.0);
export const u_contrast = uniform(1.0);
export const u_noise = uniform(0.0);

// ── Shared parameters (each background decides what they mean) ────────────
export const u_scale = uniform(1.0);
export const u_intensity = uniform(1.0);
export const u_distortion = uniform(0.5);
export const u_density = uniform(1.0);
export const u_softness = uniform(0.5);
export const u_glow = uniform(1.0);
export const u_size = uniform(1.0);
export const u_rotation = uniform(0.0);
export const u_amplitude = uniform(1.0);
export const u_frequency = uniform(1.0);
export const u_thickness = uniform(1.0);
export const u_spread = uniform(1.0);
export const u_offset_x = uniform(0.0);
export const u_offset_y = uniform(0.0);
