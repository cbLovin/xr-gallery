import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import sceneConfig from './data/artworks.json'
import {
  createArtwork,
  mountSculpture,
  GALLERY,
  type GalleryItem,
} from './gallery/artwork.ts'
import { createInfoCard } from './gallery/infocard.ts'
import { loadTheme, createSettingsUI } from './gallery/settings.ts'
import { updateGlows } from './gallery/glow.ts'
import { createTools, type ToolUI } from './gallery/tools.ts'
import type { ThemeTargets } from './gallery/themes.ts'

const items = sceneConfig as unknown as GalleryItem[]

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.xr.enabled = true
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x101014)

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.6

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
)
camera.position.set(0, 1.8, 8)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1.75, 0)
controls.maxPolarAngle = Math.PI / 2 + 0.09
controls.minDistance = 0.8
controls.maxDistance = 30

const { W, H, D } = GALLERY

const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a55, 1.25)
scene.add(hemi)
const ambient = new THREE.AmbientLight(0xffffff, 0.35)
scene.add(ambient)
const sun = new THREE.DirectionalLight(0xffffff, 1.2)
sun.position.set(5, 8, 4)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.far = 50
scene.add(sun)
const fill = new THREE.DirectionalLight(0xffffff, 1.2)
fill.position.set(-5, 8, -4)
fill.castShadow = false
scene.add(fill)

const floorMat = new THREE.MeshStandardMaterial({ color: 0x27272e, roughness: 0.9 })
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  floorMat,
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
floor.name = 'floor'
scene.add(floor)

const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.95 })
function addWall(w: number, h: number, x: number, y: number, z: number, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat)
  m.position.set(x, y, z)
  m.rotation.y = ry
  m.receiveShadow = true
  scene.add(m)
}
addWall(W, H, 0, H / 2, -D / 2)
addWall(H, H, -W / 2, H / 2, 0, Math.PI / 2)
addWall(H, H, W / 2, H / 2, 0, -Math.PI / 2)

const hangerMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.6 })
function addHanger(x: number, y: number, z: number) {
  const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), hangerMat)
  hanger.position.set(x, y, z)
  scene.add(hanger)
}

const initialTheme = loadTheme()
const artworkGroups = new Map<string, THREE.Group>()
for (const item of items) {
  if (item.type === 'artwork') {
    void createArtwork(item).then((group) => {
      scene.add(group)
      artworkGroups.set(item.id, group)
      group.traverse((o) => {
        if (o.userData.frame) {
          ;((o as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(
            initialTheme.frame,
          )
        }
      })
      const top = (group.position.y ?? 1.85) + 0.9
      switch (item.wall ?? 'back') {
        case 'left':
          addHanger(-W / 2 + 0.09, top, item.z ?? 0)
          break
        case 'right':
          addHanger(W / 2 - 0.09, top, item.z ?? 0)
          break
        default:
          addHanger(item.x ?? 0, top, -D / 2 + 0.06)
      }
    })
  } else {
    void mountSculpture(scene, item)
  }
}

const infoCard = createInfoCard()
infoCard.mesh.position.set(0, 1.2, 1.5)
scene.add(infoCard.mesh)

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const from = new THREE.Vector3()
const direction = new THREE.Vector3()
const laserLines: THREE.Line[] = []
const laserMats: THREE.LineBasicMaterial[] = []
const controllers: THREE.Group[] = []
const hovered = new Set<THREE.Group>()

function normalOf(hit: THREE.Intersection): THREE.Vector3 {
  const n = hit.face!.normal.clone()
  n.transformDirection(hit.object.matrixWorld)
  return n
}

function wallNormal(item: GalleryItem): THREE.Vector3 {
  if (item.type !== 'artwork') return new THREE.Vector3(0, 0, 1)
  switch (item.wall ?? 'back') {
    case 'left':
      return new THREE.Vector3(1, 0, 0)
    case 'right':
      return new THREE.Vector3(-1, 0, 0)
    default:
      return new THREE.Vector3(0, 0, 1)
  }
}

function cardSpotFor(group: THREE.Group, item: GalleryItem): THREE.Vector3 {
  return group.position
    .clone()
    .addScaledVector(wallNormal(item), 0.5)
    .setY(group.position.y + 1.0)
}

function placeCard(cfg: GalleryItem, hit: THREE.Intersection) {
  const spot = hit.point.clone().addScaledVector(normalOf(hit), 0.5)
  spot.y += 1.0
  infoCard.show(cfg, spot)
  tools.setActiveItem(cfg.id)
}

function artworkGroupOf(object: THREE.Object3D): THREE.Group | null {
  let o: THREE.Object3D | null = object
  while (o && !o.userData.glowMat) o = o.parent
  return o as THREE.Group | null
}

function setHovered(group: THREE.Group | null) {
  hovered.clear()
  if (group) hovered.add(group)
  renderer.domElement.style.cursor = group ? 'pointer' : 'default'
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) return
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster
    .intersectObjects([...artworkGroups.values()], true)
    .find((h) => h.object.userData.artwork)
  setHovered(hit ? artworkGroupOf(hit.object) : null)
})

