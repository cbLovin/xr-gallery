import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

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
camera.position.set(0, 1.8, 6)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1.6, 0)

scene.add(new THREE.HemisphereLight(0xffffff, 0x303036, 0.9))
const sun = new THREE.DirectionalLight(0xffffff, 1.2)
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
function wall(w: number, h: number, x: number, y: number, z: number, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat)
  m.position.set(x, y, z)
  m.rotation.y = ry
  m.receiveShadow = true
  scene.add(m)
}
wall(W, H, 0, H / 2, -D / 2)
wall(H, H, -W / 2, H / 2, 0, Math.PI / 2)
wall(H, H, W / 2, H / 2, 0, -Math.PI / 2)

function makeArtwork(title: string, from: number, to: number): THREE.Group {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, `hsl(${from} 70% 45%)`)
  grad.addColorStop(1, `hsl(${to} 70% 55%)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = 'bold 44px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 + 15)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const group = new THREE.Group()
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 1.6, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.6 }),
  )
  frame.position.z = -0.02
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.5),
    new THREE.MeshStandardMaterial({ map: texture, emissive: 0x111122, emissiveMap: texture }),
  )
  frame.castShadow = true
  group.add(frame, art)
  return group
}

const pieces: Array<[string, number, number]> = [
  ['ECHOSPHERE', 210, 270],
  ['DEEP FIELD', 160, 200],
  ['TIDE', 190, 230],
  ['PRISM', 280, 320],
  ['VOID', 260, 310],
  ['AURORA', 180, 220],
]

for (let i = 0; i < pieces.length; i++) {
  const art = makeArtwork(pieces[i][0], pieces[i][1], pieces[i][2])
  const x = -6 + i * 2.4
  art.position.set(x, 1.85, -D / 2 + 0.05)
  art.lookAt(0, 1.85, 0)
  scene.add(art)
}

const title = document.createElement('div')
title.id = 'title'
title.textContent = 'ECHOSPHERE'
document.body.appendChild(title)

document.body.appendChild(VRButton.createButton(renderer))

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})