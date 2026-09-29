// The ink blot of the hero (hero.frag.glsl), on its own: the same splash body,
// jets, flying drops, drips, water dust and wet halo, lifted verbatim from the
// splash block there (two marked changes). Drawn into a square around a click; units are the hero
// painting's height, so the blot comes out the same size as on the scroll.
precision highp float;
varying vec2 vUv;
uniform float uScale;   // side of the square, in painting heights
uniform float uBlotR, uT, uSeed, uR0, uFade;
uniform float uDust;   // 1 for a splash, 0 for ink gathering under a resting brush
uniform vec3 uDense, uThin;   // ink colour where it is dense / where it thins out
uniform vec4 uSeg[26];   // xy - tail, zw - head of a jet or a flying drop
uniform vec2 uRad[26];   // radius at the tail and at the head

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
float seg(vec2 p, vec2 a, vec2 b, float ra, float rb){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-7), 0., 1.);
  return length(pa - ba * h) - mix(ra, rb, h);
}

void main(){
  vec2 q = vUv * uScale;
  vec2 b = vec2(uScale * .5);
  float dist = length(q - b);
  float nf = fbm(q * 38.0);

  // ---------- splash (verbatim from hero.frag.glsl) ----------
  float R = uBlotR * uR0;
  float s = 0., halo = 0.;
  if (R > 0. && dist < .62) {
    // рваный край: слегка мнем координаты шумом
    vec2 wq = q + (vec2(vnoise(q * 64.), vnoise(q * 64. + 9.7)) - .5) * .0046;
    vec2 d = wq - b; float dl = length(d); vec2 dir = d / max(dl, 1e-5);

    // тело кляксы: неровный круг с острыми лучами
    float n1 = vnoise(dir * 2.3 + uSeed), n2 = vnoise(dir * 6.5 + uSeed * 1.7);
    float rr = R * (.92 + .34 * n1 + 1.0 * pow(n2, 5.));
    s = 1. - smoothstep(rr * .9, rr, dl);

    // струи, летящие капли и потеки
    for (int i = 0; i < 26; i++) {
      vec2 rad = uRad[i];
      if (rad.x + rad.y <= 0.) continue;
      float sd = seg(wq, uSeg[i].xy, uSeg[i].zw, rad.x, rad.y);
      s = max(s, 1. - smoothstep(-.0012, .0006, sd));
    }

    // водяная пыль: мелкие точки, густо у кляксы и редко вдали, появляются волной
    float cs = .0052;
    vec2 cell = floor(q / cs);
    float h1 = hash(cell + uSeed), h2 = hash(cell + 3.1 + uSeed), h3 = hash(cell + 7.7);
    vec2 c = (cell + .2 + .6 * vec2(h2, h3)) * cs;
    float dc = length(c - b);
    float prob = exp(-dc / (uR0 * 1.25)) * .32 * step(dc, uR0 * 4.5);
    float sr = .0006 + .0010 * h3 * h3;
    float speck = step(1. - prob, h1) * (1. - smoothstep(sr, sr + .0007, length(wq - c)))
                * step(dc, uT * 2.2) * step(uR0, dc);
    s = max(s, speck * uDust);   // changed from the hero: dust can be switched off

    // мокрый ореол: разбавленная тушь ползет по волокнам, по краю темнее
    // Changed from the hero: the fibre wobble was a fixed ±.006, which on a tiny
    // blot (a resting pool as it starts to gather) pushed Rh below zero, and the
    // halo then filled the whole square. Scaled by R it is identical at the
    // hero's R0 (.26 * .046 = .012) and stays positive.
    float Rh = max(R * (1.15 + 1.25 * (1. - exp(-uT * .9))) * (.85 + .4 * n1) + (nf - .5) * .26 * R, R * .5);
    float hin = 1. - smoothstep(Rh * .86, Rh, dl);
    float ring = smoothstep(Rh * .7, Rh * .93, dl) * hin;
    halo = hin * .13 + ring * .12;
  }

  float a = max(s * .97, halo);
  a *= .94 + .06 * nf;
  vec3 col = mix(uThin, uDense, pow(s, .7));
  gl_FragColor = vec4(col * a, a) * uFade;
}
