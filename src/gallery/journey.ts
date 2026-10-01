import * as THREE from 'three'
import { GALLERY, type GalleryItem } from './artwork.ts'

const WARM = 0xffe6c4

export interface Beacon {
  anchor: THREE.Vector3
  light: THREE.PointLight
  column: THREE.Mesh
  pool: THREE.Mesh
  setAccent: (hex: string) => void
}

export interface Ribbon {
  points: THREE.Points
  path: THREE.CatmullRomCurve3
  positions: Float32Array
  phases: Float32Array
  count: number
  progress: number
}

export interface JourneyField {
  group: THREE.Group
  dust: THREE.Points
  dustPositions: Float32Array
  dustPhases: Float32Array
  ribbons: Ribbon[]
  beacons: Beacon[]
  revealLight: THREE.DirectionalLight
  update: (delta: number, elapsed: number) => void
  reveal: (t: number) => void
  setAccent: (hex: string) => void
  dispose: () => void
}

function anchorFor(item: GalleryItem): THREE.Vector3 {
  const { W, D } = GALLERY
  if (item.type !== 'artwork') return new THREE.Vector3(0, 1.85, -D / 2 + 0.06)
  switch (item.wall ?? 'back') {
    case 'left':
      return new THREE.Vector3(-W / 2 + 0.06, 1.85, item.z ?? 0)
    case 'right':
      return new THREE.Vector3(W / 2 - 0.06, 1.85, item.z ?? 0)
    default:
      return new THREE.Vector3(item.x ?? 0, 1.85, -D / 2 + 0.06)
  }
}

function inward(anchor: THREE.Vector3): THREE.Vector3 {
  const { W, D } = GALLERY
  return new THREE.Vector3(
    -Math.sign(anchor.x) * 0.75,
    0,
    anchor.z < 0 ? 0.75 : 0,
  ).clampLength(0, Math.max(W, D) / 2)
}

function createDust(count: number) {
  const { W, H, D } = GALLERY
  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  const bases = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 2 - 1) * (W / 2 - 0.6)
    const y = 0.2 + Math.random() * (H - 0.7)
    const z = -D / 2 + 0.6 + Math.random() * (D - 1.2)
    bases[i * 3] = x
    bases[i * 3 + 1] = y
    bases[i * 3 + 2] = z
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    phases[i] = Math.random() * Math.PI * 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: WARM,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, positions, phases, bases, material, geometry }
}

function createRibbon(anchor: THREE.Vector3, accent: string, count: number): Ribbon {
  const end = inward(anchor).setY(0.04)
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.04, D_FRONT),
    new THREE.Vector3(0, 0.04, 2.6),
    new THREE.Vector3(end.x * 0.3, 0.04, 0.6),
    new THREE.Vector3(end.x * 0.72, 0.04, end.z * 0.5),
    end.clone(),
  ])

  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const p = path.getPoint(i / count)
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = p.z
    phases[i] = Math.random() * Math.PI * 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(accent).lerp(new THREE.Color(WARM), 0.35),
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  return { points, path, positions, phases, count, progress: Math.random() }
}

const D_FRONT = 5.2

function createBeacon(anchor: THREE.Vector3, accent: string): Beacon {
  const inner = inward(anchor)
  const group = new THREE.Group()

  const columnGeo = new THREE.CylinderGeometry(0.22, 0.5, 3.1, 18, 1, true)
  const columnMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const column = new THREE.Mesh(columnGeo, columnMat)
  column.position.set(inner.x, 1.55, inner.z)
  group.add(column)

  const poolGeo = new THREE.CircleGeometry(0.95, 28)
  const poolMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const pool = new THREE.Mesh(poolGeo, poolMat)
  pool.rotation.x = -Math.PI / 2
  pool.position.set(inner.x, 0.02, inner.z)
  group.add(pool)

  const light = new THREE.PointLight(new THREE.Color(accent), 0.9, 7.5, 2)
  light.position.set(inner.x, 2.1, inner.z)
  group.add(light)

  return {
    anchor,
    light,
    column,
    pool,
    setAccent(hex: string) {
      const c = new THREE.Color(hex)
      ;(columnMat as THREE.MeshBasicMaterial).color.copy(c)
      ;(poolMat as THREE.MeshBasicMaterial).color.copy(c)
      light.color.copy(c)
    },
  }
}

