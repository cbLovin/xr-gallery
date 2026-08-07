import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import sceneConfig from './data/artworks.json'
import { createArtwork, mountSculpture, type GalleryItem } from './gallery/artwork.ts'

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
camera.position.set(0, 1.8, 7)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1.75, 0)

scene.add(new THREE.HemisphereLight(0xffffff, 0x3f3f4a, 1.15))
const sun = new THREE.DirectionalLight(0xffffff, 1.6)
sun.position.set(5, 8, 4)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.far = 50
scene.add(sun)

const W = 18
const H = 5
const D = 12

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshStandardMaterial({ color: 0x27272e, roughness: 0.9 }),
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
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
async function mountItems() {
  for (const item of items) {
    if (item.type === 'artwork') {
      const group = await createArtwork(item)
      group.position.set(item.x, 1.85, -D / 2 + 0.05)
      group.lookAt(0, 1.85, 0)
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), hangerMat)
      hanger.position.set(item.x, 2.75, -D / 2 + 0.02)
      scene.add(group, hanger)
    } else {
      await mountSculpture(scene, item)
    }
  }
}
void mountItems()

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', (e) => {
  if ((renderer.xr as unknown as { isPresenting: boolean }).isPresenting) return
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(scene.children, true)
  const hit = hits.find((h) => h.object.userData.artwork)
  if (hit) {
    const cfg = hit.object.userData.config as GalleryItem
    showInfo(cfg)
  } else {
    hideInfo()
  }
})

function showInfo(cfg: GalleryItem) {
  const card = document.getElementById('info')!
  card.querySelector<HTMLElement>('.info-title')!.textContent = cfg.title
  card.querySelector<HTMLElement>('.info-artist')!.textContent = cfg.artist
  card.querySelector<HTMLElement>('.info-desc')!.textContent = cfg.description
  card.style.display = 'block'
}
function hideInfo() {
  document.getElementById('info')!.style.display = 'none'
}

const title = document.createElement('div')
title.id = 'title'
title.textContent = 'ECHOSPHERE'
document.body.appendChild(title)

const info = document.createElement('div')
info.id = 'info'
info.innerHTML = `
  <div class="info-title"></div>
  <div class="info-artist"></div>
  <div class="info-desc"></div>
  <button id="info-close">Close</button>
`
document.body.appendChild(info)
info.querySelector<HTMLButtonElement>('#info-close')!.addEventListener('click', hideInfo)

const hint = document.createElement('div')
hint.id = 'hint'
hint.textContent = 'Click an artwork to view details'
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

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})