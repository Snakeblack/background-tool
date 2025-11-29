precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_scale;
uniform float u_rotation;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

#define PI 3.14159265359

// Rotación 2D
mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float hexagon(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
}

float box(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float triangle(vec2 p, float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = (uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.1;
    
    // Aplicar rotación
    uv = rotate2d(time + u_rotation) * uv;
    
    // Escala
    uv *= u_scale;
    
    // Crear patrón de mosaico
    vec2 id = floor(uv);
    vec2 gv = fract(uv) - 0.5;
    
    // Seleccionar forma basada en ID
    float hash = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
    
    float d;
    if (hash < 0.33) {
        d = hexagon(gv, 0.3);
    } else if (hash < 0.66) {
        d = box(gv, vec2(0.25));
    } else {
        d = triangle(gv, 0.35);
    }
    
    // Animación de las formas
    float pulse = sin(time + hash * PI * 2.0) * 0.5 + 0.5;
    d -= pulse * 0.1;
    
    // Colorear basado en la distancia
    float edge = smoothstep(0.01, 0.0, d);
    float fill = smoothstep(0.0, -0.1, d);
    
    // Seleccionar color basado en hash
    vec3 shapeColor;
    if (hash < 0.25) {
        shapeColor = u_color1;
    } else if (hash < 0.5) {
        shapeColor = u_color2;
    } else if (hash < 0.75) {
        shapeColor = u_color3;
    } else {
        shapeColor = u_color4;
    }
    
    // Degradado de fondo
    vec3 bgColor = mix(u_color1 * 0.3, u_color3 * 0.3, length(uv) * 0.3);
    
    // Combinar
    vec3 finalColor = mix(bgColor, shapeColor * 0.8, fill);
    finalColor += edge * shapeColor * 1.5;
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor = finalColor + u_brightness;
    float noiseVal = (fract(sin(dot(gl_FragCoord.xy + u_time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_noise;
    finalColor += noiseVal;

    gl_FragColor = vec4(finalColor, 1.0);
}
