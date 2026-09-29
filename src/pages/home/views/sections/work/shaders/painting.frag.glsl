// A project's painting appearing on wet paper, the way the hero blooms: the ink
// arrives soft and spread, a pale edge runs ahead, then it dries into the drawing.
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes, uScale, uOff, uFrom;   // canvas (device px); cover crop; where the ink starts (0..1, y up)
uniform float uP, uAspect;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
float inkAt(vec2 uv, float b){ return 1. - smoothstep(.02, .97, texture2D(uTex, uv, b).r); }

void main(){
  vec2 vUv = gl_FragCoord.xy / uRes;
  vec2 uv = uOff + vUv * uScale;
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  float dist = length(q - vec2(uFrom.x * uAspect, uFrom.y));
  float maxD = length(vec2(uAspect, 1.));
  float inkB = inkAt(uv, 4.5), inkW = inkAt(uv, 6.5), inkS = inkAt(uv, 0.);
  float n = fbm(q * 4.), nf = fbm(q * 38.), tend = 1. - abs(2. * fbm(q * 13. + 4.2) - 1.);
  float T = dist / maxD * .62 + n * .3 + (1. - inkB) * .16 + nf * .05 - tend * .07;
  float since = uP - T;
  float arrive = smoothstep(0., .15, since);
  float settle = smoothstep(.05, .34, since);
  float wetInk = clamp(max(inkB, inkS * .55) * 1.15, 0., 1.);
  float ink = mix(wetInk, inkS, settle);
  float a = ink * arrive;
  a = max(a, smoothstep(-.07, 0., since) * (1. - arrive) * inkW * .3);
  a *= .94 + .06 * nf;
  vec3 col = mix(vec3(.21, .26, .35), vec3(.035, .04, .05), pow(ink * arrive, .7));
  gl_FragColor = vec4(col * a, a);
}
