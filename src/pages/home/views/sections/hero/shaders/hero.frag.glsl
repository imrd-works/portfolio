// Ink reveal on paper: wet-in-wet bloom from the blot, splash, cinnabar sun, drifting mist.
// Array sizes (26) must match SPLASH_SEGMENTS in ../config.ts.
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uP, uBlotR, uAspect, uMaxD, uT, uSeed, uR0, uWet;
uniform float uSunT, uSunR;   // красное солнце
uniform float uTime, uFog, uFogSpeed;   // банки тумана, плывущие через долину
uniform vec2 uSun;
uniform vec2 uBlot;
uniform vec4 uSeg[26];   // xy - хвост, zw - голова струи или летящей капли
uniform vec2 uRad[26];   // радиус у хвоста и у головы

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

float inkAt(vec2 uv, float bias){ return 1. - smoothstep(.02, .97, texture2D(uTex, uv, bias).r); }

void main(){
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
  // ---------- красное солнце: капля киновари расплывается по мокрому ----------
  float sa = 0.;
  if (uSunT > 0.) {
    vec2 sc = vec2(uSun.x * uAspect, uSun.y);
    vec2 sq = q + (vec2(vnoise(q * 40.), vnoise(q * 40. + 5.)) - .5) * .006;
    float sd = length(sq - sc);
    float grow = 1. - exp(-uSunT * 1.6);                       // капля -> диск
    float SR = uSunR * (.26 + .74 * grow) * (.94 + .12 * fbm(q * 9. + 2.));
    float soft = mix(.10, .36, grow);                          // чем дольше в воде, тем мягче край
    float disc = 1. - smoothstep(SR * (1. - soft), SR * (1. + soft * .35), sd);
    float rim = smoothstep(SR * .6, SR * .95, sd) * disc;      // у высохшей размывки кромка темнее
    float dens = mix(.96, .60, grow);                          // густая капля разбавляется
    sa = disc * dens * (.84 + .24 * rim) * (.9 + .1 * nf) * smoothstep(0., .08, uSunT);
  }
  vec3 sunCol = vec3(.78, .22, .15);
  // солнце лежит под тушью: тушь поверх, киноварь просвечивает там, где туши нет
  gl_FragColor = vec4(col * a + sunCol * sa * (1. - a), a + sa * (1. - a));
}
