/**
 * The hero's hanging scroll in 3D (three.js), edge to edge: the sheet hangs
 * from above the screen and unrolls downward off a wooden roller as the page
 * scrolls; once it is fully open the roller has left the screen and the sheet
 * covers it.
 *
 * - The roll is a real spiral with the paper's thickness: it thins as it
 *   unrolls, and the roller turns by exactly the paper that left it.
 * - It rolls painting-inwards, like a real kakemono: the roller hangs in front
 *   of the sheet, and the outside of the roll is the back of the paper.
 * - The hero's own shader (hero.frag.glsl) draws the part of the sheet the
 *   screen shows, the painting and the day's light on the paper included, into a
 *   render target in the same GL context; the sheet carries it, with the
 *   paper's fibres laid over. From behind, it shows through the paper,
 *   mirrored and soft.
 * - Lighting is relative: a flat sheet facing the viewer keeps the hero
 *   paper's exact colour; curves only ever shade, never glare.
 *
 * Ported from the scroll3d prototype (index.html). World units are CSS pixels
 * on the paper plane.
 */
import * as THREE from 'three'
import FRAG from '../shaders/hero.frag.glsl?raw'
import { RIVER, SPLASH_SEGMENTS } from '../config'
import type { InkUniforms } from './renderer'

/** Knobs of the roll, in CSS px. */
const ROLL = {
  core: 14, // wooden core radius
  thick: 1.6, // paper + backing thickness: how fat the roll is, how many turns it makes
  lightDeg: -35, // key light azimuth (negative: from the left)
  showThrough: 0.3, // how much of the painting shows through the back of the paper
}
const PAPER = '#ece8e1' // --hero-paper
// --hero-desk, taken as is: the renderer does no colour conversion
const DESK = new THREE.Color().setStyle('#14161a', THREE.LinearSRGBColorSpace)

export interface PaintRect {
  /** The painting's box on the fully unrolled sheet, in stage px (bottom-anchored like before). */
  left: number
  bottom: number
  w: number
  h: number
}

export interface Scroll3D {
  loadTexture(source: CanvasImageSource): void
  /** The stage size and where the painting sits on it. */
  setLayout(vw: number, vh: number, paint: PaintRect): void
  /**
   * 0: rolled up at the top edge, 1: fully open. Returns how far down the
   * screen the flat, unrolled part of the sheet reaches, in px.
   */
  setUnroll(u: number): number
  /** Re-renders the ink painting (the hero's shader) and the scene. */
  draw(u: InkUniforms): void
  dispose(): void
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

function fibres(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  n: number,
  color: string,
  alpha: number,
  len: number
) {
  g.strokeStyle = color
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * Math.random()
    g.lineWidth = rnd(0.3, 1.1)
    const x = Math.random() * w
    const y = Math.random() * h
    const a = Math.random() * Math.PI
    const l = rnd(len * 0.3, len)
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(
      x + (Math.cos(a) * l) / 2 + rnd(-3, 3),
      y + (Math.sin(a) * l) / 2 + rnd(-3, 3),
      x + Math.cos(a) * l,
      y + Math.sin(a) * l
    )
    g.stroke()
  }
  g.globalAlpha = 1
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.NoColorSpace // straight through: the renderer does no colour conversion
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/* The ink pass: the hero's fragment shader, over the part of the sheet on screen. */
const INK_VERT = `varying vec2 vStage; void main(){ vStage = uv; gl_Position = vec4(position.xy, 0., 1.); }`

/* The sheet: the prototype's roll, lighting and show-through, with the ink
   render target (the sheet as the screen shows it, opaque) over the paper. */
const SHEET_VERT = `
uniform float uU, uL, uTop, uR0, uH;
varying float vShade;
varying vec2 vSheetUv;
#include <common>
void main(){
  vSheetUv = uv;
  float s = 0.5 * uL - position.y;                 // distance along the sheet from its top edge
  float Rout = sqrt(uR0 * uR0 + uH * max(uL - uU, 0.) / PI);
  vec3 p;
  vec3 n;
  if (s <= uU) {
    p = vec3(position.x, uTop - s, 0.);
    n = vec3(0., 0., 1.);
    vShade = uU - s;
  } else {
    // wound as a spiral, painting inwards: behind the roller, under it, up its front
    float d = s - uU;
    float r = sqrt(max(Rout * Rout - uH * d / PI, uR0 * uR0));
    float phi = (2. * PI / uH) * (Rout - r);
    float yc = uTop - uU, zc = Rout;
    p = vec3(position.x, yc - r * sin(phi), zc - r * cos(phi));
    n = vec3(0., sin(phi), cos(phi));
    vShade = -1.;
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  // camera has no rotation: world and view directions agree
  vNormal = n;
}`
const SHEET_FRAG = `
uniform sampler2D uPaper, uInk;
uniform vec2 uPaperRepeat;
uniform vec4 uStage;          // sheet uv -> the ink target's uv (the part of the sheet on screen)
const vec3 PAPER = vec3(.925, .910, .882);   // the paper the ink pass paints on
uniform vec3 uLightDir;
uniform float uRout, uShow;
varying float vShade;
varying vec2 vSheetUv;
varying vec3 vNormal;
vec4 inkAt(vec2 uv, float bias){
  vec2 p = uv * uStage.xy + uStage.zw;
  if (p.x < 0. || p.y < 0. || p.x > 1. || p.y > 1.) return vec4(0.);
  return texture2D(uInk, p, bias);               // alpha 0 until it has been drawn
}
void main(){
  vec3 paper = texture2D(uPaper, vSheetUv * uPaperRepeat).rgb;
  vec3 col;
  if (gl_FrontFacing) {
    vec4 ink = inkAt(vSheetUv, 0.);
    col = mix(paper, ink.rgb * paper / PAPER, ink.a);   // what it drew, with this paper's fibres
  } else {
    // the back of the paper: the painting shows through, mirrored and soft
    vec4 ink = inkAt(vSheetUv, 2.5);
    col = mix(paper, ink.rgb * paper / PAPER, ink.a * uShow);
  }
  vec3 n = normalize(gl_FrontFacing ? vNormal : -vNormal);
  // relative lighting: flat and facing the viewer is exactly the paper; curves only shade
  float A = .55, D = .45;
  float flatLit = A + D * max(uLightDir.z, 0.);
  float shade = min((A + D * max(dot(n, uLightDir), 0.)) / flatLit, 1.);
  col *= shade;
  if (vShade >= 0.) col *= 1. - .3 * (1. - smoothstep(0., uRout * 2.4, vShade));   // the roller's shadow
  gl_FragColor = vec4(col, 1.);
}`

/** Returns null without WebGL2 (three.js needs it); throws if a shader fails. */
export function createScroll3D(canvas: HTMLCanvasElement): Scroll3D | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace // colours pass straight through
  renderer.toneMapping = THREE.NoToneMapping
  const maxAniso = renderer.capabilities.getMaxAnisotropy()

