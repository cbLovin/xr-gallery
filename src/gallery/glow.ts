import * as THREE from 'three'

export function addGlow(group: THREE.Group): void {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 1.78), mat)
  mesh.position.z = -0.04
  mesh.userData = { glow: true }
  group.add(mesh)
  group.userData.glowMat = mat
  group.userData.glow = 0
}

export function updateGlows(
  groups: Iterable<THREE.Group>,
  hovered: ReadonlySet<THREE.Group>,
): void {
  for (const g of groups) {
    const mat = g.userData.glowMat as THREE.MeshBasicMaterial
    const target = hovered.has(g) ? 1 : 0
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, target * 0.55, 0.25)
  }
}
