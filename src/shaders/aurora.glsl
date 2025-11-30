precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_intensity;
uniform float u_scale;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// 2D Rotation
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = rot(1.0);
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;
    
    float t = u_time * u_speed * 0.1;
    
    vec3 finalColor = vec3(0.0);
    
    // Deep background (Night sky)
    vec3 bg = mix(u_color1 * 0.05, u_color2 * 0.1, p.y * 0.5 + 0.5);
    finalColor = bg;
    
    // Aurora layers
    for(float i = 0.0; i < 4.0; i++) {
        float z = 1.0 + i * 0.2;
        
        // Distort coordinates for the curtain effect
        vec2 q = p * (u_scale * 0.8);
        q.x += i * 0.5; // Offset layers
        q.y *= 0.3; // Stretch vertically
        
        // Flow movement
        float flow = fbm(q + vec2(t * 0.2, t * 0.1));
        
        // The "curtain" shape definition
        // We distort the x coordinate based on y and noise
        float distortion = noise(q * 2.0 + vec2(0.0, t * 0.5));
        float curve = sin(q.x * 2.0 + distortion * 3.0 + t);
        
        // Intensity based on proximity to the curve
        float d = abs(q.y - curve * 0.2 - 0.5);
        float intensity = 0.02 / (d + 0.01); // Glow effect
        
        // Vertical fade (auroras fade at top and bottom)
        intensity *= smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.6, uv.y);
        
        // Add noise texture to the light
        intensity *= (0.5 + 0.5 * fbm(q * 5.0 + vec2(0.0, t * 2.0)));
        
        // Color palette for this layer
        vec3 col = mix(u_color3, u_color4, sin(i + t) * 0.5 + 0.5);
        if (mod(i, 2.0) == 0.0) col = mix(u_color2, col, 0.5);
        
        finalColor += col * intensity * u_intensity * (1.0 / z);
    }
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor += u_brightness;
    
    // Dither
    float dither = (hash(gl_FragCoord.xy + t) - 0.5) * u_noise;
    finalColor += dither;

    gl_FragColor = vec4(finalColor, 1.0);
}
