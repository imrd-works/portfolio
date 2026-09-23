// The seal on the envelope lands the way the sun lands in the hero: a drop of
// cinnabar hits wet paper and spreads into a disc, its edge softening the
// longer it lies in the water, its body thinning, and a darker rim where the
// wash dried. This is the hero's sun (hero.frag.glsl) at the size of a seal:
// every noise frequency is scaled by the ratio of the two radii, so the drop
// wobbles, frays and grains exactly as the sun does.
precision highp float;

uniform vec2 uRes; // canvas size, device px — the canvas is square
uniform float uT; // seconds in the water, the same clock as the hero's uSunT

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return s;
}

// the hero's sun has radius 0.04 in its painting; ours fills the canvas
const float R = 0.72;
const float K = 0.04 / R;

void main() {
  vec2 q = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  float nf = fbm(q * 38.0 * K); // the fibres of the paper
  vec2 sq = q + (vec2(vnoise(q * 40.0 * K), vnoise(q * 40.0 * K + 5.0)) - 0.5) * (0.006 / K);
  float sd = length(sq);
  float grow = 1.0 - exp(-uT * 1.6); // drop -> disc
  float SR = R * (0.26 + 0.74 * grow) * (0.94 + 0.12 * fbm(q * 9.0 * K + 2.0));
  // the longer in the water, the softer the edge — kept a little firmer than
  // the sun's, so the seal still reads as a seal
  float soft = mix(0.08, 0.17, grow);
  float disc = 1.0 - smoothstep(SR * (1.0 - soft), SR * (1.0 + soft * 0.35), sd);
  float rim = smoothstep(SR * 0.6, SR * 0.95, sd) * disc; // a dried wash has a darker edge
  float dens = mix(0.96, 0.8, grow); // the thick drop thins out
  float sa = disc * dens * (0.84 + 0.24 * rim) * (0.9 + 0.1 * nf) * smoothstep(0.0, 0.08, uT);
  vec3 sunCol = vec3(0.78, 0.22, 0.15);
  gl_FragColor = vec4(sunCol * sa, sa);
}