renderer.domElement.addEventListener('pointerdown', (e) => {
  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) return
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster
    .intersectObjects(scene.children, true)
    .find((h) => h.object.userData.artwork)
  if (hit) {
    placeCard(hit.object.userData.config as GalleryItem, hit)
  } else {
    infoCard.hide()
  }
})

function initControllers() {
  for (const handedness of [0, 1]) {
    const controller = renderer.xr.getController(handedness)
    controller.addEventListener('select', () => {
      controller.getWorldPosition(from)
      controller.getWorldDirection(direction)
      raycaster.set(from, direction)
      const hit = raycaster
        .intersectObjects(scene.children, true)
        .find((h) => h.object.userData.artwork)
      if (hit) {
        placeCard(hit.object.userData.config as GalleryItem, hit)
      } else {
        infoCard.hide()
      }
    })
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x6ea8fe,
      transparent: true,
      opacity: 0.35,
    })
    const laser = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.02), new THREE.Vector3(0, 0, -3)]),
      laserMat,
    )
    laserLines.push(laser)
    laserMats.push(laserMat)
    controller.add(laser)
    scene.add(controller)
    controllers.push(controller)
  }
}
initControllers()

const themeTargets: ThemeTargets = {
  wallMat,
  floorMat,
  hangerMat,
  hemi,
  ambient,
  key: sun,
  fill,
  lasers: laserMats,
}
const clock = new THREE.Clock()
const cameraGoal = new THREE.Vector3()
const lookGoal = new THREE.Vector3()
const focus = { active: false, pos: new THREE.Vector3(), look: new THREE.Vector3() }
const tour = { active: false, index: 0, waiting: false, timer: 0 }
const homePos = new THREE.Vector3(0, 2.15, 7.99)
const homeLook = new THREE.Vector3(0, 1.75, 0)
let homeCaptured = false
let autoRotateSetting = false
createSettingsUI({
  scene,
  targets: themeTargets,
  initialTheme,
  onAutoRotate: (on) => {
    autoRotateSetting = on
    if (!tour.active && !focus.active) controls.autoRotate = on
    controls.autoRotateSpeed = 0.5
  },
  onLasers: (on) => {
    for (const line of laserLines) line.visible = on
  },
})

const title = document.createElement('div')
title.id = 'title'
title.className = 'ui'
title.textContent = 'ECHOSPHERE'
document.body.appendChild(title)

const hint = document.createElement('div')
hint.id = 'hint'
hint.className = 'ui'
hint.textContent = 'Drag to look · scroll to zoom · click a piece · hover for glow'
document.body.appendChild(hint)

