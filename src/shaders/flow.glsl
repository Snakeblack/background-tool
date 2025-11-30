precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// Random function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractional Brownian Motion
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = m * p;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Apply scale correctly!
    vec2 p = uv * u_scale;
    
    float t = u_time * u_speed * 0.1;
    
    // Domain Warping (The "Vanta" secret)
    // We distort the coordinates 'p' recursively
    
    vec2 q = vec2(0.0);
    q.x = fbm(p + vec2(0.0, t));
    q.y = fbm(p + vec2(5.2, 1.3));

    vec2 r = vec2(0.0);
    r.x = fbm(p + 4.0 * q + vec2(t, t * 0.5));
    r.y = fbm(p + 4.0 * q + vec2(t * 0.2, t * 0.8));

    float f = fbm(p + 4.0 * r);
    
    // Color mixing based on the distorted noise values
    
    // Base mix between Color 1 and Color 2
    // u_intensity controls how "sharp" the transition is
    float mixVal = smoothstep(0.0, 1.5 - u_intensity * 0.5, f);
    vec3 color = mix(u_color1, u_color2, mixVal);
    
    // Add Color 3 based on the first distortion vector 'q'
    // This adds depth/shadows
    float qLen = length(q);
    color = mix(color, u_color3, qLen * qLen * 0.6);
    
    // Add Color 4 based on the second distortion vector 'r'
    // This adds highlights/details
    float rLen = length(r);
    color = mix(color, u_color4, smoothstep(0.0, 1.0, rLen) * 0.4);
    
    // Post-processing
    color = (color - 0.5) * u_contrast + 0.5;
    color += u_brightness;
    
    // Dithering
    float dither = (hash(gl_FragCoord.xy + t) - 0.5) * u_noise;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
}
