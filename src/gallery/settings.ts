import * as THREE from 'three'
import { THEMES, applyTheme, type GalleryTheme, type ThemeTargets } from './themes.ts'

const THEME_KEY = 'echosphere:theme'
const AUTO_KEY = 'echosphere:auto'
const LASER_KEY = 'echosphere:lasers'

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
}

export function createSettingsUI(opts: {
  scene: THREE.Scene
  targets: ThemeTargets
  initialTheme: GalleryTheme
  onAutoRotate: (on: boolean) => void
  onLasers: (on: boolean) => void
}): SettingsUI {
  let theme = opts.initialTheme

  const gear = document.createElement('button')
  gear.id = 'settings-gear'
  gear.title = 'Settings'
  gear.innerHTML = GEAR_SVG

  const panel = document.createElement('div')
  panel.id = 'settings-panel'
  panel.className = 'hidden'

  const title = document.createElement('div')
  title.className = 'panel-title'
  title.textContent = 'Settings'
  panel.appendChild(title)

  const vibeLabel = document.createElement('div')
  vibeLabel.className = 'section-label'
  vibeLabel.textContent = 'Vibe'
  panel.appendChild(vibeLabel)

  const grid = document.createElement('div')
  grid.className = 'theme-grid'
  panel.appendChild(grid)

  const themeButtons = new Map<string, HTMLButtonElement>()
  for (const t of THEMES) {
    const btn = document.createElement('button')
    btn.className = 'theme-btn'
    btn.dataset.theme = t.id
    const swatch = document.createElement('span')
    swatch.className = 'swatch'
    swatch.style.background = t.background
    const label = document.createElement('span')
    label.textContent = t.label
    btn.append(swatch, label)
    btn.addEventListener('click', () => setTheme(t))
    themeButtons.set(t.id, btn)
    grid.appendChild(btn)
  }

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

  function setTheme(t: GalleryTheme) {
    theme = t
    applyTheme(opts.scene, t, opts.targets)
    localStorage.setItem(THEME_KEY, t.id)
    for (const [id, btn] of themeButtons) btn.classList.toggle('active', id === t.id)
  }

  function markActive() {
    for (const [id, btn] of themeButtons) btn.classList.toggle('active', id === theme.id)
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

  document.body.append(gear, panel)
  setTheme(theme)
  opts.onAutoRotate(autoInput.checked)
  opts.onLasers(laserInput.checked)
  markActive()

  return { currentTheme: () => theme }
}