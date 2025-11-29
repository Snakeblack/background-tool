precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // Outer/Dark
uniform vec3 u_color2; // Mid/Nebula
uniform vec3 u_color3; // Core/Bright
uniform float u_speed;
uniform float u_spiral_density;
uniform float u_star_density;
uniform float u_core_size;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// 2D Rotation
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// Noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * u_speed * 0.2;
    
    // Background stars (static-ish)
    float stars = 0.0;
    if (hash(uv * 100.0) > (1.0 - u_star_density * 0.0005)) {
        float twinkle = sin(t * 10.0 + hash(uv)*100.0) * 0.5 + 0.5;
        stars = twinkle;
    }
    
    // Galaxy Rotation
    vec2 gv = uv * rot(t * 0.5);
    float r = length(gv);
    float a = atan(gv.y, gv.x);
    
    // Spiral Arms
    // Logarithmic spiral: a = b * ln(r) -> we approximate
    float angleOffset = r * u_spiral_density;
    float spiral = sin(a * 2.0 + angleOffset - t * 2.0); // 2 arms
    
    // Add noise to spiral for volumetric look
    float n = fbm(gv * 5.0 + vec2(t, -t));
    spiral += n * 0.5;
    
    // Define arm mask
    float armMask = smoothstep(-0.2, 0.5, spiral) * smoothstep(1.0, 0.2, spiral);
    
    // Fade out at center (core is separate) and edges
    armMask *= smoothstep(0.1, 0.3, r) * smoothstep(1.2, 0.5, r);
    
    // Core
    float core = exp(-r * 4.0 / u_core_size);
    
    // Colors
    vec3 col = u_color1 * 0.05; // Deep space
    
    // Add stars
    col += vec3(stars) * (1.0 - core); // Stars mostly outside core
    
    // Nebula/Arms color
    vec3 armColor = mix(u_color2, u_color3, n + 0.2);
    col += armColor * armMask;
    
    // Core glow
    col += u_color3 * core * 2.0;
    col += u_color2 * core * 0.5;
    
    // Dust lanes (dark streaks)
    float dust = fbm(gv * 8.0 + vec2(t * 0.5));
    col *= 1.0 - dust * armMask * 0.8;
    
    // Final brightness adjustment
    col = pow(col, vec3(1.2)); // Contrast

    // Post-processing
    col = (col - 0.5) * u_contrast + 0.5;
    col = col + u_brightness;
    float noiseVal = (hash(gl_FragCoord.xy + u_time) - 0.5) * u_noise;
    col += noiseVal;

    gl_FragColor = vec4(col, 1.0);
}
