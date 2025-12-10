import { Vector2, Color } from 'three';
import { uniform } from 'three/tsl';

// Common Uniforms shared across TSL shaders
export const u_time = uniform(0);
export const u_resolution = uniform(new Vector2(1, 1));
export const u_mouse = uniform(new Vector2(0.5, 0.5));

// Colors
export const u_color1 = uniform(new Color(0xff0000));
export const u_color2 = uniform(new Color(0x00ff00));
export const u_color3 = uniform(new Color(0x0000ff));
export const u_color4 = uniform(new Color(0xffff00));

// Common Parameters
export const u_speed = uniform(1.0);
export const u_intensity = uniform(1.0);
export const u_scale = uniform(1.0);
export const u_brightness = uniform(0.0);
export const u_contrast = uniform(1.0);
export const u_noise = uniform(0.0);

// Specific Parameters (can be shared if names match)
export const u_wave_amplitude = uniform(0.4);
export const u_wave_frequency = uniform(2.5);
export const u_zoom = uniform(3.0);
export const u_stripe_width = uniform(8.0);
export const u_stripe_speed = uniform(0.8);
export const u_noise_scale = uniform(2.0);
export const u_octaves = uniform(4.0);
export const u_persistence = uniform(0.5);
export const u_lacunarity = uniform(2.0);
export const u_rotation = uniform(0.0);
export const u_distortion = uniform(0.6);
export const u_grid_size = uniform(3.0);
export const u_glow = uniform(1.0);
export const u_offset_x = uniform(0.0);
export const u_offset_y = uniform(0.0);
export const u_sun_size = uniform(0.25);
export const u_core_size = uniform(1.0);
export const u_spiral_density = uniform(3.0);
export const u_star_density = uniform(50.0);
export const u_cell_density = uniform(8.0);
export const u_border_width = uniform(0.1);
