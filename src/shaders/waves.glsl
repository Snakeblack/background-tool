precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_speed;
uniform float u_wave_amplitude;
uniform float u_wave_frequency;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.2;
    
    // Ondas superpuestas
    float wave1 = sin(uv.x * u_wave_frequency + time) * u_wave_amplitude;
    float wave2 = sin(uv.y * u_wave_frequency * 0.8 - time * 1.3) * u_wave_amplitude * 0.7;
    float wave3 = sin((uv.x + uv.y) * u_wave_frequency * 0.5 + time * 0.7) * u_wave_amplitude * 0.5;
    
    float combined = (wave1 + wave2 + wave3 + u_wave_amplitude * 2.5) / (u_wave_amplitude * 5.0);
    
    // Mezcla gradual entre 4 colores
    vec3 color1 = mix(u_color1, u_color2, smoothstep(0.0, 0.33, combined));
    vec3 color2 = mix(color1, u_color3, smoothstep(0.33, 0.66, combined));
    vec3 finalColor = mix(color2, u_color4, smoothstep(0.66, 1.0, combined));
    
    gl_FragColor = vec4(finalColor, 1.0);
}
