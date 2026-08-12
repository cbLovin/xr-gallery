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
    background: '#101014',
    fog: '#101014',
    wall: '#1b1b22',
    floor: '#27272e',
    frame: '#0c0c10',
    sky: '#ffffff',
    ground: '#4a4a55',
    ambient: 0.35,
    light: '#ffffff',
    accent: '#8fa8ff',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    background: '#0a1018',
    fog: '#0a1018',
    wall: '#12202b',
    floor: '#1c2b33',
    frame: '#08131c',
    sky: '#bfe8ff',
    ground: '#1e4a4f',
    ambient: 0.4,
    light: '#cfe8ff',
    accent: '#5fd7c8',
  },
  {
    id: 'ember',
    label: 'Ember',
    background: '#140a08',
    fog: '#140a08',
    wall: '#2a1712',
    floor: '#35201a',
    frame: '#120906',
    sky: '#ffd9b3',
    ground: '#4a2418',
    ambient: 0.35,
    light: '#ffc9a1',
    accent: '#ff9e64',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    background: '#0b0f16',
    fog: '#0b0f16',
    wall: '#1e2937',
    floor: '#2b3a4c',
    frame: '#111a26',
    sky: '#eaf4ff',
    ground: '#4a5a6e',
    ambient: 0.5,
    light: '#e8f2ff',
    accent: '#9fd0ff',
  },
  {
    id: 'neon',
    label: 'Neon',
    background: '#0c0616',
    fog: '#0c0616',
    wall: '#1c1030',
    floor: '#241a3a',
    frame: '#0e071e',
    sky: '#ff6bff',
    ground: '#3a1e5a',
    ambient: 0.45,
    light: '#d9a7ff',
    accent: '#ff6bff',
  },
  {
    id: 'noir',
    label: 'Noir',
    background: '#060606',
    fog: '#060606',
    wall: '#121212',
    floor: '#1c1c1c',
    frame: '#080808',
    sky: '#9a9a9a',
    ground: '#2a2a2a',
    ambient: 0.3,
    light: '#c9c9c9',
    accent: '#ff4d4d',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#07110b',
    fog: '#07110b',
    wall: '#12241a',
    floor: '#1d3326',
    frame: '#0a170f',
    sky: '#c9ffd9',
    ground: '#23402f',
    ambient: 0.4,
    light: '#d8ffd8',
    accent: '#6fe89a',
  },
  {
    id: 'gallery',
    label: 'Gallery White',
    background: '#e8e6e1',
    fog: '#e8e6e1',
    wall: '#f3f1ec',
    floor: '#d8d5ce',
    frame: '#22222a',
    sky: '#ffffff',
    ground: '#b8b4ac',
    ambient: 0.55,
    light: '#ffffff',
    accent: '#33334a',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    background: '#170d14',
    fog: '#170d14',
    wall: '#2b1822',
    floor: '#37222c',
    frame: '#140a10',
    sky: '#ffb4a8',
    ground: '#5a2740',
    ambient: 0.4,
    light: '#ffc3ad',
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