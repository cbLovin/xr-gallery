import * as THREE from 'three'
import { THEMES, applyTheme, type GalleryTheme, type ThemeTargets } from './themes.ts'

const THEME_KEY = 'echosphere:theme'
const AUTO_KEY = 'echosphere:auto'
const LASER_KEY = 'echosphere:lasers'
const SOUND_KEY = 'echosphere:sound'

const GEAR_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`

export function loadTheme(): GalleryTheme {
  const id = localStorage.getItem(THEME_KEY)
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export interface SettingsUI {
  currentTheme: () => GalleryTheme
  setThemeId: (id: string) => void
}

export function createSettingsUI(opts: {
  scene: THREE.Scene
  targets: ThemeTargets
  initialTheme: GalleryTheme
  onAutoRotate: (on: boolean) => void
  onLasers: (on: boolean) => void
  onSound: (on: boolean) => void
}): SettingsUI {
  let theme = opts.initialTheme

  const gear = document.createElement('button')
  gear.id = 'settings-gear'
  gear.className = 'ui'
  gear.title = 'Settings'
  gear.innerHTML = GEAR_SVG

  const panel = document.createElement('div')
  panel.id = 'settings-panel'
  panel.className = 'hidden ui'

  const title = document.createElement('div')
  title.className = 'panel-title'
  title.textContent = 'Settings'
  panel.appendChild(title)

  const autoLabel = document.createElement('label')
  autoLabel.className = 'toggle'
  const autoInput = document.createElement('input')
  autoInput.type = 'checkbox'
  autoInput.id = 'set-auto'
  autoInput.checked = localStorage.getItem(AUTO_KEY) === '1'
  autoLabel.append(autoInput, document.createTextNode('Auto-rotate view'))
  panel.appendChild(autoLabel)

  const laserLabel = document.createElement('label')
  laserLabel.className = 'toggle'
  const laserInput = document.createElement('input')
  laserInput.type = 'checkbox'
  laserInput.id = 'set-lasers'
  laserInput.checked = localStorage.getItem(LASER_KEY) !== '0'
  laserLabel.append(laserInput, document.createTextNode('Show laser pointers'))
  panel.appendChild(laserLabel)

  const soundLabel = document.createElement('label')
  soundLabel.className = 'toggle'
  const soundInput = document.createElement('input')
  soundInput.type = 'checkbox'
  soundInput.id = 'set-sound'
  soundInput.checked = localStorage.getItem(SOUND_KEY) !== '0'
  soundLabel.append(soundInput, document.createTextNode('Ambient soundscape'))
  panel.appendChild(soundLabel)

  function setTheme(t: GalleryTheme) {
    theme = t
    applyTheme(opts.scene, t, opts.targets)
    localStorage.setItem(THEME_KEY, t.id)
  }

  gear.addEventListener('click', () => panel.classList.toggle('hidden'))
  autoInput.addEventListener('change', () => {
    localStorage.setItem(AUTO_KEY, autoInput.checked ? '1' : '0')
    opts.onAutoRotate(autoInput.checked)
  })
  laserInput.addEventListener('change', () => {
    localStorage.setItem(LASER_KEY, laserInput.checked ? '1' : '0')
    opts.onLasers(laserInput.checked)
  })
  soundInput.addEventListener('change', () => {
    localStorage.setItem(SOUND_KEY, soundInput.checked ? '1' : '0')
    opts.onSound(soundInput.checked)
  })

  document.body.append(gear, panel)
  setTheme(theme)
  opts.onAutoRotate(autoInput.checked)
  opts.onLasers(laserInput.checked)
  opts.onSound(soundInput.checked)

  return {
    currentTheme: () => theme,
    setThemeId: (id: string) => {
      const next = THEMES.find((t) => t.id === id)
      if (next) setTheme(next)
    },
  }
}