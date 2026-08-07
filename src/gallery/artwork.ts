import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface ArtworkConfig {
  id: string
  title: string
  artist: string
  description: string
  type: 'artwork'
  colors: [number, number]
  x: number
  image?: string
}

export interface SculptureConfig {
  id: string
  title: string
  artist: string
  description: string
  type: 'sculpture'
  model: string
  scale?: number
  x: number
}

export type GalleryItem = ArtworkConfig | SculptureConfig

export interface SceneConfig {
  items: GalleryItem[]
}

const textureLoader = new THREE.TextureLoader()

export function makeCanvasTexture(title: string, from: number, to: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, `hsl(${from} 90% 58%)`)
  grad.addColorStop(1, `hsl(${to} 90% 68%)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = 'bold 44px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 + 15)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

async function loadTexture(url: string, fallback: THREE.CanvasTexture): Promise<THREE.Texture> {
  try {
    const tex = await textureLoader.loadAsync(url)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  } catch {
    return fallback
  }
}

export async function createArtwork(config: ArtworkConfig): Promise<THREE.Group> {
  const fallback = makeCanvasTexture(config.title, config.colors[0], config.colors[1])
  const texture = config.image ? await loadTexture(config.image, fallback) : fallback

  const group = new THREE.Group()
  group.name = config.id
  group.userData = { artwork: true, config }

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 1.6, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.6 }),
  )
  frame.position.z = -0.02
  frame.castShadow = true
  frame.userData = { artwork: true, config }

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.5),
    new THREE.MeshStandardMaterial({ map: texture, emissive: 0x111122, emissiveMap: texture }),
  )
  art.userData = { artwork: true, config }

  group.add(frame, art)
  return group
}

export async function mountSculpture(
  scene: THREE.Scene,
  config: SculptureConfig,
): Promise<void> {
  const group = new THREE.Group()
  group.userData = { artwork: true, config }

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.82, 0.72, 24),
    new THREE.MeshStandardMaterial({ color: 0x3a3a46, roughness: 0.5, metalness: 0.4 }),
  )
  plinth.position.y = 0.36
  plinth.castShadow = true
  plinth.receiveShadow = true
  plinth.userData = { artwork: true, config }
  group.add(plinth)

  try {
    const gltf = await new GLTFLoader().loadAsync(config.model)
    const model = gltf.scene
    model.scale.setScalar(config.scale ?? 1)
    model.position.y = 1.15
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.userData = { artwork: true, config }
      }
    })
    group.add(model)
  } catch (error) {
    console.error(`Failed to load model ${config.model}`, error)
  }

  group.position.set(config.x, 0, 0)
  scene.add(group)
}