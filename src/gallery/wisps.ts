import * as THREE from 'three'

const COUNT = 240

export interface Wisps {
  points: THREE.Points
  material: THREE.PointsMaterial
  update: (time: number) => void
}

export function createWisps(): Wisps {
  const positions = new Float32Array(COUNT * 3)
  const bases = new Float32Array(COUNT * 3)
  const phases = new Float32Array(COUNT)
  const speeds = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() * 2 - 1) * 6.5
    const y = 0.35 + Math.random() * 3.9
    const z = (Math.random() * 2 - 1) * 3.5
    bases[i * 3] = x
    bases[i * 3 + 1] = y
    bases[i * 3 + 2] = z
    phases[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.15 + Math.random() * 0.4
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0xa5b4ff,
    size: 0.07,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  let time = Math.random() * 100

  return {
    points,
    material,
    update(passed: number) {
      time += passed
      for (let i = 0; i < COUNT; i++) {
        const s = time * speeds[i] + phases[i]
        positions[i * 3] = bases[i * 3] + Math.sin(s * 0.5) * 0.5
        positions[i * 3 + 1] = bases[i * 3 + 1] + Math.sin(s) * 0.45
        positions[i * 3 + 2] = bases[i * 3 + 2] + Math.cos(s * 0.7) * 0.5
      }
      geometry.attributes.position.needsUpdate = true
    },
  }
}