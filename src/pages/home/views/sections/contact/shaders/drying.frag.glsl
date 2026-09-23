// The last sheet of the page is the one left to dry. It comes up soaked: the
// paper darker and cooler than the dry paper around it, with a dull sheen of
// water on it. As it is scrolled it dries the way paper does — from its
// edges in, unevenly, the letter in the middle last — and where the drying
// front paused it leaves faint tide lines behind.
precision highp float;

uniform vec2 uRes; // canvas size, device px
uniform float uDry; // 0 soaked, 1 dry
uniform float uDpr;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = p / uDpr; // css px, so the paper looks the same on any screen
  vec2 size = uRes / uDpr;

  // when this spot dries, 0..1: the edges first, the middle last, never evenly
  vec2 c = (q - size * 0.5) / (size * 0.5);
  float r = length(c * vec2(0.8, 1.0));
  float T = 1.0 - r * 0.85 + (fbm(q * 0.004 + 3.0) - 0.5) * 0.55 + (fbm(q * 0.018) - 0.5) * 0.08;

  // the very edge is always dry, so the sheet meets the section above it
  // without a seam
  float edge = min(min(q.x, size.x - q.x), min(q.y, size.y - q.y));
  T *= smoothstep(0.0, 90.0, edge);

  // the drying front sweeps inward over the scroll
  float front = uDry * 1.45 - 0.2;
  float wet = smoothstep(front - 0.015, front + 0.07, T);

  // soaked paper: darker, cooler, with a dull sheen where the water lies thick
  vec3 dry = vec3(0.9255, 0.9098, 0.8824);
  vec3 soaked = vec3(0.835, 0.83, 0.82);
  float sheen = smoothstep(0.55, 0.9, fbm(q * 0.0026 + 9.0)) * 0.06;
  vec3 col = mix(dry, soaked + sheen, wet);

  // the wet edge itself holds a little more water than the paper behind it
  col -= vec3(0.05, 0.045, 0.04) * exp(-abs(T - front - 0.02) / 0.012) * (1.0 - uDry);

  // where the front paused it left tide lines: faint, warm, and only behind it
  float tide = 0.0;
  for (int i = 0; i < 3; i++) {
    float at = 0.3 + 0.24 * float(i) + (fbm(q * 0.006 + float(i) * 5.0) - 0.5) * 0.04;
    tide += exp(-abs(T - at) / 0.0035) * step(at + 0.03, front);
  }
  col -= vec3(0.045, 0.05, 0.06) * tide * 0.8;

  // the fibres of the paper, wet or dry
  col += (vnoise(q * 1.7) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}
