precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_speed;
uniform float u_stripe_width;
uniform float u_stripe_speed;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * u_speed * 0.1;
    float n1 = (sin((uv.x + time * u_stripe_speed) * u_stripe_width) + 1.0) / 2.0;
    float n2 = (cos((uv.y - time * u_stripe_speed * 0.5) * u_stripe_width * 0.5) + 1.0) / 2.0;

    vec3 mix1 = mix(u_color1, u_color2, n1);
    vec3 finalColor = mix(mix1, u_color3, n2);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
