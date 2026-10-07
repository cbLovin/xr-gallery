export interface Mood {
  id: string
  label: string
  themeId: string
  line: string
  hue: [number, number]
}

export const MOODS: Mood[] = [
  { id: 'calm', label: 'Calm', themeId: 'midnight', line: 'Still and safe, like a night that listens.', hue: [220, 260] },
  { id: 'hopeful', label: 'Hopeful', themeId: 'aurora', line: 'Blue mornings promise more than they keep — and that is hope.', hue: [205, 230] },
  { id: 'reflective', label: 'Reflective', themeId: 'mocha', line: 'Warm tones hold thoughts the way a cup holds hands.', hue: [25, 45] },
  { id: 'joyful', label: 'Joyful', themeId: 'sunset', line: 'Pink light spills like laughter — welcome it.', hue: [340, 10] },
  { id: 'inspired', label: 'Inspired', themeId: 'berry', line: 'Bold color for ideas just waking up.', hue: [320, 350] },
  { id: 'connected', label: 'Connected', themeId: 'forest', line: 'Green grows where care is shared.', hue: [130, 165] },
]

export interface MoodModal {
  open: () => void
  close: () => void
  isOpen: () => boolean
}

export function createMoodModal(opts: {
  onApply: (mood: Mood) => void
}): MoodModal {
  const overlay = document.createElement('div')
  overlay.id = 'mood-overlay'
  overlay.className = 'ui hidden'

  const card = document.createElement('div')
  card.id = 'mood-card'

  const title = document.createElement('div')
  title.className = 'mood-title'
  title.textContent = 'How do you feel?'

  const sub = document.createElement('div')
  sub.className = 'mood-sub'
  sub.textContent = 'EchoBloom meets you where you are — choose a feeling, and the gallery will listen.'

  const grid = document.createElement('div')
  grid.className = 'mood-grid'

  for (const mood of MOODS) {
    const btn = document.createElement('button')
    btn.className = 'mood-btn'
    const dot = document.createElement('span')
    dot.className = 'mood-dot'
    dot.style.background = `linear-gradient(135deg, hsl(${mood.hue[0]} 90% 62%), hsl(${mood.hue[1]} 90% 55%))`
    const label = document.createElement('span')
    label.textContent = mood.label
    btn.append(dot, label)
    btn.addEventListener('click', () => opts.onApply(mood))
    grid.appendChild(btn)
  }

  card.append(title, sub, grid)
  overlay.appendChild(card)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hide()
  })

  function hide() {
    overlay.classList.add('fading')
    setTimeout(() => {
      overlay.classList.remove('fading')
      overlay.classList.add('hidden')
    }, 420)
  }

  document.body.appendChild(overlay)

  return {
    open() {
      overlay.classList.remove('hidden')
      requestAnimationFrame(() => overlay.classList.add('showing'))
    },
    close: hide,
    isOpen: () => !overlay.classList.contains('hidden'),
  }
}