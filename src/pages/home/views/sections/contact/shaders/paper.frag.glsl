// The last sheet of the page is an old one: faded yellow paper, browner at
// its edges and in soft patches, with a web of fine cracks across it where
// the paper has aged — a coarse web and a finer one inside it, thinning and
// breaking along their length. The web is laid out from a new seed on every
// visit, so no two letters are written on quite the same sheet.
precision highp float;

uniform vec2 uRes; // canvas size, device px
uniform float uDpr;
uniform float uSeed; // a new web every visit

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
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

/** Distance to the nearest border between cells: small on the threads of the web. */
float threads(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + hash2(n + g) - f;
      float d = dot(r, r);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return sqrt(f2) - sqrt(f1);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = p / uDpr; // css px, so the paper looks the same on any screen
  vec2 size = uRes / uDpr;
  vec2 s = vec2(uSeed, uSeed * 1.37);

  vec2 c = (q - size * 0.5) / (size * 0.5);
  float r = length(c * vec2(0.8, 1.0));

  // the age of the paper: faded yellow, browner towards its edges and in
  // soft patches where it caught more light over the years
  vec3 fresh = vec3(0.9255, 0.9098, 0.8824); // the other sections' paper
  vec3 old = vec3(0.918, 0.882, 0.8);
  vec3 older = vec3(0.875, 0.822, 0.712);
  float patina = smoothstep(0.35, 1.25, r + (fbm(q * 0.0035 + s * 2.0) - 0.5) * 0.5);
  vec3 dry = mix(old, older, patina * 0.75);
  // at the very top the page is still the paper of the section above: age
  // creeps in over the first couple of hundred pixels, along a ragged line
  float top = size.y - q.y + (fbm(vec2(q.x * 0.01, 1.0) + s) - 0.5) * 70.0;
  dry = mix(fresh, dry, smoothstep(20.0, 220.0, top));

  vec3 col = dry;

  // its threads: a coarse web and a finer one inside it, both bent by the grain
  vec2 warp = vec2(fbm(q * 0.004 + s), fbm(q * 0.004 - s + 5.0)) - 0.5;
  float coarse = 1.0 - smoothstep(0.0, 0.016, threads(q * 0.0045 + warp * 1.4 + s));
  float fine = 1.0 - smoothstep(0.0, 0.014, threads(q * 0.011 + warp * 2.2 - s));
  // a thread is never even: it thins out and breaks along its length
  float breaks = smoothstep(0.38, 0.72, fbm(q * 0.02 + s * 3.0));
  float web = (coarse * 0.8 + fine * 0.35 * smoothstep(0.45, 0.7, fbm(q * 0.006 + s))) * breaks;
  col = mix(col, vec3(0.5, 0.41, 0.29), web * 0.3);

  // and the paper keeps its fibres through all of it
  col += (vnoise(q * 1.7) - 0.5) * 0.014;
  gl_FragColor = vec4(col, 1.0);
}
