// The ink the river has been carrying since the Path section pools here, in
// the last screen of the page. Water keeps it off the letter: inside the
// wash the paper is the paper of every other section, and the ink that
// retreated dried into a darker rim along the edge it stopped at.
precision highp float;

uniform vec2 uRes; // canvas size, device px
uniform vec4 uArea; // the washed-out block: centre xy, half size
uniform float uRadius; // its corner radius, device px
uniform float uSpread; // 0 dry paper, 1 the ink has run to the edges

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

/** Distance to a rounded rectangle, negative inside. */
float sdRect(vec2 p, vec2 half_, float r) {
  vec2 d = abs(p) - half_ + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  vec2 p = gl_FragCoord.xy;

  // water never stops along a straight line
  float wobble = (fbm(p * 0.0030 + 4.0) - 0.5) * 84.0 + (fbm(p * 0.0098 - 4.0) - 0.5) * 30.0;
  float d = sdRect(p - uArea.xy, uArea.zw, uRadius) + wobble;

  // clean paper by the letter, then the ink takes over within a few dozen px
  float ink = smoothstep(2.0, 74.0, d);
  // where the ink pooled as the water pushed it back, and dried darker
  ink += 0.34 * exp(-abs(d - 18.0) / 24.0);

  // it covers the section and only lets go at the very edges of the page
  float ed = sdRect(p - uRes * 0.5, uRes * 0.5 - vec2(18.0), 90.0) +
    (fbm(p * 0.0016 + 11.0) - 0.5) * 120.0;
  ink *= 1.0 - smoothstep(-70.0, 30.0, ed);

  // and it gets there by running: the front is a wet edge that moves outward
  float front = mix(-40.0, max(uRes.x, uRes.y), uSpread);
  ink *= 1.0 - smoothstep(front - 130.0, front, d);

  // ink is never flat on paper
  ink *= 0.86 + 0.3 * fbm(p * 0.016 + 3.0);
  ink = clamp(ink, 0.0, 1.0);

  // the paper keeps its own grain inside the wash
  float grain = (vnoise(p * 1.7) - 0.5) * 0.012;

  vec3 paper = vec3(0.9255, 0.9098, 0.8824) + grain;
  vec3 inkCol = vec3(0.035, 0.05, 0.065);
  gl_FragColor = vec4(mix(paper, inkCol, ink), 1.0);
}
