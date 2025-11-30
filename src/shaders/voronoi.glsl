precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_cell_density;
uniform float u_border_width;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float t = u_time * u_speed * 0.5;
    
    vec2 st = uv * u_cell_density;
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);
    
    float m_dist = 1.0;  // Minimum distance
    vec2 m_id = vec2(0.0); // Closest cell ID
    
    // Voronoi Pass
    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 id = i_st + neighbor;
            vec2 point = hash2(id);
            
            // Organic animation
            point = 0.5 + 0.5 * sin(t + 6.2831 * point);
            
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            if( dist < m_dist ) {
                m_dist = dist;
                m_id = id;
            }
        }
    }
    
    // Color selection based on cell ID
    vec2 rand = hash2(m_id);
    vec3 col;
    float mixVal = rand.x;
    
    if(mixVal < 0.33) col = u_color1;
    else if(mixVal < 0.66) col = u_color2;
    else col = u_color3;
    
    // Aesthetic lighting (Soft Glow)
    // Invert distance: 1.0 at center, 0.0 at edge
    float light = 1.0 - m_dist;
    
    // Control the "tightness" or "spread" of the light with border_width
    // Lower border_width = larger, softer lights
    // Higher border_width = smaller, tighter lights
    float tightness = 1.0 + u_border_width * 8.0; 
    light = pow(max(0.0, light), tightness);
    
    // Mix with background (u_color4)
    // The background appears where 'light' is weak (edges)
    vec3 finalColor = mix(u_color4, col, light);
    
    // Add a subtle pulse to the light intensity
    float pulse = 0.85 + 0.15 * sin(t * 2.0 + rand.y * 10.0);
    finalColor *= pulse;
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor += u_brightness;
    
    // Dithering/Noise
    float noise = (hash2(gl_FragCoord.xy + t).x - 0.5) * u_noise;
    finalColor += noise;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
