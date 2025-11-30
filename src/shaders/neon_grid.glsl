precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // Sky/Background (Purple)
uniform vec3 u_color2; // Grid (Cyan/Blue)
uniform vec3 u_color3; // Sun (Yellow/Orange)
uniform float u_speed;
uniform float u_grid_size;
uniform float u_glow;
uniform float u_offset_x;
uniform float u_offset_y;
uniform float u_sun_size;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

#define PI 3.14159265359

// Hash function
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// FBM for mountains
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
    uv.x -= u_offset_x;
    uv.y -= u_offset_y;

    vec3 col = vec3(0.0);
    float t = u_time * u_speed;

    // --- Camera / Perspective ---
    float horizon = 0.05; 
    
    // Curvature (CRT effect on the world)
    float curve = uv.y - horizon - pow(abs(uv.x), 2.5) * 0.15;

    // --- SKY ---
    if (curve > 0.0) {
        // Gradient Sky: Deep Purple to Pink
        vec3 skyTop = u_color1 * 0.4; // Darker purple
        vec3 skyBot = mix(u_color1, vec3(0.8, 0.2, 0.5), 0.5); // Pinkish
        col = mix(skyBot, skyTop, pow(curve * 1.5, 0.7));
        
        // Stars
        float stars = pow(hash(uv * 20.0), 30.0) * 0.8;
        col += vec3(stars);

        // --- SUN ---
        vec2 sunPos = vec2(0.0, horizon + 0.25);
        float sunDist = length(uv - sunPos);
        float sunRadius = u_sun_size * 0.6; // Base size
        
        if (sunDist < sunRadius) {
            // Sun Gradient: Yellow top to Red bottom
            float sunGrad = (uv.y - sunPos.y + sunRadius) / (2.0 * sunRadius);
            vec3 sunCol = mix(vec3(1.0, 0.0, 0.2), vec3(1.0, 0.9, 0.0), sunGrad); // Red to Yellow
            
            // Scanlines on Sun
            float stripes = sin((uv.y - sunPos.y) * 80.0);
            float stripeMask = smoothstep(0.0, 0.1, stripes); 
            
            // Fade stripes at top
            float stripeFade = smoothstep(0.6, 0.9, sunGrad); 
            stripeMask = mix(stripeMask, 1.0, stripeFade); 
            
            col = mix(col, sunCol * u_color3 * 2.5, stripeMask);
            
            // Sun Glow
            col += sunCol * u_glow * 0.5 * exp(-sunDist * 5.0);
        }
        
        // Sun Bloom (outside the disk)
        col += u_color3 * u_glow * 0.4 * exp(-sunDist * 2.0);

        // --- MOUNTAINS ---
        float mScale = 4.0;
        float mScroll = t * 0.1;
        float mountainHeight = fbm(vec2(uv.x * mScale + mScroll, 1.0)) * 0.25;
        
        // Second layer of mountains (further back)
        float mountainHeight2 = fbm(vec2(uv.x * mScale * 1.5 + mScroll * 0.5 + 10.0, 2.0)) * 0.2;
        
        // Render Back Mountains
        if (curve < mountainHeight2) {
             col = mix(col, u_color1 * 0.3, 0.9); 
        }
        
        // Render Front Mountains
        if (curve < mountainHeight) {
            col = vec3(0.02, 0.0, 0.05); // Dark foreground
            // Rim light
            float rim = smoothstep(0.0, 0.01, mountainHeight - curve);
            col += u_color2 * rim * 0.8; // Cyan rim
        }
    }
    // --- GRID / GROUND ---
    else {
        // Perspective projection
        float z = 1.0 / abs(curve);
        float x = uv.x * z;
        
        // Movement
        float speedZ = t * 4.0;
        
        // Grid UVs
        vec2 gridUV = vec2(x, z + speedZ) * u_grid_size;
        
        // Main Grid Lines
        // Use a glowy line calculation
        float lineWidth = 0.05 * z * 0.5; // Thicker in distance
        lineWidth = clamp(lineWidth, 0.0, 0.5);
        
        float gridLineX = smoothstep(0.5 - lineWidth, 0.5, abs(fract(gridUV.x) - 0.5));
        float gridLineY = smoothstep(0.5 - lineWidth, 0.5, abs(fract(gridUV.y) - 0.5));
        float gridMask = max(gridLineX, gridLineY);
        
        // Fading grid into distance
        float fog = exp(-z * 0.08);
        
        // Grid Color (Cyan/Blue)
        vec3 gridCol = u_color2 * 2.5; // Bright cyan
        
        // Floor Color (Dark Purple/Black)
        vec3 floorCol = vec3(0.05, 0.0, 0.1);
        
        // Reflection of Sun on Floor
        float sunReflect = exp(-pow(uv.x * 3.0, 2.0)) * exp(-abs(curve) * 3.0);
        floorCol += u_color3 * sunReflect * 0.6 * u_glow;
        
        col = mix(floorCol, gridCol, gridMask * fog);
        
        // Horizon Glow
        col += u_color2 * 0.6 * exp(-abs(curve) * 15.0) * fog;
    }

    // --- POST PROCESSING ---
    
    // Vignette
    col *= 1.0 - smoothstep(0.5, 1.5, length(uv));
    
    // Scanlines (Screen overlay)
    col *= 0.9 + 0.1 * sin(uv.y * 1000.0 + t * 10.0);
    
    // Contrast/Brightness
    col = (col - 0.5) * u_contrast + 0.5;
    col += u_brightness;
    
    // Noise
    col += (hash(uv + t) - 0.5) * u_noise;

    gl_FragColor = vec4(col, 1.0);
}