  const scene = new THREE.Scene()
  scene.background = DESK
  const camera = new THREE.PerspectiveCamera(20, 1, 10, 20000)

  /* ---- ink pass ---- */
  const inkScene = new THREE.Scene()
  const inkCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const inkUniforms = {
    uTex: { value: null as THREE.Texture | null },
    uP: { value: 0 },
    uBlotR: { value: 0 },
    uAspect: { value: 1 },
    uMaxD: { value: 1 },
    uBlot: { value: new THREE.Vector2() },
    uT: { value: 0 },
    uSeed: { value: 1 },
    uSeg: { value: new Float32Array(SPLASH_SEGMENTS * 4) as Float32Array },
    uRad: { value: new Float32Array(SPLASH_SEGMENTS * 2) as Float32Array },
    uR0: { value: 0 },
    uWet: { value: 0 },
    uSunT: { value: -1 },
    uSunR: { value: 0 },
    uSun: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uFog: { value: 0 },
    uFogSpeed: { value: 0 },
    uPScale: { value: new THREE.Vector2(1, 1) },
    uPOffset: { value: new THREE.Vector2() },
    uS: { value: 0 },
    uM: { value: 0 },
    uSunC: { value: new THREE.Vector2() },
    uSet: { value: new THREE.Vector2() },
    uSetHz: { value: 0 },
    uMoon0: { value: new THREE.Vector2() },
    uMoonC: { value: new THREE.Vector2() },
    uMoon1: { value: new THREE.Vector2() },
    uMoonR: { value: 0 },
    uBand: { value: 0 },
    uMBand: { value: 0 },
    uSunDraw: { value: 0 },
    uSunGone: { value: 0 },
    uMoonDraw: { value: 0 },
    uMoonGone: { value: 0 },
    uFade: { value: new THREE.Vector2(9, 10) },
    uRiver: { value: RIVER.points.map(([x, y]) => new THREE.Vector2(x, y)) },
    uHw: { value: [...RIVER.halfWidth] },
  }
  const inkMat = new THREE.ShaderMaterial({
    vertexShader: INK_VERT,
    fragmentShader: FRAG,
    uniforms: inkUniforms,
  })
  inkScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), inkMat))
  let rt: THREE.WebGLRenderTarget | null = null
  let texReady = false

  /* ---- the sheet ---- */
  const paperTex = canvasTexture(1024, 1024, (g) => {
    g.fillStyle = PAPER
    g.fillRect(0, 0, 1024, 1024)
    fibres(g, 1024, 1024, 2600, '#d4cdc0', 0.16, 22)
  })
  paperTex.anisotropy = maxAniso
  const sheetU = {
    uU: { value: 0 },
    uL: { value: 1 },
    uTop: { value: 0 },
    uR0: { value: ROLL.core },
    uH: { value: ROLL.thick },
    uRout: { value: 1 },
    uPaper: { value: paperTex },
    uPaperRepeat: { value: new THREE.Vector2(1, 1) },
    uInk: { value: null as THREE.Texture | null },
    uStage: { value: new THREE.Vector4(1, 1, 0, 0) },
    uLightDir: { value: new THREE.Vector3(0, 0, 1) },
    uShow: { value: ROLL.showThrough },
  }
  const sheetMat = new THREE.ShaderMaterial({
    vertexShader: SHEET_VERT.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vNormal;'
    ),
    fragmentShader: SHEET_FRAG,
    uniforms: sheetU,
    side: THREE.DoubleSide,
  })
  let sheet: THREE.Mesh | null = null

  const woodTex = canvasTexture(1024, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256)
    grd.addColorStop(0, '#4a3222')
    grd.addColorStop(0.5, '#6a4a33')
    grd.addColorStop(1, '#43301f')
    g.fillStyle = grd
    g.fillRect(0, 0, 1024, 256)
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = Math.random() < 0.5 ? '#2b1c12' : '#8a6446'
      g.globalAlpha = rnd(0.08, 0.35)
      g.lineWidth = rnd(0.5, 2.5)
      const y = Math.random() * 256
      g.beginPath()
      g.moveTo(0, y)
      for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * rnd(1, 5))
      g.stroke()
    }
    g.globalAlpha = 1
  })
  const woodMat = new THREE.MeshBasicMaterial({ map: woodTex })
  const roller = new THREE.Group()
  scene.add(roller)

  // soft shadow of the roll on the desk below it
  const shadowTex = canvasTexture(64, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256)
    grd.addColorStop(0, 'rgba(0,0,0,.85)')
    grd.addColorStop(0.35, 'rgba(0,0,0,.45)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 256)
  })
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
  )
  scene.add(shadow)

  const a = THREE.MathUtils.degToRad(ROLL.lightDeg)
  sheetU.uLightDir.value.set(Math.sin(a) * 900, 700, Math.cos(a) * 900).normalize()

  /* ---- layout ---- */
  let W = 0
  let L = 0
  let top = 0
  let uMin = 0
  let unrolled = 0
  let vh = 1

  function layoutRoll(vw: number, h: number, paint: PaintRect) {
    vh = h
    renderer.setSize(vw, vh, false)
    camera.aspect = vw / vh
    camera.position.set(0, 0, vh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    camera.updateProjectionMatrix()

    W = vw + 8 // a little wider than the screen: the sheet's edges never show
    top = vh / 2 + 2 // it hangs from just above the screen
    // long enough that at the end the roll has left the screen and paper fills it
    const rGuess = Math.sqrt(ROLL.core ** 2 + (ROLL.thick * (vh * 1.35)) / Math.PI)
    L = vh + rGuess * 2 + 40
    const rOut0 = Math.sqrt(ROLL.core ** 2 + (ROLL.thick * L) / Math.PI)
    uMin = rOut0 // rolled up: the whole roll sits under the top edge
    sheetU.uL.value = L
    sheetU.uTop.value = top
    sheetU.uPaperRepeat.value.set(W / 1024, L / 1024)
    // the ink target covers the part of the sheet on screen once it is unrolled: from sheet uv
    // (v = 1 at the sheet's top edge, which hangs 2 px above the screen) to the target's uv
    sheetU.uStage.value.set(W / vw, L / vh, -(W - vw) / 2 / vw, 1 - (L - 2) / vh)
    // and the painting's place on it: target uv -> painting uv (the painting is bottom-anchored)
    inkUniforms.uPScale.value.set(vw / paint.w, vh / paint.h)
    inkUniforms.uPOffset.value.set(-paint.left / paint.w, -paint.bottom / paint.h)

    if (sheet) {
      scene.remove(sheet)
      sheet.geometry.dispose()
    }
    sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, L, 1, Math.round(L / 1.2)), sheetMat)
    sheet.frustumCulled = false
    scene.add(sheet)

    roller.clear()
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(ROLL.core, ROLL.core, W * 1.3, 48),
      woodMat
    )
    core.rotation.z = Math.PI / 2
    roller.add(core)

    // the ink render target: the screen's part of the sheet (capped, as before)
    const dpr = renderer.getPixelRatio()
    const scale = Math.min(1, 2900 / (vw * dpr))
    const rw = Math.max(2, Math.round(vw * dpr * scale))
    const rh = Math.max(2, Math.round(vh * dpr * scale))
    if (!rt) {
      rt = new THREE.WebGLRenderTarget(rw, rh, {
        generateMipmaps: true, // the back of the paper samples it soft
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
      })
      rt.texture.anisotropy = maxAniso
      sheetU.uInk.value = rt.texture
    } else rt.setSize(rw, rh)
    // blank until the painting is drawn into it
    renderer.setRenderTarget(rt)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.setRenderTarget(null)
    renderer.setClearColor(DESK, 1)
  }

  function place() {
    const u = uMin + (L - uMin) * unrolled
    sheetU.uU.value = u
    const rOut = Math.sqrt(ROLL.core ** 2 + (ROLL.thick * Math.max(L - u, 0)) / Math.PI)
    sheetU.uRout.value = rOut
    // the roll hangs in front of the sheet and turns by exactly the paper that left it
    roller.position.set(0, top - u, rOut)
    roller.rotation.x = -((2 * Math.PI) / ROLL.thick) * (rOut - ROLL.core)
    shadow.scale.set(W * 1.2, rOut * 3.2, 1)
    shadow.position.set(0, top - u - rOut * 2.2, -30)
  }

  function render() {
    place()
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
  }

  return {
    loadTexture(source) {
      // mip-mapped, power-of-two, like the hero's own renderer
      const big = renderer.capabilities.maxTextureSize >= 4096
      const c = document.createElement('canvas')
      c.width = big ? 4096 : 2048
      c.height = big ? 2048 : 1024
      c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height)
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.NoColorSpace
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.anisotropy = maxAniso
      inkUniforms.uTex.value = t
      texReady = true
    },

    setLayout(vw, h, paint) {
      layoutRoll(vw, h, paint)
      render()
    },

    setUnroll(u) {
      unrolled = Math.min(1, Math.max(0, u))
      render()
      return vh / 2 - top + sheetU.uU.value
    },

    draw(u) {
      if (texReady && rt) {
        const iu = inkUniforms
        iu.uP.value = u.p
        iu.uBlotR.value = u.blotR
        iu.uAspect.value = u.aspect
        iu.uMaxD.value = u.maxD
        iu.uBlot.value.set(u.blot[0], u.blot[1])
        iu.uT.value = u.t
        iu.uSeed.value = u.seed
        iu.uR0.value = u.r0
        iu.uWet.value = u.wet
        iu.uSunT.value = u.sunT
        iu.uSunR.value = u.sunR
        iu.uSun.value.set(u.sun[0], u.sun[1])
        iu.uTime.value = u.time
        iu.uFog.value = u.fog
        iu.uFogSpeed.value = u.fogSpeed
        iu.uSeg.value = u.seg
        iu.uRad.value = u.rad
        iu.uS.value = u.s
        iu.uM.value = u.m
        iu.uSunC.value.set(u.sunC[0], u.sunC[1])
        iu.uSet.value.set(u.set[0], u.set[1])
        iu.uSetHz.value = u.setHz
        iu.uMoon0.value.set(u.moon0[0], u.moon0[1])
        iu.uMoonC.value.set(u.moonC[0], u.moonC[1])
        iu.uMoon1.value.set(u.moon1[0], u.moon1[1])
        iu.uMoonR.value = u.moonR
        iu.uBand.value = u.band
        iu.uMBand.value = u.mband
        iu.uSunDraw.value = u.sunDraw
        iu.uSunGone.value = u.sunGone
        iu.uMoonDraw.value = u.moonDraw
        iu.uMoonGone.value = u.moonGone
        iu.uFade.value.set(u.fade[0], u.fade[1])
        renderer.setRenderTarget(rt)
        renderer.setClearColor(0x000000, 0)
        renderer.clear()
        renderer.render(inkScene, inkCam)
        renderer.setClearColor(DESK, 1)
      }
      render()
    },

    dispose() {
      rt?.dispose()
      sheet?.geometry.dispose()
      ;[paperTex, woodTex, shadowTex, inkUniforms.uTex.value].forEach((t) => t?.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
