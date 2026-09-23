// The envelope arrives the way the hero's painting does: a drop of ink hits
// the paper at the apex of the V, the blot spreads, and the painting blooms
// out of it wet — wide, soft and dense where the water is, settling into the
// drawn lines as the paper dries — with a pale diluted edge running ahead.
// Then a drop of cinnabar lands on the apex and spreads into the seal.
// Ported from hero.frag.glsl: the reveal, the ripple, the blot with its wet
// halo and the sun, without the splash jets and the fog. Unlike the hero's
// sun, the seal lies on top of the ink, not under it.
precision highp float;

uniform sampler2D uTex; // the envelope: ink in the alpha channel
uniform vec2 uRes; // canvas size, device px
uniform float uAspect; // canvas width / height
uniform vec2 uBlot; // the apex, uv
uniform float uMaxD; // the farthest corner from the apex, in q units
uniform float uP; // reveal progress
uniform float uT; // seconds since the ink drop hit
uniform float uBlotR; // blot growth, 0..~1.14
uniform float uR0; // blot radius, q units
uniform float uSunT; // seconds since the cinnabar drop hit
uniform float uSunR; // seal radius, q units

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

float inkAt(vec2 uv, float bias) {
  return texture2D(uTex, uv, bias).a;
}

void main() {
  vec2 vUv = gl_FragCoord.xy / uRes;
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  vec2 b = vec2(uBlot.x * uAspect, uBlot.y);
  vec2 dv = q - b;
  float dist = length(dv);
  vec2 rdir = dv / max(dist, 1e-5);

  // the ripple from the hit, across the film of water: gone in ~1.5 s
  float wave = 0.0;
  if (uT > 0.0 && uT < 2.0) {
    float x = dist - uT * 0.55;
    wave = sin(x * 95.0) * exp(-x * x / 0.0035) * exp(-uT * 2.1) * smoothstep(0.0, 0.06, uT) /
      (1.0 + dist * 2.5);
  }
  float inkB = inkAt(vUv, 4.5); // spread ink: what it looks like while the paper is wet
  float inkW = inkAt(vUv, 6.5); // a very soft trace: where the paper is damp
  vec2 uv = vUv + rdir / vec2(uAspect, 1.0) * wave * 0.007;
  float inkS = inkAt(uv, 0.0); // the drawing it all ends as

  float n = fbm(q * 5.0); // big tongues of the spread
  float nf = fbm(q * 38.0); // the fibres of the paper
  float tend = 1.0 - abs(2.0 * fbm(q * 13.0 + 4.2) - 1.0); // veins the ink runs ahead along

  // when the ink gets here: out from the blot, faster where the paper is wet
  float T = dist / uMaxD * 0.62 + n * 0.3 + (1.0 - inkB) * 0.16 + nf * 0.05 - tend * 0.07;
  float since = uP - T;
  float arrive = smoothstep(0.0, 0.15, since); // ink in water has no hard front
  float settle = smoothstep(0.05, 0.34, since); // the paper dries: the spread pulls into the drawing

  float wetInk = clamp(max(inkB, inkS * 0.55) * 1.15, 0.0, 1.0);
  float ink = mix(wetInk, inkS, settle);
  float a = ink * arrive;
  // the pale diluted edge running ahead of the ink
  float lead = smoothstep(-0.07, 0.0, since) * (1.0 - arrive) * inkW * 0.3;
  a = max(a, lead);

  // the blot where the drop hit, with its wet halo creeping along the fibres
  float s = 0.0;
  float halo = 0.0;
  float R = uBlotR * uR0;
  if (R > 0.0) {
    vec2 wq = q + (vec2(vnoise(q * 64.0), vnoise(q * 64.0 + 9.7)) - 0.5) * 0.0046;
    vec2 d = wq - b;
    float dl = length(d);
    vec2 dir = d / max(dl, 1e-5);
    float n1 = vnoise(dir * 2.3 + 7.0);
    float n2 = vnoise(dir * 6.5 + 11.9);
    // shorter rays than the hero's blot: the seal has to cover them
    float rr = R * (0.92 + 0.34 * n1 + 0.6 * pow(n2, 5.0));
    s = 1.0 - smoothstep(rr * 0.9, rr, dl);
    float Rh = R * (1.15 + 1.25 * (1.0 - exp(-uT * 0.9))) * (0.85 + 0.4 * n1) + (nf - 0.5) * 0.012;
    float hin = 1.0 - smoothstep(Rh * 0.86, Rh, dl);
    float ring = smoothstep(Rh * 0.7, Rh * 0.93, dl) * hin;
    halo = hin * 0.13 + ring * 0.12;
  }
  a = max(a, max(s * 0.97, halo));
  a *= 0.94 + 0.06 * nf;
  float conc = max(ink * arrive, s);
  vec3 col = mix(vec3(0.21, 0.26, 0.35), vec3(0.035, 0.04, 0.05), pow(conc, 0.7));

  // the seal: a drop of cinnabar spreading on the wet paper, as the hero's sun
  float sa = 0.0;
  float cover = 0.0;
  if (uSunT > 0.0) {
    vec2 sq = q + (vec2(vnoise(q * 40.0), vnoise(q * 40.0 + 5.0)) - 0.5) * 0.006;
    float sd = length(sq - b);
    float grow = 1.0 - exp(-uSunT * 1.6);
    float SR = uSunR * (0.26 + 0.74 * grow) * (0.94 + 0.12 * fbm(q * 9.0 + 2.0));
    // a little firmer than the sun, so it still reads as a seal
    float soft = mix(0.08, 0.17, grow);
    float disc = 1.0 - smoothstep(SR * (1.0 - soft), SR * (1.0 + soft * 0.35), sd);
    float rim = smoothstep(SR * 0.6, SR * 0.95, sd) * disc;
    float dens = mix(0.98, 0.93, grow);
    sa = disc * dens * (0.84 + 0.24 * rim) * (0.9 + 0.1 * nf) * smoothstep(0.0, 0.08, uSunT);
    // the cinnabar is thick: once it has spread, the blot under it is gone
    cover = disc * smoothstep(0.0, 0.5, uSunT);
  }
  vec3 sunCol = vec3(0.78, 0.22, 0.15);

  // premultiplied: the ink, and the seal laid over it
  vec4 inkPm = vec4(col * a, a) * (1.0 - cover);
  gl_FragColor = vec4(sunCol * sa, sa) + inkPm * (1.0 - sa);
}
