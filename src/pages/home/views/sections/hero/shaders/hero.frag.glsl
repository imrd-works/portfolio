// The hero's sheet, as far as the screen shows it: the ink painting blooming out of the blot
// (wet-in-wet, the splash, drifting mist), the cinnabar sun and the day's light on the paper,
// then the evening: the sun goes down into a slit cut with the brush, the moon comes up out of
// another, the river's strokes catch their light. It is drawn opaque, paper included; scroll3d.ts lays the
// paper's fibres over it.
// Array sizes (26) must match SPLASH_SEGMENTS in ../config.ts, (9) the river's points.
precision highp float;
varying vec2 vStage;          // the part of the sheet on screen, 0..1, y up
uniform vec2 uPScale, uPOffset;   // screen -> painting uv
uniform sampler2D uTex;
uniform float uP, uBlotR, uAspect, uMaxD, uT, uSeed, uR0, uWet;
uniform float uSunT, uSunR;   // красное солнце: секунды с падения капли, радиус
uniform float uTime, uFog, uFogSpeed;   // банки тумана, плывущие через долину
uniform vec2 uSun;            // where the sun stands until the evening
uniform vec2 uBlot;
uniform vec4 uSeg[26];   // xy - хвост, zw - голова струи или летящей капли
uniform vec2 uRad[26];   // радиус у хвоста и у головы
// the evening
uniform float uS, uM;         // how far the sun has gone down, how far the moon has come up (0..1)
uniform vec2 uSunC, uSet;     // the sun's arc: its control point and its end, behind the hills
uniform float uSetHz;         // the height the glow over the horizon is born at (the sun's slit)
uniform vec2 uMoon0, uMoonC, uMoon1;
uniform float uMoonR;
uniform float uBand, uMBand; // the slits the sun goes into and the moon comes out of (painting y)
uniform float uSunDraw, uSunGone;    // how far each slit's stroke has been laid and taken away
uniform float uMoonDraw, uMoonGone;  // (0..1, in real time: scene.ts)
uniform vec2 uFade;           // the painting fades out from the top: shown below .x, gone above .y
uniform vec2 uRiver[9];       // the river's course, from the valley to its mouth (painting uv)
uniform float uHw[9];         // and its half-width (uv x)

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
// on a very wide screen the hills above the sun's slit fade into the sky
float fadeAt(float y){ return smoothstep(uFade.x, uFade.y, y); }
// The slit the sun goes into and the moon comes out of: one stroke of the brush, as a sumi-e
// painter would cut the sky with it. It comes down lightly, is fullest in the middle and lifts
// off into a hair; its edges ragged, the tail breaking into dry-brush streaks, bowed a little.
// `draw` 0..1: the brush travelling left to right; `fade` 1..0: the stroke going the way it
// came, lifted off from its start to its tail as gently as it was laid.
float slit(vec2 q, vec2 c, float r, float draw, float fade, float seed){
  if (draw <= 0. || fade <= 0.) return 0.;
  draw = draw * draw * (3. - 2. * draw);   // the brush sets off gently and slows to lift off
  float lift = 1. - fade;
  lift = lift * lift * (3. - 2. * lift);   // and so is it taken away
  float hw = r * 1.9;
  float u = (q.x - c.x + hw) / (2. * hw);                  // 0 at the start .. 1 at the tail
  if (u < -.02 || u > 1.) return 0.;
  float uc = clamp(u, 0., 1.);
  float press = pow(sin(3.14159 * pow(uc, .85)), .75) * (1. - .2 * uc);   // a touch heavier early on
  float th = r * .2 * press * (.8 + .4 * vnoise(vec2(q.x * 140., seed)));   // a ragged edge
  float y = c.y + sin(3.14159 * u) * r * .05 + (vnoise(vec2(u * 4., seed + 3.)) - .5) * r * .05;
  float d = (q.y - y) / max(th, 1e-5);
  float ad = abs(d);
  float body = 1. - smoothstep(.6, 1., ad + (vnoise(q * 400.) - .5) * .35);
  // dry brush: the hairs part toward the tail and at the edges, leaving streaks of paper
  float hairs = smoothstep(.3, .62, vnoise(vec2(u * 9. + seed, d * 5. + seed)));
  float dry = mix(1., hairs, clamp(smoothstep(.3, .95, u) + smoothstep(.55, 1., ad) * .5, 0., 1.));
  // as far as the brush has got: the ink soaks in behind it over a quarter of the stroke,
  // so there is no hard head; and the whole of it comes up from nothing as it starts
  float got = (1. - smoothstep(draw * 1.3 - .3, draw * 1.3, u)) * smoothstep(0., .3, draw);
  // ink: darker in its core where it was pressed, paler at the wet edges, grained by the paper
  float ink = (.55 + .45 * press) * (1. - .45 * smoothstep(.2, 1., ad)) * (.85 + .15 * vnoise(q * 320.));
  // taken away the same way: a soft front runs along it from the start, the ink paling off
  // behind it, and the whole of it thins to nothing by the end
  float left = smoothstep(lift * 1.3 - .3, lift * 1.3, u) * (1. - smoothstep(.7, 1., lift));
  return clamp(body * dry * got * ink * left, 0., 1.);
}

