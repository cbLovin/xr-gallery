import * as THREE from 'three'

export interface GalleryTheme {
  id: string
  label: string
  background: string
  fog: string
  wall: string
  floor: string
  frame: string
  sky: string
  ground: string
  ambient: number
  light: string
  accent: string
}

export const THEMES: GalleryTheme[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    background: '#10101a',
    fog: '#10101a',
    wall: '#1c1c28',
    floor: '#282834',
    frame: '#0c0c14',
    sky: '#eef0ff',
    ground: '#4a4a5c',
    ambient: 0.35,
    light: '#ffffff',
    accent: '#a5b4ff',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    background: '#06102a',
    fog: '#06102a',
    wall: '#0e1f45',
    floor: '#16294f',
    frame: '#07102b',
    sky: '#9fd0ff',
    ground: '#1b3a6e',
    ambient: 0.45,
    light: '#bcd8ff',
    accent: '#4f9dff',
  },
  {
    id: 'ember',
    label: 'Ember',
    background: '#1a0a06',
    fog: '#1a0a06',
    wall: '#33130c',
    floor: '#45190f',
    frame: '#1c0a05',
    sky: '#ffd9a8',
    ground: '#6e2a14',
    ambient: 0.4,
    light: '#ffb27a',
    accent: '#ff5a3c',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    background: '#0a1626',
    fog: '#0a1626',
    wall: '#14283f',
    floor: '#1e3a58',
    frame: '#0a1626',
    sky: '#eaf4ff',
    ground: '#4a688a',
    ambient: 0.5,
    light: '#eef6ff',
    accent: '#7cc4ff',
  },
  {
    id: 'berry',
    label: 'Berry',
    background: '#1c0810',
    fog: '#1c0810',
    wall: '#331322',
    floor: '#421a2c',
    frame: '#1a060d',
    sky: '#ffc9dd',
    ground: '#5c2440',
    ambient: 0.4,
    light: '#ffc9dd',
    accent: '#ff4d8d',
  },
  {
    id: 'mocha',
    label: 'Mocha',
    background: '#1c130d',
    fog: '#1c130d',
    wall: '#2e2118',
    floor: '#3b2c20',
    frame: '#160e08',
    sky: '#ffe0b0',
    ground: '#5a422c',
    ambient: 0.4,
    light: '#ffd9a0',
    accent: '#d9a066',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#07110b',
    fog: '#07110b',
    wall: '#0f2617',
    floor: '#1a3a25',
    frame: '#08160d',
    sky: '#c9ffd9',
    ground: '#2a5236',
    ambient: 0.45,
    light: '#d8ffd8',
    accent: '#52d67c',
  },
  {
    id: 'ivory',
    label: 'Ivory',
    background: '#e8e6e1',
    fog: '#e8e6e1',
    wall: '#f3f1ec',
    floor: '#d8d5ce',
    frame: '#22222a',
    sky: '#ffffff',
    ground: '#b8b4ac',
    ambient: 0.55,
    light: '#ffffff',
    accent: '#8a6d3b',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    background: '#221017',
    fog: '#221017',
    wall: '#3d1a28',
    floor: '#50232f',
    frame: '#1f0c13',
    sky: '#ffc9b3',
    ground: '#7a2f4a',
    ambient: 0.4,
    light: '#ffc9ad',
    accent: '#ff7d9c',
  },
]

export interface ThemeTargets {
  wallMat: THREE.MeshStandardMaterial
  floorMat: THREE.MeshStandardMaterial
  hangerMat: THREE.MeshStandardMaterial
  hemi: THREE.HemisphereLight
  ambient: THREE.AmbientLight
  key: THREE.DirectionalLight
  fill: THREE.DirectionalLight
  lasers: THREE.LineBasicMaterial[]
}

export function applyTheme(scene: THREE.Scene, t: GalleryTheme, targets: ThemeTargets): void {
  scene.background = new THREE.Color(t.background)
  scene.fog = new THREE.Fog(t.fog, 14, 42)
  targets.wallMat.color.set(t.wall)
  targets.floorMat.color.set(t.floor)
  targets.hangerMat.color.set(t.frame)
  targets.hemi.color.set(t.sky)
  targets.hemi.groundColor.set(t.ground)
  targets.ambient.intensity = t.ambient
  targets.key.color.set(t.light)
  targets.fill.color.set(t.light)
  for (const laser of targets.lasers) laser.color.set(t.accent)
  scene.traverse((o) => {
    if (o.userData.frame) {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.color.set(t.frame)
    }
  })
}