precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_scale;
uniform float u_distortion;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

// Perlin noise simplificado
vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float a = dot(random2(i), f);
    float b = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    float time = u_time * u_speed * 0.1;
    
    // Distorsión de la grilla
    vec2 distorted = uv;
    distorted.x += noise(uv * u_scale + time) * u_distortion;
    distorted.y += noise(uv * u_scale - time * 0.7) * u_distortion;
    
    // Crear una grilla de celdas
    vec2 grid = fract(distorted * 3.0);
    float cellNoise = noise(floor(distorted * 3.0) + time * 0.2);
    
    // Distancia al centro de cada celda
    float dist = length(grid - 0.5);
    
    // Mezcla de colores basada en la distancia y el ruido
    vec3 color1 = mix(u_color1, u_color2, cellNoise);
    vec3 color2 = mix(u_color3, u_color4, 1.0 - cellNoise);
    vec3 finalColor = mix(color1, color2, smoothstep(0.2, 0.5, dist));
    
    // Efecto de brillo en los bordes
    float edge = smoothstep(0.4, 0.5, dist) - smoothstep(0.5, 0.6, dist);
    finalColor += edge * 0.3;
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor = finalColor + u_brightness;
    float noiseVal = (random2(gl_FragCoord.xy + u_time).x - 0.5) * u_noise;
    finalColor += noiseVal;

    gl_FragColor = vec4(finalColor, 1.0);
}