vec2 arc(vec2 a, vec2 c, vec2 b, float t){ return mix(mix(a, c, t), mix(c, b, t), t); }
// where the arc crosses height y (the root inside 0..1): the slit is cut there, and stays put
// while the disc goes through it
float arcXAt(vec2 a, vec2 c, vec2 b, float y){
  float A = a.y - 2. * c.y + b.y, B = 2. * (c.y - a.y), C = a.y - y;
  float t;
  if (abs(A) < 1e-6) t = -C / B;
  else {
    float D = sqrt(max(B * B - 4. * A * C, 0.));
    t = (-B - D) / (2. * A);
    if (t < 0. || t > 1.) t = (-B + D) / (2. * A);
  }
  return arc(a, c, b, clamp(t, 0., 1.)).x;
}

float inkAt(vec2 uv, float bias){ return 1. - smoothstep(.02, .97, texture2D(uTex, uv, bias).r); }

// where a point is on the river: .x along it from the source (q units), .y across (-1..1
// bank to bank), .z the river's whole length
vec3 riverAt(vec2 q){
  float best = 1e3, acc = 0.; vec3 r = vec3(0., 9., 0.);
  for (int i = 0; i < 8; i++) {
    vec2 a = uRiver[i] * vec2(uAspect, 1.), b = uRiver[i + 1] * vec2(uAspect, 1.);
    vec2 ba = b - a; float L = length(ba);
    float h = clamp(dot(q - a, ba) / (L * L), 0., 1.);
    float d = length(q - a - ba * h);
    if (d < best) {
      best = d;
      float side = sign(ba.x * (q.y - a.y) - ba.y * (q.x - a.x));
      float hw = mix(uHw[i], uHw[i + 1], h) * uAspect;
      r = vec3(acc + h * L, side * d / hw, 0.);
    }
    acc += L;
  }
  r.z = acc;
  return r;
}

