import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import sceneConfig from './data/artworks.json'
import {
  createArtwork,
  mountSculpture,
  GALLERY,
  type GalleryItem,
} from './gallery/artwork.ts'
import { createInfoCard } from './gallery/infocard.ts'
import { loadTheme, createSettingsUI } from './gallery/settings.ts'
import type { ThemeTargets } from './gallery/themes.ts'

const items = sceneConfig as unknown as GalleryItem[]

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.xr.enabled = true
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x101014)

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
controls.maxPolarAngle = Math.PI / 2 - 0.05
controls.minDistance = 0.8
controls.maxDistance = 30

renderer.xr.addEventListener('sessionstart', () => {
  controls.enabled = false
})
renderer.xr.addEventListener('sessionend', () => {
  controls.enabled = true
})

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
for (const item of items) {
  if (item.type === 'artwork') {
    void createArtwork(item).then((group) => {
      scene.add(group)
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

function normalOf(hit: THREE.Intersection): THREE.Vector3 {
  const n = hit.face!.normal.clone()
  n.transformDirection(hit.object.matrixWorld)
  return n
}

function placeCard(cfg: GalleryItem, hit: THREE.Intersection) {
  const spot = hit.point.clone().addScaledVector(normalOf(hit), 0.5)
  spot.y += 1.0
  infoCard.show(cfg, spot)
}

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
createSettingsUI({
  scene,
  targets: themeTargets,
  initialTheme,
  onAutoRotate: (on) => {
    controls.autoRotate = on
    controls.autoRotateSpeed = 0.5
  },
  onLasers: (on) => {
    for (const line of laserLines) line.visible = on
  },
})

const title = document.createElement('div')
title.id = 'title'
title.textContent = 'ECHOSPHERE'
document.body.appendChild(title)

const hint = document.createElement('div')
hint.id = 'hint'
hint.textContent = 'Drag to look · scroll to zoom · click a piece · VR: aim + trigger'
document.body.appendChild(hint)

function createVRButton(): HTMLButtonElement | null {
  if (!('xr' in navigator)) return null
  const button = document.createElement('button')
  button.className = 'vr'
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const viewPos = new THREE.Vector3()
renderer.setAnimationLoop(() => {
  if (controls.enabled) controls.update()
  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) {
    renderer.xr.getCamera().getWorldPosition(viewPos)
  } else {
    camera.getWorldPosition(viewPos)
  }
  infoCard.lookAt(viewPos)
  renderer.render(scene, camera)
})