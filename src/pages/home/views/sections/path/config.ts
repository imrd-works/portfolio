/**
 * The "Path" river: a tall ink painting that is drawn along its own course as
 * the page scrolls, with a wolverine's print at every bend and a step of the
 * career beside it. Geometry is in the painting's own pixels (1280x3808),
 * read off the painting by the prep script (scroll3d prototype, prep-river.py).
 */

/** Served from `public/`: ink density (0 paper, 1 black) and the order the flow reaches every pixel. */
export const RIVER_IMAGE = {
  ink: '/path/river-ink.webp',
  flow: '/path/river-flow.png',
  width: 1280,
  height: 3808,
} as const

/** Where along the flow (0..1) the river is at a given height of the painting: [y, flow]. */
export const RIVER_COURSE: ReadonlyArray<readonly [number, number]> = [
  [480, 0.0],
  [523, 0.0089],
  [563, 0.0159],
  [591, 0.0263],
  [621, 0.0333],
  [647, 0.0407],
  [674, 0.052],
  [698, 0.0586],
  [716, 0.0635],
  [731, 0.0727],
  [745, 0.083],
  [760, 0.0906],
  [806, 0.1012],
  [832, 0.1072],
  [849, 0.1154],
  [865, 0.1249],
  [881, 0.1333],
  [901, 0.1438],
  [919, 0.1522],
  [937, 0.1555],
  [951, 0.1625],
  [967, 0.1724],
  [982, 0.1817],
  [997, 0.1901],
  [1012, 0.1989],
  [1029, 0.2068],
  [1057, 0.2152],
  [1107, 0.2237],
  [1135, 0.2291],
  [1154, 0.237],
  [1169, 0.2474],
  [1176, 0.2548],
  [1181, 0.2633],
  [1185, 0.2722],
  [1191, 0.2807],
  [1199, 0.2879],
  [1224, 0.2978],
  [1257, 0.3058],
  [1296, 0.3125],
  [1354, 0.3213],
  [1384, 0.3282],
  [1411, 0.3363],
  [1438, 0.3456],
  [1457, 0.3537],
  [1475, 0.363],
  [1493, 0.372],
  [1514, 0.3788],
  [1558, 0.3856],
  [1617, 0.3948],
  [1672, 0.403],
  [1726, 0.4112],
  [1778, 0.4195],
  [1824, 0.4272],
  [1866, 0.4352],
  [1905, 0.4436],
  [1934, 0.4517],
  [1962, 0.4605],
  [1988, 0.4686],
  [2018, 0.4775],
  [2048, 0.4862],
  [2071, 0.4905],
  [2089, 0.4994],
  [2106, 0.5082],
  [2121, 0.5155],
  [2138, 0.5239],
  [2155, 0.5324],
  [2169, 0.5401],
  [2185, 0.5484],
  [2201, 0.5569],
  [2218, 0.5649],
  [2237, 0.5733],
  [2256, 0.5818],
  [2276, 0.5897],
  [2299, 0.5969],
  [2339, 0.607],
  [2382, 0.6158],
  [2417, 0.6208],
  [2440, 0.6266],
  [2459, 0.6352],
  [2476, 0.6458],
  [2486, 0.6535],
  [2492, 0.6611],
  [2497, 0.6693],
  [2501, 0.678],
  [2507, 0.6867],
  [2513, 0.6951],
  [2521, 0.7029],
  [2533, 0.7119],
  [2547, 0.7209],
  [2562, 0.7295],
  [2578, 0.7373],
  [2594, 0.7439],
  [2627, 0.7531],
  [2673, 0.7607],
  [2725, 0.7676],
  [2784, 0.7758],
  [2834, 0.7851],
  [2853, 0.792],
  [2862, 0.7996],
  [2867, 0.8081],
  [2873, 0.817],
  [2881, 0.8255],
  [2892, 0.8336],
  [2904, 0.8421],
  [2917, 0.8505],
  [2929, 0.8584],
  [2941, 0.8658],
  [2953, 0.8766],
  [2963, 0.8864],
  [2980, 0.8924],
  [3004, 0.8963],
  [3030, 0.9032],
  [3061, 0.9126],
  [3095, 0.9227],
  [3133, 0.9316],
  [3181, 0.9396],
  [3246, 0.9487],
  [3314, 0.9579],
  [3372, 0.9657],
]

export interface RiverStep {
  /** The print on the bank of the bend. */
  print: readonly [number, number]
  /** Which way the description extends from its inner edge. */
  side: 'left' | 'right'
  /** The description's inner edge (x) and vertical centre. */
  edge: number
  cy: number
  /** Flow value at which the ink reaches the print. */
  at: number
}

/** Oldest first: 2021 on the thin stream at the top, now at the lake. */
export const RIVER_STEPS: readonly RiverStep[] = [
  { print: [392, 800], side: 'left', edge: 340, cy: 770, at: 0.1008 },
  { print: [1035, 1300], side: 'right', edge: 1080, cy: 1320, at: 0.3138 },
  { print: [300, 1455], side: 'left', edge: 270, cy: 1500, at: 0.3822 },
  { print: [1135, 1985], side: 'right', edge: 1000, cy: 2380, at: 0.4869 },
  { print: [150, 2350], side: 'left', edge: 300, cy: 2680, at: 0.6143 },
  { print: [1150, 3015], side: 'right', edge: 940, cy: 3380, at: 0.7875 },
]

export const RIVER_SEAL = { x: 640, y: 3640, at: 0.985 } as const

export const RIVER_FLOW = {
  /** How far down the screen the ink runs ahead of the reader. */
  lead: 0.66,
  /** How fast the paper dries behind the ink, flow units per second: a pause lets it settle. */
  drySpeed: 0.05,
  /** The wet stretch behind the ink never gets longer than this (a fast scroll). */
  wetMax: 0.07,
  /** Behind by more than this, the ink catches up at once (a fast scroll). */
  catchUp: 0.12,
  /** Share of the width the painting takes on desktop. */
  column: 0.6,
  columnWide: 0.56,
  columnMax: 1180,
} as const
