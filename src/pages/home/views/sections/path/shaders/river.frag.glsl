// The river painting, revealed the way the hero blooms: ink reaches every point
// along the river's course (uFlow), arrives soft and spread like wet-in-wet,
// then dries into the sharp painting. uHead is how far the ink has run, uDry
// how far the paper has dried behind it. Once dry, the water keeps moving:
// a few long black and white brush strokes ride downstream along the river,
// the way water is drawn in hand-drawn animation; the painting never moves.
// Banks of mist lie over the river and slowly thicken and thin in place.
precision highp float;
uniform sampler2D uInk;    // ink density, mipmapped: 0 paper, 1 black
uniform sampler2D uFlow;   // when the flow reaches this pixel, 0..1
uniform sampler2D uWater;  // along the river (two phases of u mod 1024 px), across it (-1..1), water mask
uniform vec4 uRect;        // the painting in the canvas, css px: left, top, width, height
uniform vec2 uView;        // the canvas, css px
uniform float uDpr, uHead, uDry, uAspect, uTime;

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

  // ---------- the current: a few long brush strokes riding the water, only where it has dried ----------
  vec4 w = texture2D(uWater, uv);
  float strokeD = 0., strokeW = 0.;
  if (w.a > .02 && settle > 0.) {
    // u is stored twice, half a period apart, so one copy is always away from its wrap.
    // Filtering across a copy's wrap (255 -> 0) gives it a bogus value for one texel;
    // there the two disagree, and the one sitting mid-range (the other's wrap) is right.
    float uG = fract(w.g + .5);
    float ph;
    if (abs(fract(w.r - uG + .5) - .5) > .02) {
      ph = abs(w.r - .5) < abs(w.g - .5) ? w.r : uG;
    } else {
      // both agree: blend towards the copy away from its wrap, so rounding never shows
      float wr = smoothstep(.18, .3, w.r) * (1. - smoothstep(.7, .82, w.r));
      ph = mix(uG, w.r, wr);
    }
    float u = ph * 1024.;                                  // source px along the river, mod 1024
    float v = w.b * 2. - 1.;
    float lanes = 5.;
    float lv = (v + 1.) * .5 * lanes;
    float lane = floor(lv);
    float h1 = hash(vec2(lane, 3.1)), h2 = hash(vec2(lane, 7.7)), h3 = hash(vec2(lane, 1.3));
    // not every lane carries a stroke, and the outer ones stay clear of the banks
    float on = step(.3, h1) * step(.5, lane) * step(lane, lanes - 1.5);
    float speed = 22. + 22. * h2;                          // source px per second, downstream
    float sPos = fract((u - uTime * speed) / 1024. + h3 * 5.);
    float len = .16 + .14 * h1;                            // a stroke is 160..310 source px long
    float t = sPos / len;                                  // 0 at its head .. 1 at its tail
    if (on > 0. && t < 1.) {
      // brush profile: pressed on at the head, lifting off along the tail
      float body = pow(sin(3.14159 * pow(t, .7)), .6) * (1. - .35 * t);
      // ragged edges and dry bristle gaps, in the stroke's own coordinate: they travel with it,
      // and never cross the place where u wraps (that would cut every stroke in one spot)
      float k = sPos * 1024. + h3 * 97.;
      float edge = (vnoise(vec2(k * .02, lane * 13.)) - .5) * .06;   // a slow waver of the brush, no jitter
      float across = abs(fract(lv) - .5) + edge;
      float width = .42 * body;
      float shape = 1. - smoothstep(width * .3, width, across);   // a soft edge, like ink on wet paper
      float bristle = smoothstep(.15, .7, vnoise(vec2(k * .012, fract(lv) * 16. + lane * 7.)));
      float dry = mix(1., bristle, .3 + .7 * smoothstep(.3, 1., t));   // bristle marks, the tail breaking up as the brush runs dry
      float st = shape * dry * w.a * settle * smoothstep(.1, .28, inkS);
      if (h2 > .5) strokeW = st; else strokeD = st;
    }
  }
  a = mix(a, a * .3, strokeW);                             // white: the paper shows through the water
  a = a + strokeD * .75 * (1. - a);                         // black: a darker sweep of ink

  // ---------- mist: banks of fog drifting across the river, left to right ----------
  // Endless noise sliding sideways: a bank comes in from the left edge of the painting,
  // crosses it and fades out at the right, and new ones keep coming. Over the ink it is a
  // veil towards the paper; over bare paper, a pale grey wisp, so the fog reads as fog.
  // it comes in softly behind the dried ink, never with the front's hard edge
  float fogIn = smoothstep(-.02, .18, uDry - texture2D(uFlow, uv).r);
  if (fogIn > 0.) {
    vec2 mq = q * vec2(2.2, 4.6) - vec2(uTime * .055, 0.);     // ~40 s to cross the painting
    vec2 warp = vec2(fbm(mq * .6 + 3.1), fbm(mq * .6 + 9.4)) - .5;
    float f = fbm(mq + warp * 1.1);
    float bank = smoothstep(.45, .66, f);
    // it lives within the painting: fades at its sides, above the source and over the lake
    float frame = smoothstep(0., .18, uv.x) * smoothstep(1., .82, uv.x)
                * smoothstep(.1, .16, uv.y) * smoothstep(.82, .74, uv.y);
    float mist = bank * frame * fogIn;
    a *= 1. - mist * .65 * (1. - smoothstep(.7, .95, inkS));   // the veil spares the darkest strokes
    a = a + mist * .1 * (1. - a) * (1. - smoothstep(.05, .3, inkS));   // the wisp over bare paper
  }

  float conc = max(ink * arrive, strokeD);
  vec3 col = mix(vec3(.21, .26, .35), vec3(.035, .04, .05), pow(conc, .7));
  gl_FragColor = vec4(col * a, a);
}
