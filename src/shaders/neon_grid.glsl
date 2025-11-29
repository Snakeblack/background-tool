precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // Background/Sky
uniform vec3 u_color2; // Grid
uniform vec3 u_color3; // Sun/Glow
uniform float u_speed;
uniform float u_grid_size;
uniform float u_glow;
uniform float u_offset_x;
uniform float u_offset_y;
uniform float u_sun_size;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// Pseudo-random function
float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Apply offset
    uv.x -= u_offset_x;
    uv.y -= u_offset_y;

    float t = u_time * u_speed;
    
    vec3 col = vec3(0.0);
    
    // Horizon setup
    float horizon = 0.05;
    float bend = uv.y - horizon;
    
    // --- SKY (Top half) ---
    if (uv.y > horizon) {
        // Background gradient
        col = mix(u_color1 * 0.5, u_color1 * 0.1, uv.y * 2.0);
        
        // Stars
        float stars = hash21(uv * 20.0);
        if (stars > 0.98) {
            float twinkle = sin(t * 5.0 + stars * 100.0) * 0.5 + 0.5;
            col += vec3(twinkle) * (stars - 0.98) * 50.0;
        }
        
        // Sun
        vec2 sunPos = vec2(0.0, horizon + u_sun_size);
        float sunDist = length(uv - sunPos);
        float sunSize = u_sun_size;
        
        if (sunDist < sunSize) {
            float sunHeight = (uv.y - sunPos.y) / sunSize; // -1 to 1
            // Sun stripes
            float stripes = sin(sunHeight * 20.0 - t * 0.5);
            float stripeMask = smoothstep(-0.1, 0.1, stripes);
            
            // Gradient on sun
            vec3 sunColor = mix(u_color3, u_color2, (uv.y - horizon) * 2.0);
            
            // Cut stripes near bottom of sun
            if (uv.y < sunPos.y) {
                 sunColor *= step(0.0, sin(uv.y * 80.0 + t)); 
            }
            
            col = mix(col, sunColor, smoothstep(sunSize, sunSize - 0.01, sunDist));
            
            // Sun Glow
            col += sunColor * 0.5 * exp(-sunDist * 4.0) * u_glow;
        }
    } 
    // --- GROUND (Bottom half) ---
    else {
        // 3D Projection
        float z = 1.0 / abs(bend);
        float x = uv.x * z;
        
        // Movement
        float speedZ = t * 2.0;
        
        // Grid logic
        vec2 gridUV = vec2(x, z + speedZ) * u_grid_size;
        vec2 grid = fract(gridUV) - 0.5;
        vec2 id = floor(gridUV);
        
        // Grid lines
        float lineThickness = 0.02 * z * z * 0.5; // Thicken in distance to avoid aliasing artifacts
        lineThickness = clamp(lineThickness, 0.0, 0.5);
        
        float lineMask = smoothstep(lineThickness, 0.0, abs(grid.x)) + 
                         smoothstep(lineThickness, 0.0, abs(grid.y));
        
        // Fade grid into distance
        float fog = smoothstep(0.0, 0.8, abs(bend)); // 0 at horizon, 1 close
        
        // Ground base reflection
        vec3 groundBase = u_color1 * 0.1;
        
        // Add reflection of sun on grid
        float sunReflect = smoothstep(0.5, 0.0, abs(uv.x)) * smoothstep(0.0, 0.5, abs(bend));
        groundBase += u_color3 * sunReflect * 0.2;
        
        // Grid color
        vec3 gridColor = u_color2 * u_glow;
        
        // Vertical lines glow more in center
        gridColor += u_color3 * smoothstep(0.5, 0.0, abs(uv.x)) * 2.0;
        
        col = mix(groundBase, gridColor, clamp(lineMask, 0.0, 1.0) * fog);
        
        // Horizon glow
        col += u_color3 * exp(-abs(bend) * 10.0) * 0.5 * u_glow;
    }

    // Vignette
    col *= 1.0 - smoothstep(0.5, 1.5, length(uv));

    // Post-processing
    col = (col - 0.5) * u_contrast + 0.5;
    col = col + u_brightness;
    float noiseVal = (hash21(gl_FragCoord.xy + u_time) - 0.5) * u_noise;
    col += noiseVal;

    gl_FragColor = vec4(col, 1.0);
}
