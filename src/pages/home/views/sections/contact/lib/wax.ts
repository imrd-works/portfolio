/**
 * The wax seal, in three.js rather than in a photograph: a six-sided lump of
 * wax with a bevelled, hand-pressed edge, a physical material with a clearcoat
 * over it, and the initials pressed into the surface by a bump map drawn with
 * the page's own font. One directional key light from the upper left, a cool
 * fill from the right, so the wax catches light the way wax does.
 */
import * as THREE from 'three'

export interface WaxOptions {
  /** Logical size, css px — the canvas is square. */
  size: number
  dpr: number
  /** The initials pressed into the wax. */
  text: string
  /** How far the seal is turned, degrees. */
  tilt?: number
}

export interface WaxSeal {
  canvas: HTMLCanvasElement
  dispose(): void
}

// lit and tone mapped, this lands on the cinnabar of the other seals (#c23b2a)
const WAX = 0x7d1f14

/** A round seal, pressed by hand, so its edge is never a true circle. */
function waxShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape()
  const steps = 160
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    // the wax squeezed out unevenly under the stamp
    const r =
      radius *
      (1 + 0.035 * Math.sin(a * 3 + 0.6) + 0.02 * Math.sin(a * 7 + 2.1) + 0.012 * Math.sin(a * 13))
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

/**
 * ExtrudeGeometry lays its uv out in world units, which repeats the initials
 * across the face; the front of the seal gets its own square uv instead.
 */
function squareUv(geometry: THREE.ExtrudeGeometry, radius: number) {
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / (2.2 * radius) + 0.5, pos.getY(i) / (2.2 * radius) + 0.5)
  }
  uv.needsUpdate = true
}

/** A plain studio: bright above, warm paper below, for the wax to reflect. */
function studio(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 32
  const g = c.getContext('2d')!
  const sky = g.createLinearGradient(0, 0, 0, 32)
  sky.addColorStop(0, '#ffffff')
  sky.addColorStop(0.5, '#d9d4cb')
  sky.addColorStop(1, '#6b6157')
  g.fillStyle = sky
  g.fillRect(0, 0, 64, 32)
  const source = new THREE.CanvasTexture(c)
  source.mapping = THREE.EquirectangularReflectionMapping
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(source).texture
  source.dispose()
  pmrem.dispose()
  return env
}

/** The face of the seal: a pressed ring near the edge and the sunk initials. */
function bumpMap(text: string, px: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = px
  c.height = px
  const g = c.getContext('2d')!
  // mid grey is the untouched surface: lighter rises, darker sinks
  g.fillStyle = '#808080'
  g.fillRect(0, 0, px, px)

  // the rim the stamp pushed up, and the shallow bed it pressed inside it
  g.lineWidth = px * 0.035
  g.filter = `blur(${px * 0.014}px)`
  g.strokeStyle = '#a8a8a8'
  g.beginPath()
  g.arc(px / 2, px / 2, px * 0.385, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = '#6a6a6a'
  g.lineWidth = px * 0.02
  g.beginPath()
  g.arc(px / 2, px / 2, px * 0.345, 0, Math.PI * 2)
  g.stroke()

  // the initials, sunk in, with the wax pushed up along their edges
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `500 ${Math.round(px * 0.2)}px Unbounded, sans-serif`
  g.filter = `blur(${px * 0.012}px)`
  g.fillStyle = '#d8d8d8'
  g.fillText(text, px / 2, px / 2 + px * 0.008)
  g.filter = `blur(${px * 0.005}px)`
  g.fillStyle = '#0c0c0c'
  g.fillText(text, px / 2, px / 2 + px * 0.008)
  g.filter = 'none'

  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.NoColorSpace
  return texture
}

/** Renders the seal once and hands back the canvas it was drawn on. */
export function paintWax({ size, dpr, text, tilt = -5 }: WaxOptions): WaxSeal | null {
  const canvas = document.createElement('canvas')
  let renderer: THREE.WebGLRenderer
  try {
    // not premultiplied: the canvas is copied into a 2d context afterwards,
    // and premultiplied pixels come out washed and see-through there
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
  } catch {
    return null
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setPixelRatio(dpr)
  renderer.setSize(size, size, false)
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  const scene = new THREE.Scene()
  // straight down on the letter, so the seal reads as a stamp, not an object
  const camera = new THREE.OrthographicCamera(-48, 48, 48, -48, 0.1, 400)
  camera.position.set(0, 0, 120)

  const radius = 40
  const geometry = new THREE.ExtrudeGeometry(waxShape(radius), {
    depth: 4,
    bevelEnabled: true,
    bevelThickness: 4.5,
    bevelSize: 4.5,
    bevelSegments: 10,
    curveSegments: 12,
  })
  geometry.center()
  squareUv(geometry, radius)
  geometry.computeVertexNormals()

  const bump = bumpMap(text, Math.round(size * dpr))
  const material = new THREE.MeshPhysicalMaterial({
    color: WAX,
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.24,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xff8d72),
    envMap: studio(renderer),
    envMapIntensity: 0.55,
    bumpMap: bump,
    bumpScale: 8,
  })
  const seal = new THREE.Mesh(geometry, material)
  seal.rotation.z = (tilt * Math.PI) / 180
  scene.add(seal)

  const key = new THREE.DirectionalLight(0xfff3e8, 2.2)
  key.position.set(-70, 90, 110)
  const fill = new THREE.DirectionalLight(0xbcd0e6, 0.5)
  fill.position.set(90, -40, 60)
  const rim = new THREE.DirectionalLight(0xffd7c2, 0.7)
  rim.position.set(30, -90, 20)
  scene.add(key, fill, rim, new THREE.AmbientLight(0x3a140e, 0.8))

  renderer.render(scene, camera)

  return {
    canvas,
    dispose() {
      geometry.dispose()
      material.dispose()
      bump.dispose()
      renderer.dispose()
    },
  }
}
