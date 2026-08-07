import * as THREE from 'three'

export interface ArtworkConfig {
  id: string
  title: string
  artist: string
  description: string
  type: 'artwork'
  colors: [number, number]
  x: number
}

export interface SceneConfig {
  artworks: ArtworkConfig[]
}

export function makeCanvasTexture(title: string, from: number, to: number): THREE.CanvasTexture {
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
  ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 + 15)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createArtwork(config: ArtworkConfig): THREE.Group {
  const texture = makeCanvasTexture(config.title, config.colors[0], config.colors[1])

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