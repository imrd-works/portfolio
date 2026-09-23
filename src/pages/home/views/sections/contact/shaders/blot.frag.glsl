// The ink the river has been carrying since the Path section pools here, in
// the last screen of the page — and this is the one sheet on the site where it
// has had time to dry. It arrives wet: blue-black, soft at the edge, as fresh
// as everywhere else. Then it settles: the colour drains to a faded warm
// grey, the pigment sinks into the grain of the paper, and where the water
// stopped it leaves tide lines, the hard dark edges of a dried wash.
precision highp float;

uniform vec2 uRes; // canvas size, device px
uniform vec4 uArea; // the washed-out block: centre xy, half size
uniform float uRadius; // its corner radius, device px
uniform float uSpread; // 0 dry paper, 1 the ink has run to the edges
uniform float uDry; // 0 wet, 1 dried and faded
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

/** Distance to a rounded rectangle, negative inside. */
float sdRect(vec2 p, vec2 half_, float r) {
  vec2 d = abs(p) - half_ + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  // noise is laid out in css px, so the texture reads the same on any screen
  vec2 p = gl_FragCoord.xy;
  vec2 q = p / uDpr;
  float px = uDpr;

  // water never stops along a straight line
  float wobble = (fbm(q * 0.003 + 4.0) - 0.5) * 84.0 * px + (fbm(q * 0.0098 - 4.0) - 0.5) * 30.0 * px;
  float d = sdRect(p - uArea.xy, uArea.zw, uRadius) + wobble;

  // wet ink is soft at the edge; dried, the edge has set hard
  float soft = mix(96.0, 44.0, uDry) * px;
  float ink = smoothstep(2.0 * px, soft, d);

  // where the water stopped, the pigment it carried piled up and dried:
  // the tide line — a thin dark edge, and fainter ones where it paused
  float tide = exp(-abs(d - 6.0 * px) / (4.0 * px));
  float rings = 0.0;
  for (int i = 1; i <= 3; i++) {
    float at = (58.0 + 74.0 * float(i)) * px + (fbm(q * 0.006 + float(i) * 3.1) - 0.5) * 60.0 * px;
    rings += exp(-abs(d - at) / (3.0 * px)) * (0.5 / float(i));
  }
  // wet, the retreating ink still pools in a broad band
  float pool = exp(-abs(d - 18.0 * px) / (24.0 * px));
  ink += mix(0.34 * pool, 0.55 * tide, uDry);
  ink += rings * 0.35 * uDry * step(0.0, d);

  // it covers the section and only lets go at the very edges of the page
  float ed = sdRect(p - uRes * 0.5, uRes * 0.5 - vec2(18.0 * px), 90.0 * px) +
    (fbm(q * 0.0016 + 11.0) - 0.5) * 120.0 * px;
  ink *= 1.0 - smoothstep(-70.0 * px, 30.0 * px, ed);

  // and it gets there by running: the front is a wet edge moving outward
  float front = mix(-40.0 * px, max(uRes.x, uRes.y), uSpread);
  ink *= 1.0 - smoothstep(front - 130.0 * px, front, d);

  // wet ink is a smooth film; dried, the pigment has sunk into the grain
  float film = 0.86 + 0.3 * fbm(q * 0.016 + 3.0);
  float grain = 0.72 + 0.5 * fbm(q * 0.11 + 7.0) * fbm(q * 0.028 - 2.0) * 1.6;
  ink *= mix(film, grain, uDry);
  // and a dried wash is never as dense as it was wet
  ink *= mix(1.0, 0.78, uDry);
  ink = clamp(ink, 0.0, 1.0);

  // the paper of every section, with the faintest tint where water sat on it
  float fibre = (vnoise(q * 1.7) - 0.5) * 0.012;
  vec3 paper = vec3(0.9255, 0.9098, 0.8824) + fibre;
  float stain = smoothstep(-120.0 * px, 0.0, d) * (1.0 - step(0.0, d)) * uDry;
  paper = mix(paper, vec3(0.9, 0.87, 0.815), stain * 0.35);

  // blue-black while it is wet, a faded warm grey once it has dried
  vec3 wet = vec3(0.035, 0.05, 0.068);
  vec3 dried = vec3(0.24, 0.215, 0.19);
  vec3 inkCol = mix(wet, dried, uDry);
  gl_FragColor = vec4(mix(paper, inkCol, ink), 1.0);
}
