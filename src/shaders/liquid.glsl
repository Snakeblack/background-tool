precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_speed;
uniform float u_zoom;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_noise;

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random2(i).x;
    float b = random2(i + vec2(1.0, 0.0)).x;
    float c = random2(i + vec2(0.0, 1.0)).x;
    float d = random2(i + vec2(1.0, 1.0)).x;
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.1;
    float n1 = fbm(uv * u_zoom + vec2(time, time));
    float n2 = fbm(uv * u_zoom * 0.8 + vec2(time * 1.2, time * 0.8));

    vec3 mix1 = mix(u_color1, u_color2, n1);
    vec3 finalColor = mix(mix1, u_color3, n2);
    
    // Post-processing
    finalColor = (finalColor - 0.5) * u_contrast + 0.5;
    finalColor = finalColor + u_brightness;
    float noiseVal = (random2(gl_FragCoord.xy + u_time).x - 0.5) * u_noise;
    finalColor += noiseVal;

    gl_FragColor = vec4(finalColor, 1.0);
}
