export interface Mood {
  id: string
  label: string
  /** Robot M mood vocabulary — must stay in sync with the hardware. */
  robotM: 'warm' | 'sad' | 'calm' | 'dynamic'
  themeId: string
  /** Accent the gallery adopts when this mood is active. */
  accent: string
  line: string
}

export const MOODS: Mood[] = [
  {
    id: 'warm',
    label: 'Warm',
    robotM: 'warm',
    themeId: 'midnight',
    accent: '#f5b942',
    line: 'Gold settles in, the way a hand does on a shoulder.',
  },
  {
    id: 'sad',
    label: 'Sad',
    robotM: 'sad',
    themeId: 'arctic',
    accent: '#5aa9e6',
    line: 'Blue is allowed to be here. It never asks you to explain.',
  },
  {
    id: 'calm',
    label: 'Calm',
    robotM: 'calm',
    themeId: 'berry',
    accent: '#9b7bd4',
    line: 'Purple keeps the room quiet enough to hear yourself think.',
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    robotM: 'dynamic',
    themeId: 'ember',
    accent: '#ff5a3c',
    line: 'Red wakes things up — for once, on purpose.',
  },
]

export function moodById(id: string | null): Mood | undefined {
  return MOODS.find((m) => m.id === id)
}

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
  title.textContent = 'How are you feeling?'

  const sub = document.createElement('div')
  sub.className = 'mood-sub'
  sub.textContent =
    'EchoBloom senses the mood — pick the one that fits, and the gallery will meet you there.'

  const grid = document.createElement('div')
  grid.className = 'mood-grid'

  for (const mood of MOODS) {
    const btn = document.createElement('button')
    btn.className = 'mood-btn'
    btn.dataset.mood = mood.id
    const dot = document.createElement('span')
    dot.className = 'mood-dot'
    dot.style.background = `radial-gradient(circle at 34% 30%, #ffffffcc 0%, ${mood.accent} 46%, ${mood.accent}22 100%)`
    dot.style.boxShadow = `0 0 22px ${mood.accent}66`
    const label = document.createElement('span')
    label.textContent = mood.label
    btn.append(dot, label)
    btn.addEventListener('click', () => opts.onApply(mood))
    grid.appendChild(btn)
  }

  const note = document.createElement('div')
  note.className = 'mood-note'
  note.textContent = 'M senses the mood. It never detects emotions.'

  card.append(title, sub, grid, note)
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