function createVRButton(): HTMLButtonElement | null {
  if (!('xr' in navigator)) return null
  const button = document.createElement('button')
  button.className = 'vr ui'
  button.textContent = 'ENTER VR'
  let session: XRSession | null = null
  button.addEventListener('click', async () => {
    if (session) {
      await session.end()
      return
    }
    try {
      session = await navigator.xr!.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor'],
      })
      await renderer.xr.setSession(session)
      button.textContent = 'EXIT VR'
    } catch {
      button.textContent = 'VR UNAVAILABLE'
    }
  })
  navigator.xr!.addEventListener('end', () => {
    session = null
    button.textContent = 'ENTER VR'
  })
  return button
}

const vrButton = createVRButton()
if (vrButton) document.body.appendChild(vrButton)

let tools: ToolUI

function viewFor(group: THREE.Group, item: GalleryItem): { pos: THREE.Vector3; look: THREE.Vector3 } {
  const n = wallNormal(item)
  const pos = group.position.clone().addScaledVector(n, 3.2).setY(group.position.y + 0.35)
  const look = group.position.clone().setY(group.position.y + 0.6)
  return { pos, look }
}

function startFocus(group: THREE.Group, item: GalleryItem) {
  const v = viewFor(group, item)
  cameraGoal.copy(v.pos)
  lookGoal.copy(v.look)
  focus.pos.copy(cameraGoal)
  focus.look.copy(lookGoal)
  focus.active = true
  controls.autoRotate = false
}

function jumpTo(group: THREE.Group, item: GalleryItem) {
  const v = viewFor(group, item)
  camera.position.copy(v.pos)
  controls.target.copy(v.look)
  controls.update()
}

function startTour() {
  tour.active = true
  tour.index = 0
  tour.waiting = false
  tour.timer = 0
  tools.setTourActive(true)
  controls.autoRotate = false
  while (tour.index < items.length) {
    const item = items[tour.index]
    tour.index++
    const group = item.type === 'artwork' ? artworkGroups.get(item.id) : null
    if (group) {
      jumpTo(group, item)
      infoCard.show(item, cardSpotFor(group, item))
      tools.setActiveItem(item.id)
      return
    }
  }
  endTour()
}

function tourStep() {
  if (tour.index >= items.length) {
    endTour()
    return
  }
  const item = items[tour.index]
  tour.index++
  const group = item.type === 'artwork' ? artworkGroups.get(item.id) : null
  if (group) {
    startFocus(group, item)
    infoCard.show(item, cardSpotFor(group, item))
    tools.setActiveItem(item.id)
  } else {
    tourStep()
  }
}

function endTour() {
  tour.active = false
  tour.waiting = false
  tools.setTourActive(false)
  infoCard.hide()
  cameraGoal.copy(homePos)
  lookGoal.copy(homeLook)
  focus.pos.copy(homePos)
  focus.look.copy(homeLook)
  focus.active = true
  controls.autoRotate = false
}

function takePhoto() {
  document.body.classList.add('photo-mode')
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  document.body.classList.remove('photo-mode')
  const a = document.createElement('a')
  a.href = url
  a.download = `echosphere-${Date.now()}.png`
  a.click()
}

tools = createTools({  onPhoto: takePhoto,
  onTour: startTour,
  onStopTour: endTour,
})
tools.renderList(items, null, (item) => {
  const group = item.type === 'artwork' ? artworkGroups.get(item.id) : null
  if (group) {
    startFocus(group, item)
    infoCard.show(item, cardSpotFor(group, item))
    tools.setActiveItem(item.id)
  }
})

