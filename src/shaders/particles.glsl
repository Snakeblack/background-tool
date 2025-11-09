precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_intensity;

// Hash para partículas
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.3;
    
    vec3 color = vec3(0.0);
    
    // Múltiples capas de partículas
    for(float i = 0.0; i < 3.0; i++) {
        vec2 id = floor(uv * (10.0 + i * 5.0));
        vec2 gv = fract(uv * (10.0 + i * 5.0)) - 0.5;
        
        // Posición de la partícula
        vec2 offset = hash2(id + i) - 0.5;
        offset *= 0.4;
        
        // Movimiento ondulatorio
        offset.x += sin(time + id.y * 0.5 + i) * 0.2;
        offset.y += cos(time + id.x * 0.5 + i) * 0.2;
        
        vec2 pos = gv - offset;
        float dist = length(pos);
        
        // Radio de la partícula
        float radius = (0.05 + hash(id + i) * 0.05) * u_intensity;
        float particle = smoothstep(radius, radius * 0.3, dist);
        
        // Color de la partícula basado en su posición
        float colorMix = hash(id + i * 10.0);
        vec3 particleColor;
        if (colorMix < 0.25) {
            particleColor = u_color1;
        } else if (colorMix < 0.5) {
            particleColor = u_color2;
        } else if (colorMix < 0.75) {
            particleColor = u_color3;
        } else {
            particleColor = u_color4;
        }
        
        color += particle * particleColor * (1.0 - i * 0.2);
    }
    
    // Degradado de fondo
    vec3 bg = mix(u_color1 * 0.3, u_color3 * 0.3, uv.y);
    color += bg;
    
    gl_FragColor = vec4(color, 1.0);
}
