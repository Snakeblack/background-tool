precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_intensity;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// Hash functions
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// Draw a single particle layer
vec3 particleLayer(vec2 uv, float scale, float speed, float layerIdx) {
    vec2 id = floor(uv * scale);
    vec2 gv = fract(uv * scale) - 0.5;
    
    vec3 layerColor = vec3(0.0);
    
    for(float y = -1.0; y <= 1.0; y++) {
        for(float x = -1.0; x <= 1.0; x++) {
            vec2 neighbor = vec2(x, y);
            vec2 nid = id + neighbor;
            
            // Random offset for position
            vec2 rand = hash2(nid + layerIdx * 100.0);
            
            // Movement
            float t = u_time * u_speed * speed;
            vec2 offset = vec2(sin(t + rand.x * 6.28), cos(t * 0.8 + rand.y * 6.28)) * 0.4;
            
            // Position relative to current cell center
            vec2 pos = neighbor + offset - gv;
            float d = length(pos);
            
            // Twinkle effect
            float twinkle = sin(t * 2.0 + rand.x * 10.0) * 0.5 + 0.5;
            
            // Particle size and glow
            float size = (0.05 + rand.y * 0.05) * u_intensity;
            float glow = 0.01 / (d * d + 0.001) * size * twinkle; // Soft glow
            float core = smoothstep(size, size * 0.5, d) * twinkle; // Hard core
            
            // Color selection
            vec3 pColor;
            float colorMix = rand.x;
            if (colorMix < 0.25) pColor = u_color1;
            else if (colorMix < 0.5) pColor = u_color2;
            else if (colorMix < 0.75) pColor = u_color3;
            else pColor = u_color4;
            
            layerColor += pColor * (core + glow * 0.5);
        }
    }
    
    return layerColor;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Background gradient
    vec3 bg = mix(u_color1 * 0.1, u_color4 * 0.1, length(uv - 0.5));
    vec3 color = bg;
    
    // Parallax layers
    // Layer 1: Small, slow, background particles
    color += particleLayer(uv, 8.0, 0.2, 1.0) * 0.5;
    
    // Layer 2: Medium, normal speed
    color += particleLayer(uv + vec2(0.1), 5.0, 0.5, 2.0);
    
    // Layer 3: Large, fast, foreground particles
    color += particleLayer(uv + vec2(0.2), 3.0, 0.8, 3.0) * 1.2;
    
    // Post-processing
    color = (color - 0.5) * u_contrast + 0.5;
    color += u_brightness;
    
    // Noise
    float noiseVal = (hash(uv * u_time) - 0.5) * u_noise;
    color += noiseVal;
    
    gl_FragColor = vec4(color, 1.0);
}
