// Wet-in-wet: clean paper spreads over the page from a point, like water
// soaking into rice paper — tongues along the fibres, a darker tide line at
// its edge and a pale diluted fringe running ahead of it.
precision highp float;
uniform vec2 uRes, uC;     // canvas size (device px); the centre (css px, y down)
uniform float uR, uDpr;    // radius (css px), device pixel ratio
uniform vec3 uPaper;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float dist = length(p - uC);
  float n = fbm(p * .0045), nf = fbm(p * .06), tend = 1. - abs(2. * fbm(p * .012 + 4.2) - 1.);
  float R = uR * (.78 + .44 * n) + (nf - .5) * 18. + tend * uR * .12;
  float inside = 1. - smoothstep(R - 3., R + 1.5, dist);
  float rim = smoothstep(R - 70., R - 4., dist) * inside;        // the tide line
  float lead = (1. - smoothstep(R, R + 26., dist)) * (1. - inside) * .35;
  vec3 col = uPaper * (1. - .09 * rim * (.7 + .3 * nf));
  float a = max(inside, lead);
  gl_FragColor = vec4(col * a, a);
}
