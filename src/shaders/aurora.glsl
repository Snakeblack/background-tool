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

// Ruido simplificado
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
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.15;
    
    // Múltiples capas de ruido para simular aurora
    vec2 uv1 = uv * u_scale + vec2(time * 0.2, time * 0.1);
    vec2 uv2 = uv * u_scale * 1.3 + vec2(-time * 0.15, time * 0.12);
    vec2 uv3 = uv * u_scale * 0.8 + vec2(time * 0.1, -time * 0.08);
    
    float n1 = noise(uv1);
    float n2 = noise(uv2);
    float n3 = noise(uv3);
    
    // Ondas verticales que simulan cortinas de aurora
    float wave = sin(uv.x * 5.0 + time + n1 * 3.0) * 0.5 + 0.5;
    wave *= sin(uv.y * 2.0 - time * 0.5 + n2 * 2.0) * 0.5 + 0.5;
    
    // Combinación de ruidos
    float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    combined *= wave * u_intensity;
    
    // Mezcla de colores con transiciones suaves
    vec3 color1 = mix(u_color1, u_color2, smoothstep(0.0, 0.3, combined));
    vec3 color2 = mix(color1, u_color3, smoothstep(0.3, 0.6, combined));
    vec3 finalColor = mix(color2, u_color4, smoothstep(0.6, 1.0, combined));
    
    // Añadir brillo
    float glow = pow(wave, 3.0) * u_intensity * 0.5;
    finalColor += glow * u_color2;
    
    // Degradado base oscuro
    vec3 baseColor = mix(u_color1 * 0.2, u_color3 * 0.2, uv.y);
    finalColor = mix(baseColor, finalColor, smoothstep(0.0, 0.5, combined));
    
    gl_FragColor = vec4(finalColor, 1.0);
}