;(window as unknown as Record<string, unknown>).__es = {
  glowOpacities: () => [...artworkGroups.values()].map((g) => (g.userData.glowMat as THREE.MeshBasicMaterial).opacity),
  artTextureProbe: (id: string) => {
    const group = artworkGroups.get(id)
    if (!group) return null
    let tex: THREE.CanvasTexture | null = null
    group.traverse((o) => {
      if (!tex && (o as THREE.Mesh).isMesh) {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat.map) tex = mat.map as THREE.CanvasTexture
      }
    })
    if (!tex) return null
    const cv = (tex as THREE.CanvasTexture).image as HTMLCanvasElement
    const c = document.createElement('canvas')
    c.width = cv.width; c.height = cv.height
    const cx = c.getContext('2d')!
    cx.drawImage(cv, 0, 0)
    const d = cx.getImageData(0, 0, c.width, c.height).data
    const rgb = (x: number, y: number) => { const i = (y * c.width + x) * 4; return [d[i], d[i + 1], d[i + 2]] }
    return { size: [cv.width, cv.height], top: rgb(256, 100), bottom: rgb(256, 500), center: rgb(256, 335) }
  },
  tourActive: () => tour.active,
  artScreenPos: (id: string) => {
    const group = artworkGroups.get(id)
    if (!group) return null
    const v = new THREE.Vector3()
    group.children.forEach((child) => {
      if (child.userData.frame) child.getWorldPosition(v)
    })
    v.project(camera)
    return { x: ((v.x + 1) / 2) * window.innerWidth, y: ((1 - v.y) / 2) * window.innerHeight }
  },
  groupCount: () => artworkGroups.size,
  probe: () => {
    const out: unknown[] = []
    scene.traverse((o) => {
      if (o.userData.frame || o.userData.artwork || o.userData.glow) {
        const p = o.position
        out.push({ n: o.name || o.type, f: !!o.userData.frame, a: !!o.userData.artwork, g: !!o.userData.glow, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) })
      }
    })
    return out
  },
  pick: (x: number, y: number) => {
    pointer.x = (x / window.innerWidth) * 2 - 1
    pointer.y = -(y / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster
      .intersectObjects([...artworkGroups.values()], true)
      .filter((h) => h.object.userData.artwork)
      .slice(0, 3)
      .map((h) => ({ name: h.object.name, group: h.object.parent?.name ?? 'none', artwork: !!h.object.userData.artwork }))
    const any = raycaster
      .intersectObjects(scene.children, true)
      .slice(0, 3)
      .map((h) => ({ name: h.object.name || h.object.type, art: !!h.object.userData.artwork, z: h.point.z.toFixed(2) }))
    return { hits, any, cam: camera.position.toArray(), target: controls.target.toArray() }
  },
}

renderer.xr.addEventListener('sessionstart', () => {
  controls.enabled = false
  tools.setPhotoDisabled(true)
})
renderer.xr.addEventListener('sessionend', () => {
  controls.enabled = true
  tools.setPhotoDisabled(false)
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tour.active) endTour()
})

const viewPos = new THREE.Vector3()
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta()

  if (!homeCaptured) {
    homePos.copy(camera.position)
    homeLook.copy(controls.target)
    homeCaptured = true
  }

  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) {
    hovered.clear()
    for (const controller of controllers) {
      controller.getWorldPosition(from)
      controller.getWorldDirection(direction)
      raycaster.set(from, direction)
      const hit = raycaster
        .intersectObjects([...artworkGroups.values()], true)
        .find((h) => h.object.userData.artwork)
      if (hit) {
        const group = artworkGroupOf(hit.object)
        if (group) hovered.add(group)
      }
    }
  }

  updateGlows(artworkGroups.values(), hovered)

  if (focus.active) {
    camera.position.lerp(focus.pos, 0.06)
    controls.target.lerp(focus.look, 0.06)
    if (camera.position.distanceTo(focus.pos) < 0.1) {
      focus.active = false
      if (!tour.active && autoRotateSetting) controls.autoRotate = true
    }
  }
  if (tour.active && !focus.active) {
    tour.waiting = true
    tour.timer += delta
    if (tour.timer > 2.4) {
      tour.waiting = false
      tour.timer = 0
      tourStep()
    }
  }

  if (controls.enabled && !focus.active) controls.update()
  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) {
    renderer.xr.getCamera().getWorldPosition(viewPos)
  } else {
    camera.getWorldPosition(viewPos)
  }
  infoCard.lookAt(viewPos)
  renderer.render(scene, camera)
})
