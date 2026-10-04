import { Fn, vec2, float, sin, cos, exp, dot, length } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color3, u_color4, u_scale, u_distortion } from '../commonUniforms.js';
import { coords, aspect, keepChroma, finish } from '../tslLib.js';

// Mesh gradient: four color anchors drifting on slow orbits, blended with a
// soft falloff in OKLab, then warped for an organic, silky look.
export const main = Fn(() => {
    const p = coords().toVar();
    const t = u_time.mul(0.35);
    const half = vec2(aspect.mul(0.5), 0.5);

    // Two layers of domain warp: large swells + finer ripples.
    const warp = u_distortion.mul(0.16);
    p.addAssign(vec2(sin(p.y.mul(2.6).add(t)), cos(p.x.mul(2.9).sub(t.mul(0.8)))).mul(warp));
    p.addAssign(vec2(sin(p.y.mul(5.3).sub(t.mul(1.3))), cos(p.x.mul(4.7).add(t))).mul(warp.mul(0.35)));

    const c1 = vec2(sin(t.mul(0.9)).mul(0.25).sub(0.55), cos(t.mul(0.7)).mul(0.22).add(0.45)).mul(half);
    const c2 = vec2(cos(t.mul(0.8).add(1.0)).mul(0.22).add(0.6), sin(t.mul(1.1).add(2.0)).mul(0.25).add(0.4)).mul(half);
    const c3 = vec2(sin(t.mul(0.6).add(3.0)).mul(0.28).sub(0.35), cos(t.mul(0.9).add(1.0)).mul(0.22).sub(0.5)).mul(half);
    const c4 = vec2(cos(t.mul(1.0).add(4.0)).mul(0.25).add(0.45), sin(t.mul(0.8)).mul(0.25).sub(0.45)).mul(half);

    const k = float(2.6).div(u_scale.mul(u_scale));
    const d1 = p.sub(c1);
    const d2 = p.sub(c2);
    const d3 = p.sub(c3);
    const d4 = p.sub(c4);
    const w1 = exp(dot(d1, d1).mul(k).negate());
    const w2 = exp(dot(d2, d2).mul(k).negate());
    const w3 = exp(dot(d3, d3).mul(k).negate());
    const w4 = exp(dot(d4, d4).mul(k).negate());

    const sum = w1.add(w2).add(w3).add(w4).add(1e-5);
    const lab = u_color1.mul(w1).add(u_color2.mul(w2)).add(u_color3.mul(w3)).add(u_color4.mul(w4)).div(sum);

    // Keep midtones vivid instead of collapsing to gray where hues oppose each other.
    const chroma = length(u_color1.yz).mul(w1).add(length(u_color2.yz).mul(w2))
        .add(length(u_color3.yz).mul(w3)).add(length(u_color4.yz).mul(w4)).div(sum);

    return finish(keepChroma(lab, chroma, 1.5));
});