void main(){
  vec2 vUv = vStage * uPScale + uPOffset;   // the painting's uv (outside 0..1: bare sheet)
  float inside = step(0., vUv.x) * step(vUv.x, 1.) * step(0., vUv.y) * step(vUv.y, 1.);
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  vec2 b = vec2(uBlot.x * uAspect, uBlot.y);
  vec2 dv = q - b;
  float dist = length(dv);
  vec2 rdir = dv / max(dist, 1e-5);

  // рябь по водяной пленке от удара капли: пакет из пары колец, гаснет за ~1.5 с
  float wave = 0.;
  if (uT > 0. && uT < 2.) {
    float x = dist - uT * .55;
    wave = sin(x * 95.) * exp(-x * x / .0035) * exp(-uT * 2.1) * smoothstep(0., .06, uT) / (1. + dist * 2.5);
  }
  float inkB = inkAt(vUv, 4.5);    // расплывшаяся тушь: так она выглядит, пока бумага мокрая
  float inkW = inkAt(vUv, 6.5);    // очень размытый след: где бумага смочена водой

  vec2 uv = vUv + rdir / vec2(uAspect, 1.) * wave * .007;   // рябь от удара слегка преломляет то, что под водой

  float inkS = inkAt(uv, 0.);      // четкий рисунок: то, чем все закончится

  float n    = fbm(q * 5.0);                          // крупные языки растекания
  float nf   = fbm(q * 38.0);                         // волокна бумаги
  float tend = 1. - abs(2. * fbm(q * 13. + 4.2) - 1.);  // тонкие "жилки", по которым тушь забегает вперед

  // "время прихода туши": от кляксы наружу, по смоченным местам быстрее, по жилкам еще быстрее
  float T = dist / uMaxD * .62 + n * .30 + (1. - inkB) * .16 + nf * .05 - tend * .07;

  float since  = uP - T;                          // сколько прошло с прихода туши в эту точку
  float arrive = smoothstep(0., .15, since);      // фронт мягкий: тушь в воде не имеет резкого края
  float settle = smoothstep(.05, .34, since);     // бумага сохнет: расплывшееся пятно собирается в рисунок

  float wetInk = clamp(max(inkB, inkS * .55) * 1.15, 0., 1.);   // по-мокрому тушь шире и плотнее
  float ink = mix(wetInk, inkS, settle);
  float a = ink * arrive;

  // бледная разбавленная кромка, которая бежит впереди основной туши
  float lead = smoothstep(-.07, 0., since) * (1. - arrive) * inkW * .30;
  a = max(a, lead);

  // едва заметный влажный след рисунка на еще чистом листе и тени ряби на воде
  float wetHint = inkW * uWet * (1. - smoothstep(-.07, .05, since)) * (.75 + .5 * n);
  float rippleShade = max(wave, 0.) * 9. * (.3 + inkW) * .05;
  float water = clamp(wetHint + rippleShade, 0., .2);

  // ---------- всплеск ----------
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
    s = max(s, speck);

    // мокрый ореол: разбавленная тушь ползет по волокнам, по краю темнее
    float Rh = R * (1.15 + 1.25 * (1. - exp(-uT * .9))) * (.85 + .4 * n1) + (nf - .5) * .012;
    float hin = 1. - smoothstep(Rh * .86, Rh, dl);
    float ring = smoothstep(Rh * .7, Rh * .93, dl) * hin;
    halo = hin * .13 + ring * .12;
  }

  a = max(a, max(s * .97, halo));
  a *= .94 + .06 * nf;
  float conc = max(ink * arrive, s);                       // концентрация туши
  vec3 col = mix(vec3(.21, .26, .35), vec3(.035, .04, .05), pow(conc, .7));

  // ---------- туман: банки тумана плывут через долину слева направо ----------
  // Тот же туман, что над рекой в «Пути» (river.frag.glsl): бесконечный шум едет вбок,
  // банк входит слева, пересекает картину и тает справа, следом идут новые. Над тушью это
  // вуаль к бумаге, над чистой бумагой бледная дымка. Частоты пересчитаны под широкий кадр:
  // банки того же размера относительно картины и пересекают ее за те же ~40 с.
  if (uFog > 0.) {
    vec2 mq = q * vec2(1.24, 2.6) - vec2(uTime * uFogSpeed, 0.);
    vec2 warp = vec2(fbm(mq * .6 + 3.1), fbm(mq * .6 + 9.4)) - .5;
    float f = fbm(mq + warp * 1.1);
    float bank = smoothstep(.45, .66, f);
    // живет в долине: тает у боковых краев, над лесом не поднимается в небо
    float frame = smoothstep(0., .18, vUv.x) * smoothstep(1., .82, vUv.x)
                * smoothstep(.08, .2, vUv.y) * smoothstep(.72, .5, vUv.y);
    // приходит мягко, когда рисунок уже просох
    float mist = bank * frame * uFog * settle;
    // лес здесь почти сплошь черный, поэтому вуаль щадит темные штрихи лишь наполовину,
    // иначе туман виден только над светлыми склонами
    a *= 1. - mist * .65 * (1. - .5 * smoothstep(.7, .95, inkS));
    a = a + mist * .14 * (1. - a) * (1. - smoothstep(.05, .3, inkS));   // дымка над чистой бумагой
  }
  a *= inside;   // no ink off the painting: the sheet round it is bare paper

  // ================= the day's light and the evening =================
  // the sun on its arc: it eases in and out, and ends just as the disc has gone into its slit
  float e = uS * uS * (3. - 2. * uS);
  vec2 sunUv = arc(uSun, uSunC, uSet, e);
  vec2 sc = vec2(sunUv.x * uAspect, sunUv.y);
  // how much of the disc has gone into its slit: 0 above it, 1 gone
  float hidden = clamp((uBand + .005 - (sunUv.y - uSunR)) / (2. * uSunR), 0., 1.);
  float sunVis = 1. - hidden;
  float redIn = smoothstep(.35, .9, uS);
  float nightIn = smoothstep(.7, 1., hidden) * smoothstep(.8, 1., uS);   // the glow lingers, then night

  // ---------- one light, from noon to night: a wash laid under the ink ----------
  // One glow (the haze over the valley, the horizon where the sun sets, a halo round the sun)
  // in one colour that runs along the day: pale yellow while the sun is high, then gold,
  // apricot, rose-orange as it goes down. Pigment multiplies the paper, so the ink stays ink
  // and the wash shows through the misty ranges as on real paper.
  vec3 paper = vec3(.925, .910, .882);
  float grain = .82 + .36 * fbm(q * 2.4 + 7.);   // uneven pigment: the wash pools
  float gran = .92 + .16 * nf;                   // and settles into the fibres
  float born = uSunT > 0. ? 1. - exp(-uSunT * .5) : 0.;          // it comes with the sun
  vec2 dh = q - vec2(uSet.x * uAspect, uSetHz + .01);
  float below = step(dh.y, 0.);
  float lay = 1. / (1. + pow(dh.x / .6, 2.)) * exp(-pow(dh.y / mix(.15, .06, below), 2.));
  vec2 dval = (vUv - vec2(.56, .5)) * vec2(1., 1.25);
  float valley = exp(-dot(dval, dval) / (.22 * .22)) * smoothstep(.14, .3, vUv.y) * smoothstep(.76, .6, vUv.y);
  vec2 dsun = (q - sc) * vec2(.8, 1.);
  // wide and soft, so it runs into the glow at the horizon; it stays on there as the sun goes
  float sunHalo = exp(-dot(dsun, dsun) / .05) * mix(.45, 1., sunVis);
  float glow = 1. - (1. - lay * .8) * (1. - valley) * (1. - sunHalo * .85);   // joined softly, no seams
  // the light's front runs out from the sun when it is born, ragged like wet paint
  float front = length((vUv - sunUv) * vec2(1., 1.3)) + (fbm(q * 4. + 1.7) - .5) * .18;
  float lightMask = born * (1. - smoothstep(born * 1.1 - .22, born * 1.1, front));
  // the day's scale: a step behind nearer the sun, so the colour runs outward from it too
  float day = clamp(uS * 1.15 + smoothstep(0., .7, length(dsun)) * .16, 0., 1.);
  vec3 lightC = mix(vec3(.99, .92, .70), vec3(.99, .82, .58), smoothstep(.0, .3, day));
  lightC = mix(lightC, vec3(.97, .70, .52), smoothstep(.25, .55, day));
  lightC = mix(lightC, vec3(.93, .60, .55), smoothstep(.55, .9, day));
  float amount = mix(.36, .46, smoothstep(0., .5, uS)) * (1. - .85 * nightIn);
  paper *= mix(vec3(1.), lightC, clamp(glow * lightMask * amount * grain * gran, 0., 1.));

  // ---------- the sun: a drop of cinnabar spreading into a disc ----------
  float bre = sin(uTime * 6.2832 / 9.), bre2 = sin(uTime * 6.2832 / 9. + 1.3);   // it breathes, slowly
  float grow = uSunT > 0. ? 1. - exp(-uSunT * 1.6) : 0.;
  vec2 sq = q + (vec2(vnoise(q * 40.), vnoise(q * 40. + 5.)) - .5) * .003 * (2. - grow);
  float sd = length(sq - sc);
  float SR = uSunR * (.26 + .74 * grow) * (1. + .035 * bre + .05 * redIn) * (.94 + .12 * fbm(q * 9. + 2.));
  float soft = mix(.10, .13, grow) + .02 * bre2;   // a clean soft edge, like the moon's
  float disc = 1. - smoothstep(SR * (1. - soft), SR * (1. + soft * .35), sd);
  float rim = smoothstep(SR * .6, SR * .95, sd) * disc;   // у высохшей размывки кромка темнее
  float dens = mix(.96, .60, grow) + .04 * bre2 + .10 * redIn;
  float sa = disc * dens * (.84 + .24 * rim) * (.9 + .1 * nf) * step(0., uSunT) * smoothstep(0., .08, uSunT);
  // it goes into its slit, whatever is painted there; nothing of it is left once the sunset is over
  sa *= smoothstep(uBand - .004, uBand + .004, vUv.y) * (1. - smoothstep(.9, 1., uS));
  vec3 sunCol = mix(vec3(.78, .22, .15), vec3(.82, .20, .16), redIn);
  vec3 base = mix(paper, sunCol, sa);

  // ---------- the river: long brush strokes riding downstream, as in the Path ----------
  // grey strokes of water; under the sun they catch its light and turn cinnabar, by night the
  // moon's and turn white. Only where the painting has dried.
  float strokeInk = 0., moonGlint = 0., riverNight = 0.;
  if (vUv.x > .44 && vUv.x < .7 && vUv.y > .09 && vUv.y < .37) {
    vec3 rv = riverAt(q);
    float u = rv.x, v = rv.y;
    float bed = 1. - smoothstep(.7, 1., abs(v));
    float ends = smoothstep(0., .05, u) * smoothstep(rv.z, rv.z - .05, u);   // out of the mist, spread at the mouth
    float wat = bed * ends * (1. - smoothstep(.12, .4, inkS)) * settle;
    riverNight = wat * smoothstep(rv.z * .35, rv.z * .6, u);   // the open lower reach only
    if (wat > 0.) {
      float lanes = 6.;
      float lv = (v * .8 + 1.) * .5 * lanes;
      float lane = floor(lv);
      float h1 = hash(vec2(lane, 3.1)), h2 = hash(vec2(lane, 7.7)), h3 = hash(vec2(lane, 1.3));
      float P = .36;                                   // the strokes' spacing along the river
      float speed = .012 + .012 * h2;                  // q units per second, downstream
      float sPos = fract((u - uTime * speed) / P + h3 * 5.);
      float len = (.08 + .07 * h1) / P;
      float t = sPos / len;                            // 0 at its head .. 1 at its tail
      if (h1 > .35 && t < 1.) {                        // not every lane carries a stroke
        float body = pow(sin(3.14159 * pow(t, .7)), .6) * (1. - .35 * t);   // pressed on, lifting off
        float k = sPos * P * 1600. + h3 * 97.;
        float edge = (vnoise(vec2(k * .02, lane * 13.)) - .5) * .08;
        float across = abs(fract(lv) - .5) + edge;
        float stroke = 1. - smoothstep(.3 * body * .3, .3 * body, across);
        float bristle = smoothstep(.15, .7, vnoise(vec2(k * .012, fract(lv) * 16. + lane * 7.)));
        float st = stroke * mix(1., bristle, .3 + .7 * smoothstep(.3, 1., t)) * wat;
        float lit = exp(-pow((q.x - sc.x) / (uSunR * 2.2), 2.)) * (1. - smoothstep(.0, .7, hidden)) * step(0., uSunT);
        base *= mix(vec3(1.), mix(sunCol, vec3(.95, .62, .55), .3) / .95, st * lit * .7);
        vec2 mNow = arc(uMoon0, uMoonC, uMoon1, uM * uM * (3. - 2. * uM));
        float mlit = smoothstep(.15, .6, uM) * (.45 + .55 * exp(-pow((q.x - mNow.x * uAspect) / .35, 2.)));
        moonGlint = st * mlit;
        strokeInk = st * (1. - lit) * (1. - mlit) * .18;
      }
    }
  }
  a = a + strokeInk * (1. - a);   // the river's grey strokes are ink too
  conc = max(conc, strokeInk);
  col = mix(vec3(.21, .26, .35), vec3(.035, .04, .05), pow(conc, .7)) * (1. - .12 * nightIn);

  // ---------- together: the ink over the sun over the washed paper ----------
  a *= 1. - fadeAt(vUv.y);
  vec3 outc = mix(base, col, a);
  // the sun's slit: the brush sets off in the moment the disc touches it (a stroke's width
  // before) and goes on slowly under it as it goes in; the moment the sun has gone through,
  // it is taken away (scene.ts lays and takes it away in real time)
  float slitX = arcXAt(uSun, uSunC, uSet, uBand + uSunR) * uAspect;
  float stS = slit(q, vec2(slitX, uBand), uSunR,
                   uSunDraw,
                   1. - uSunGone, 1.3);
  outc = mix(outc, vec3(.16, .17, .2), stS * .85);
  // night: a little darker and cooler, thinning out toward the bottom of the screen
  outc *= mix(vec3(1.), vec3(.87, .88, .93), nightIn * smoothstep(.0, .4, vStage.y));
  outc *= 1. - riverNight * nightIn * .08;
  outc = mix(outc, vec3(.985, .985, .98), moonGlint * .95);

  // ---------- the moon: out of its slit, once the sun is gone ----------
  // Painted the way the ink masters paint it: the moon itself is bare paper, and the sky round
  // it is washed a little darker so it shows ("clouds set off the moon").
  if (uM > 0.) {
    vec2 mUv = arc(uMoon0, uMoonC, uMoon1, uM * uM * (3. - 2. * uM));
    vec2 mc = vec2(mUv.x * uAspect, mUv.y);
    float md = length(q - mc);
    float mdisc = 1. - smoothstep(uMoonR * .93, uMoonR * 1.05, md);
    float seen = smoothstep(uMBand - .004, uMBand + .004, vUv.y);   // out of its slit
    float off = md - uMoonR;
    float ring = smoothstep(-.002, uMoonR * .25, off) * exp(-pow(off / (uMoonR * 1.6), 2.));
    // under its slit the disc is hidden, so the wash is laid whole there, over where the disc
    // is too: a ring round nothing would draw the moon's shape through the line
    ring = mix(exp(-pow(max(off, 0.) / (uMoonR * 1.6), 2.)), ring, seen);
    float cloud = .55 + .9 * fbm(q * 5. + vec2(uTime * .01, 0.));
    // the wash round it is not cut by the slit: it comes as the moon comes out and thins away
    // softly under the horizon, so no straight edge is left there
    float through = clamp((mUv.y + uMoonR - uMBand) / (2. * uMoonR), 0., 1.);
    float haze = smoothstep(uMBand - uMoonR * 2.5, uMBand + uMoonR * .5, vUv.y + (fbm(q * 7.) - .5) * uMoonR)
               * smoothstep(0., 1., through);
    outc *= mix(vec3(1.), vec3(.82, .83, .88), clamp(ring * cloud * .45 * haze, 0., 1.));
    float seas = smoothstep(.5, .75, fbm((q - mc) * 26. + 5.)) * .5;   // the faintest seas
    outc = mix(outc, mix(vec3(.955, .95, .935), vec3(.87, .875, .89), seas), mdisc * seen);
    // the brush cuts the sky just as the moon comes to it and goes on slowly as it comes out
    // of the cut, and once it is all out the stroke is taken away (in real time: scene.ts)
    float mSlitX = arcXAt(uMoon0, uMoonC, uMoon1, uMBand - uMoonR) * uAspect;
    float st = slit(q, vec2(mSlitX, uMBand), uMoonR,
                    uMoonDraw,
                    1. - uMoonGone, 5.7);
    outc = mix(outc, vec3(.16, .17, .2), st * .85);
  }
  gl_FragColor = vec4(outc, 1.);
}
