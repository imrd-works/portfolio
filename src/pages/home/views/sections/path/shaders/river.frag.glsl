// The river painting, revealed the way the hero blooms: ink reaches every point
// along the river's course (uFlow), arrives soft and spread like wet-in-wet,
// then dries into the sharp painting. uHead is how far the ink has run, uDry
// how far the paper has dried behind it.
precision highp float;
uniform sampler2D uInk;    // ink density, mipmapped: 0 paper, 1 black
uniform sampler2D uFlow;   // when the flow reaches this pixel, 0..1
uniform vec4 uRect;        // the painting in the canvas, css px: left, top, width, height
uniform vec2 uView;        // the canvas, css px
uniform float uDpr, uHead, uDry, uAspect;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }

// lossy WebP leaves faint noise on the paper: drop it
float inkAt(vec2 uv, float bias){ return clamp((texture2D(uInk, uv, bias).r - .03) / .97, 0., 1.); }

void main(){
  vec2 css = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 uv = (css - uRect.xy) / uRect.zw;
  if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) { gl_FragColor = vec4(0.); return; }

  float inkW = inkAt(uv, 4.5);      // very soft: where the paper is wet with water
  float inkS = inkAt(uv, 0.);      // the sharp painting: what it all ends as
  if (inkW < .002 && inkS < .002) { gl_FragColor = vec4(0.); return; }
  float inkB = inkAt(uv, 2.5);      // spread ink: how it looks while the paper is wet

  vec2 q = vec2(uv.x, uv.y * uAspect);
  float n    = fbm(q * 5.);                            // broad tongues of the spread
  float nf   = fbm(q * 38.);                           // paper fibres
  float tend = 1. - abs(2. * fbm(q * 13. + 4.2) - 1.); // veins the ink runs ahead along

  // when the ink gets here: along the river, faster through wet places and veins
  // (the flow map is 8-bit: a pixel of noise hides its steps in the soft front)
  float T = texture2D(uFlow, uv).r + (n - .5) * .05 + (1. - inkB) * .02 + nf * .006 - tend * .012
          + (hash(css) - .5) * .006;

  float since  = uHead - T;
  float arrive = smoothstep(0., .035, since);          // a soft front: ink in water has no hard edge
  float settle = smoothstep(0., .05, uDry - T);        // the paper dries: the spread gathers into the drawing

  float wetInk = clamp(max(inkB, inkS * .55) * 1.15, 0., 1.);   // wet, the ink is wider and denser
  float ink = mix(wetInk, inkS, settle);
  float a = ink * arrive;

  // a pale diluted edge running ahead of the ink
  float lead = smoothstep(-.03, 0., since) * (1. - arrive) * inkW * .3;
  a = max(a, lead);
  a *= .94 + .06 * nf;

  float conc = ink * arrive;
  vec3 col = mix(vec3(.21, .26, .35), vec3(.035, .04, .05), pow(conc, .7));
  gl_FragColor = vec4(col * a, a);
}
