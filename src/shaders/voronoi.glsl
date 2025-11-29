precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // Cell interior
uniform vec3 u_color2; // Cell variation
uniform vec3 u_color3; // Borders/Highlights
uniform float u_speed;
uniform float u_cell_density;
uniform float u_border_width;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.y;
    float t = u_time * u_speed;
    
    uv *= u_cell_density;
    
    vec2 i_st = floor(uv);
    vec2 f_st = fract(uv);
    
    float m_dist = 1.0;  // Min distance
    vec2 m_point;        // Closest point
    vec2 m_neighbor;     // Closest neighbor ID
    
    // First pass: Find closest point
    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i_st + neighbor);
            
            // Organic movement
            point = 0.5 + 0.5 * sin(t + 6.2831 * point);
            
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            if (dist < m_dist) {
                m_dist = dist;
                m_point = point;
                m_neighbor = neighbor;
            }
        }
    }
    
    // Second pass: Distance to borders (Manhattan-ish or Euclidean edge detection)
    // We need to find the distance to the edge between the closest cell and the second closest.
    float dist_to_edge = 8.0;
    
    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i_st + neighbor);
            point = 0.5 + 0.5 * sin(t + 6.2831 * point);
            
            vec2 diff = neighbor + point - f_st;
            
            if (dot(diff - (m_neighbor + m_point - f_st), diff - (m_neighbor + m_point - f_st)) > 0.00001) {
                 // Intersection of perpendicular bisector
                 // dist to edge = dot( (p1 + p2)/2 - uv, normalize(p2 - p1) )
                 // Simplified for Voronoi border distance:
                 vec2 r = neighbor + point - f_st;
                 vec2 mr = m_neighbor + m_point - f_st;
                 float d = dot(0.5 * (mr + r), normalize(r - mr));
                 dist_to_edge = min(dist_to_edge, d);
            }
        }
    }
    
    // Visuals
    
    // Cell ID for coloring
    vec2 cellID = i_st + m_neighbor;
    float cellRand = random2(cellID).x;
    
    // Base color
    vec3 col = mix(u_color1, u_color2, cellRand);
    
    // Pulse effect inside cell
    float pulse = sin(t * 2.0 + cellRand * 10.0) * 0.5 + 0.5;
    col += u_color2 * pulse * 0.2;
    
    // Distance glow from center
    col += u_color3 * (1.0 - smoothstep(0.0, 0.5, m_dist)) * 0.3;
    
    // Borders
    // dist_to_edge is distance to the voronoi edge
    float border = smoothstep(u_border_width, u_border_width - 0.02, dist_to_edge); // Sharp edge
    float glow = exp(-dist_to_edge * 10.0); // Glow around edge
    
    // Add glowing borders
    col = mix(col, u_color3, border);
    col += u_color3 * glow * 0.5;
    
    // Highlight "wet" look
    float highlight = smoothstep(0.4, 0.5, 1.0 - m_dist);
    col += vec3(1.0) * highlight * 0.1;

    // Post-processing
    col = (col - 0.5) * u_contrast + 0.5;
    col = col + u_brightness;
    float noiseVal = (random2(gl_FragCoord.xy + u_time).x - 0.5) * u_noise;
    col += noiseVal;

    gl_FragColor = vec4(col, 1.0);
}
