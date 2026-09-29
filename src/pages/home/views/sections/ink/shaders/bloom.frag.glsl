// A painting appearing on the page the way the hero's valley does: the ink
// arrives soft and spread where the paper is wet, a pale diluted edge runs
// ahead of it, then the paper dries and the spread pulls into the drawing.
// The picture is ink on transparency: its alpha is the ink.
precision highp float;

uniform sampler2D uTex;
uniform vec2 uRes; // canvas size, device px
uniform vec2 uFrom; // where the ink starts, 0..1, y up
uniform float uP; // reveal progress
uniform float uAspect; // canvas width / height

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
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = vec2(uv.x * uAspect, uv.y);
  float dist = length(q - vec2(uFrom.x * uAspect, uFrom.y));
  float maxD = length(vec2(uAspect, 1.0));

  float inkB = inkAt(uv, 4.5); // spread: the ink while the paper is wet
  float inkW = inkAt(uv, 6.5); // a very soft trace: where the paper is damp
  float inkS = inkAt(uv, 0.0); // the drawing it all ends as

  float n = fbm(q * 4.0);
  float nf = fbm(q * 38.0);
  float tend = 1.0 - abs(2.0 * fbm(q * 13.0 + 4.2) - 1.0);

  // when the ink gets here: out from the start, faster where the paper is wet
  float T = dist / maxD * 0.62 + n * 0.3 + (1.0 - inkB) * 0.16 + nf * 0.05 - tend * 0.07;
  float since = uP - T;
  float arrive = smoothstep(0.0, 0.15, since);
  float settle = smoothstep(0.05, 0.34, since);

  float wetInk = clamp(max(inkB, inkS * 0.55) * 1.15, 0.0, 1.0);
  float ink = mix(wetInk, inkS, settle);
  float a = ink * arrive;
  a = max(a, smoothstep(-0.07, 0.0, since) * (1.0 - arrive) * inkW * 0.3);
  // once dry it is exactly the picture, fibres and all
  a = mix(a * (0.94 + 0.06 * nf), a, settle);

  vec3 col = mix(vec3(0.21, 0.26, 0.35), vec3(0.063, 0.071, 0.078), mix(pow(ink * arrive, 0.7), 1.0, settle));
  gl_FragColor = vec4(col * a, a);
}