export function createJourneyField(scene: THREE.Scene, items: GalleryItem[], accent: string): JourneyField {
  const group = new THREE.Group()
  group.name = 'journey-field'
  scene.add(group)

  const dustData = createDust(600)
  group.add(dustData.points)

  const ribbons: Ribbon[] = []
  const beacons: Beacon[] = []

  for (const item of items) {
    if (item.type !== 'artwork') continue
    const anchor = anchorFor(item)
    const ribbon = createRibbon(anchor, accent, 90)
    group.add(ribbon.points)
    ribbons.push(ribbon)

    const beacon = createBeacon(anchor, accent)
    group.add(beacon.column, beacon.pool, beacon.light)
    beacons.push(beacon)
  }

  const revealLight = new THREE.DirectionalLight(WARM, 0)
  revealLight.position.set(3, 8, 9)
  group.add(revealLight)

  let revealT = 1
  let pulse = 0

  function update(delta: number, elapsed: number) {
    const { positions, phases, bases, geometry, material } = dustData
    for (let i = 0; i < phases.length; i++) {
      const ph = phases[i]
      positions[i * 3] = bases[i * 3] + Math.sin(elapsed * 0.12 + ph) * 0.22
      positions[i * 3 + 1] = bases[i * 3 + 1] + Math.sin(elapsed * 0.09 + ph * 1.7) * 0.18
      positions[i * 3 + 2] = bases[i * 3 + 2] + Math.cos(elapsed * 0.1 + ph * 0.6) * 0.22
    }
    geometry.attributes.position.needsUpdate = true
    material.opacity = 0.22 * revealT

    pulse += delta
    for (const ribbon of ribbons) {
      ribbon.progress = (ribbon.progress + delta * 0.035) % 1
      const arr = ribbon.points.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < ribbon.count; i++) {
        const t = (i / ribbon.count + ribbon.progress) % 1
        const p = ribbon.path.getPoint(t)
        arr[i * 3] = p.x
        arr[i * 3 + 1] = p.y + Math.sin(elapsed * 1.4 + ribbon.phases[i]) * 0.012
        arr[i * 3 + 2] = p.z
      }
      ribbon.points.geometry.attributes.position.needsUpdate = true
      ;(ribbon.points.material as THREE.PointsMaterial).opacity = 0.5 * revealT
    }

    for (const beacon of beacons) {
      const breathe = 0.82 + Math.sin(pulse * 0.9 + beacon.anchor.x) * 0.18
      beacon.light.intensity = 0.9 * breathe * revealT
      ;(beacon.column.material as THREE.MeshBasicMaterial).opacity = 0.07 * breathe * revealT
      ;(beacon.pool.material as THREE.MeshBasicMaterial).opacity = 0.13 * breathe * revealT
    }

    revealLight.intensity = 1.1 * revealT
  }

  function reveal(t: number) {
    revealT = Math.max(0, Math.min(1, t))
  }

  function setAccent(hex: string) {
    ;(dustData.material as THREE.PointsMaterial).color
      .set(WARM)
      .lerp(new THREE.Color(hex), 0.25)
    for (const ribbon of ribbons) {
      ;(ribbon.points.material as THREE.PointsMaterial).color
        .set(hex)
        .lerp(new THREE.Color(WARM), 0.35)
    }
    for (const beacon of beacons) beacon.setAccent(hex)
  }

  function dispose() {
    scene.remove(group)
    group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
  }

  return {
    group,
    dust: dustData.points,
    dustPositions: dustData.positions,
    dustPhases: dustData.phases,
    ribbons,
    beacons,
    revealLight,
    update,
    reveal,
    setAccent,
    dispose,
  }
}
