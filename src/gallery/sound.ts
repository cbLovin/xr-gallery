const CHIMES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]

export interface Soundscape {
  start: () => void
  setMuted: (muted: boolean) => void
  setPhase: (phase: string) => void
  started: () => boolean
}

const JOURNEY_PHASES = {
  silence: { droneLevel: 0, chimeProb: 0, windLevel: 0 },
  ambient_whisper: { droneLevel: 0.02, chimeProb: 0.0005, windLevel: 0.005 },
  ambient_breath: { droneLevel: 0.04, chimeProb: 0.001, windLevel: 0.008 },
  ambient_melody: { droneLevel: 0.06, chimeProb: 0.002, windLevel: 0.01 },
  ambient_climax: { droneLevel: 0.08, chimeProb: 0.003, windLevel: 0.012 },
  ambient_resonance: { droneLevel: 0.05, chimeProb: 0.0015, windLevel: 0.008 },
}

function makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate
  const buffer = ctx.createBuffer(2, rate * seconds, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, decay)
    }
  }
  return buffer
}

export function createSoundscape(initialMuted: boolean): Soundscape {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let muted = initialMuted
  let running = false
  let nextChime = 0
  let phaseParams = JOURNEY_PHASES.silence

  let reverbSend: GainNode | null = null
  let droneA: OscillatorNode | null = null
  let droneB: OscillatorNode | null = null
  let droneGain: GainNode | null = null
  let windGain: GainNode | null = null
  let windFilter: BiquadFilterNode | null = null

  function bell() {
    if (!ctx || !running || muted) return
    const now = ctx.currentTime
    const freq = CHIMES[Math.floor(Math.random() * CHIMES.length)]
    const pan = new StereoPannerNode(ctx)
    pan.pan.value = Math.random() * 1.4 - 0.7

    const carrier = ctx.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.value = freq
    const modulator = ctx.createOscillator()
    modulator.type = 'sine'
    modulator.frequency.value = freq * 3.01
    const modGain = ctx.createGain()
    modGain.gain.value = freq * 0.9
    modulator.connect(modGain)
    modGain.connect(carrier.frequency)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(0.04, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, now + 4)

    carrier.connect(env)
    env.connect(pan)
    pan.connect(reverbSend!)
    carrier.start(now)
    carrier.stop(now + 4.5)
    modulator.start(now)
    modulator.stop(now + 4.5)
  }

  function scheduleLoop() {
    if (!running) return
    const gap = 8 + Math.random() * 12
    nextChime += gap
    setTimeout(() => {
      if (Math.random() < phaseParams.chimeProb) {
        bell()
      }
      scheduleLoop()
    }, (nextChime - ctx!.currentTime) * 1000)
  }

  function start() {
    if (ctx) return
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.setValueAtTime(muted ? 0 : 0.5, ctx.currentTime)
    master.connect(ctx.destination)

    droneA = ctx.createOscillator()
    droneA.type = 'sine'
    droneA.frequency.value = 55
    droneA.detune.value = -6
    droneB = ctx.createOscillator()
    droneB.type = 'sine'
    droneB.frequency.value = 82.41
    droneB.detune.value = 6
    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 200
    droneGain = ctx.createGain()
    droneGain.gain.value = 0
    const droneLfo = ctx.createOscillator()
    droneLfo.frequency.value = 0.04
    const droneLfoGain = ctx.createGain()
    droneLfoGain.gain.value = 0.02
    droneLfo.connect(droneLfoGain)
    droneLfoGain.connect(droneGain.gain)
    droneA.connect(droneFilter)
    droneB.connect(droneFilter)
    droneFilter.connect(droneGain)
    droneGain.connect(master)
    droneA.start()
    droneB.start()
    droneLfo.start()

    const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
    const ndata = noise.getChannelData(0)
    for (let i = 0; i < ndata.length; i++) ndata[i] = Math.random() * 2 - 1
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noise
    noiseSrc.loop = true
    windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 400
    windFilter.Q.value = 0.3
    windGain = ctx.createGain()
    windGain.gain.value = 0
    const windLfo = ctx.createOscillator()
    windLfo.frequency.value = 0.02
    const windLfoGain = ctx.createGain()
    windLfoGain.gain.value = 100
    windLfo.connect(windLfoGain)
    windLfoGain.connect(windFilter.frequency)
    noiseSrc.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(master)
    noiseSrc.start()
    windLfo.start()

    reverbSend = ctx.createGain()
    reverbSend.gain.value = 0.3
    const convolver = ctx.createConvolver()
    convolver.buffer = makeImpulse(ctx, 3, 2.5)
    const reverbGain = ctx.createGain()
    reverbGain.gain.value = 0.4
    convolver.connect(reverbGain)
    reverbGain.connect(master)
    reverbSend.connect(convolver)

    running = true
    nextChime = ctx.currentTime + 2
    scheduleLoop()
  }

  function setPhase(phase: string) {
    phaseParams = JOURNEY_PHASES[phase as keyof typeof JOURNEY_PHASES] || JOURNEY_PHASES.silence

    if (!ctx || !droneGain || !windGain || !master) return

    const now = ctx.currentTime
    droneGain.gain.cancelScheduledValues(now)
    droneGain.gain.linearRampToValueAtTime(phaseParams.droneLevel, now + 3)

    windGain.gain.cancelScheduledValues(now)
    windGain.gain.linearRampToValueAtTime(phaseParams.windLevel, now + 3)

    if (windFilter) {
      windFilter.frequency.cancelScheduledValues(now)
      windFilter.frequency.linearRampToValueAtTime(
        phase === 'silence' ? 200 : phase === 'ambient_climax' ? 800 : 500,
        now + 5
      )
    }
  }

  function setMuted(next: boolean) {
    muted = next
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(next ? 0 : 0.5, ctx.currentTime, 0.5)
    }
  }

  return { start, setMuted, setPhase, started: () => !!ctx }
}