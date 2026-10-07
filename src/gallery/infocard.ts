import * as THREE from 'three'
import type { GalleryItem } from './artwork.ts'

const W = 2048
const H = 1024

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawCard(config: GalleryItem, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = 'rgba(16, 16, 22, 0.94)'
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 48)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 92px system-ui, sans-serif'
  ctx.fillText(config.title.toUpperCase(), 96, 180)

  ctx.fillStyle = '#9a97a5'
  ctx.font = '500 52px system-ui, sans-serif'
  ctx.fillText(config.artist, 96, 270)

  ctx.fillStyle = '#d8d6de'
  ctx.font = '400 42px system-ui, sans-serif'
  const lines = wrapText(ctx, config.description, W - 192).slice(0, 3)
  lines.forEach((line, i) => ctx.fillText(line, 96, 372 + i * 64))

  if (config.reflection) {
    ctx.globalAlpha = 0.25
    ctx.fillStyle = accent
    ctx.fillRect(96, 620, 90, 4)
    ctx.globalAlpha = 1
    ctx.fillStyle = accent
    ctx.font = 'italic 400 40px Georgia, serif'
    const reflections = wrapText(ctx, `"${config.reflection}"`, W - 192).slice(0, 2)
    reflections.forEach((line, i) => ctx.fillText(line, 96, 684 + i * 54))
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.anisotropy = 8
  return texture
}

export function createInfoCard(): {
  show: (config: GalleryItem, position: THREE.Vector3) => void
  hide: () => void
  lookAt: (target: THREE.Vector3) => void
  setAccent: (accent: string) => void
  mesh: THREE.Mesh
} {
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.45), material)

  let current: THREE.CanvasTexture | null = null
  let target = new THREE.Vector3()
  let visible = false
  let accent = '#a5b4ff'

  function fade(delta: number) {
    const next = Math.min(1, Math.max(0, material.opacity + delta))
    material.opacity = next
  }

  return {
    mesh,
    show(config, position) {
      if (current) current.dispose()
      current = drawCard(config, accent)
      material.map = current
      material.needsUpdate = true
      target.copy(position)
      visible = true
    },
    setAccent(next: string) {
      accent = next
    },
    hide() {
      visible = false
    },
    lookAt(lookTarget) {
      if (visible && material.opacity > 0) {
        mesh.position.lerp(target, 0.12)
        mesh.lookAt(lookTarget)
      }
      fade(visible ? 0.25 : -0.25)
    },
  }
}