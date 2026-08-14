const CHIMES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]

export interface Soundscape {
  start: () => void
  setMuted: (muted: boolean) => void
  started: () => boolean
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
  let nextChime = 0
  let running = false

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
    env.gain.linearRampToValueAtTime(0.05, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, now + 3.6)

    carrier.connect(env)
    env.connect(pan)
    pan.connect(reverbSend!)
    carrier.start(now)
    carrier.stop(now + 4)
    modulator.start(now)
    modulator.stop(now + 4)
  }

  function scheduleLoop() {
    if (!running) return
    nextChime += 4 + Math.random() * 6
    setTimeout(() => {
      bell()
      scheduleLoop()
    }, (nextChime - ctx!.currentTime) * 1000)
  }

  let reverbSend: GainNode | null = null

  function start() {
    if (ctx) return
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.setValueAtTime(muted ? 0 : 0.5, ctx.currentTime)
    master.connect(ctx.destination)

    const droneA = ctx.createOscillator()
    droneA.type = 'sine'
    droneA.frequency.value = 110
    droneA.detune.value = -4
    const droneB = ctx.createOscillator()
    droneB.type = 'sine'
    droneB.frequency.value = 164.81
    droneB.detune.value = 4
    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 420
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.09
    const droneLfo = ctx.createOscillator()
    droneLfo.frequency.value = 0.06
    const droneLfoGain = ctx.createGain()
    droneLfoGain.gain.value = 0.03
    droneLfo.connect(droneLfoGain)
    droneLfoGain.connect(droneGain.gain)
    droneA.connect(droneFilter)
    droneB.connect(droneFilter)
    droneFilter.connect(droneGain)
    droneGain.connect(master)
    droneA.start()
    droneB.start()
    droneLfo.start()

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const ndata = noise.getChannelData(0)
    for (let i = 0; i < ndata.length; i++) ndata[i] = Math.random() * 2 - 1
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noise
    noiseSrc.loop = true
    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 750
    windFilter.Q.value = 0.4
    const windGain = ctx.createGain()
    windGain.gain.value = 0.015
    const windLfo = ctx.createOscillator()
    windLfo.frequency.value = 0.03
    const windLfoGain = ctx.createGain()
    windLfoGain.gain.value = 160
    windLfo.connect(windLfoGain)
    windLfoGain.connect(windFilter.frequency)
    noiseSrc.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(master)
    noiseSrc.start()
    windLfo.start()

    reverbSend = ctx.createGain()
    reverbSend.gain.value = 1
    const convolver = ctx.createConvolver()
    convolver.buffer = makeImpulse(ctx, 2.2, 3.2)
    const reverbGain = ctx.createGain()
    reverbGain.gain.value = 0.55
    convolver.connect(reverbGain)
    reverbGain.connect(master)
    reverbSend.connect(convolver)

    running = true
    nextChime = ctx.currentTime + 1.5
    scheduleLoop()
  }

  function setMuted(next: boolean) {
    muted = next
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(next ? 0 : 0.5, ctx.currentTime, 0.4)
    }
  }

  return { start, setMuted, started: () => !!ctx }
}