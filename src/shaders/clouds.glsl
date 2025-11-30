precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // Sky Background
uniform vec3 u_color2; // Cloud Base Color
uniform vec3 u_color3; // Cloud Shadow Color
uniform vec3 u_color4; // Sun/Highlight Color
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// 3D Noise Functions
float hash(float n) { return fract(sin(n) * 753.5453123); }

float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i=0; i<4; i++) {
        f += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

// Map function defines the cloud density at a point in space
float map(vec3 p) {
    // Scale the coordinates
    vec3 q = p * u_scale * 0.3;
    
    // Get noise value
    float f = fbm(q);
    
    // Create cloud shape
    // u_intensity controls the density threshold
    // Higher intensity = lower threshold = more clouds
    float threshold = 0.9 - (u_intensity * 0.6); 
    float density = smoothstep(threshold, threshold + 0.4, f);
    
    return clamp(density, 0.0, 1.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Camera Movement (Flying)
    float time = u_time * u_speed;
    vec3 ro = vec3(0.0, 0.0, time * 4.0); // Moving forward in Z
    
    // Add some subtle camera sway
    ro.x += sin(time * 0.5) * 1.0;
    ro.y += cos(time * 0.3) * 0.5;
    
    // Ray Direction
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Raymarching
    vec4 sum = vec4(0.0);
    float t = 0.0;
    
    // Dithering to prevent banding
    t += hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 0.2;
    
    // Sun Direction
    vec3 sunDir = normalize(vec3(0.5, 0.8, 0.5));
    
    for(int i = 0; i < 50; i++) {
        vec3 pos = ro + rd * t;
        
        float dens = map(pos);
        
        if(dens > 0.01) {
            // Lighting: Sample density towards the sun to calculate shadow
            float lightSample = map(pos + sunDir * 0.5);
            float shadow = exp(-lightSample * 5.0);
            
            // Color Mixing
            // Base cloud color mixed with shadow
            vec3 col = mix(u_color3, u_color2, shadow);
            
            // Add Sun Highlights
            // More highlight where density is lower and shadow is less
            col = mix(col, u_color4, shadow * 0.6 * (1.0 - dens));
            
            // Accumulate
            float alpha = dens * 0.4; // Opacity of this step
            
            // Front-to-back blending
            sum.rgb += col * alpha * (1.0 - sum.a);
            sum.a += alpha * (1.0 - sum.a);
        }
        
        // Early exit if fully opaque
        if(sum.a > 0.99) break;
        
        // Step forward
        t += 0.2;
    }
    
    // Background Sky
    // Gradient based on UV y
    vec3 sky = mix(u_color1, u_color4 * 0.8, uv.y * 0.5 + 0.5);
    
    // Mix clouds with sky
    // Distance fog: fade clouds into sky at distance
    float fog = smoothstep(20.0, 5.0, t);
    vec3 finalColor = mix(sky, sum.rgb, sum.a * fog);
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor += u_brightness;
    
    // Noise
    float noiseVal = (hash(dot(gl_FragCoord.xy + u_time, vec2(12.9898, 78.233))) - 0.5) * u_noise;
    finalColor += noiseVal;

    gl_FragColor = vec4(finalColor, 1.0);
}
