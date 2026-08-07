import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'

globalThis.FileReader = class {
  result = null
  onload = null
  onloadend = null
  onerror = null
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer()
    this.onload?.()
    this.onloadend?.()
  }
  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer())
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
    this.onload?.()
    this.onloadend?.()
  }
}

const root = new THREE.Group()

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.5, 0.18, 200, 32),
  new THREE.MeshStandardMaterial({ color: 0xc08b5f, roughness: 0.35, metalness: 0.7 }),
)
knot.castShadow = true
root.add(knot)

const spire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.32, 1),
  new THREE.MeshStandardMaterial({ color: 0x8fb8c5, roughness: 0.5, metalness: 0.4 }),
)
spire.position.y = 0.95
spire.castShadow = true
root.add(spire)

const exporter = new GLTFExporter()
const buffer = await exporter.parseAsync(root, { binary: true })
await mkdir('public/artwork', { recursive: true })
await writeFile('public/artwork/core.glb', Buffer.from(buffer))
console.log('wrote public/artwork/core.glb (' + buffer.byteLength + ' bytes)')