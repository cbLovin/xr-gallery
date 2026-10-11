import * as THREE from 'three'

/**
 * Dev-only performance readout.
 *
 * Only loaded when the dev server is running AND the page is opened with `?perf`
 * (see the dynamic import in main.ts). `import.meta.env.DEV` is false in a production
 * build, so Vite drops the import and this file never ships to users.
 *
 * It shows, over a rolling window of frames:
 *   - frames per second and the frame-to-frame interval (average, 95th percentile, worst)
 *   - CPU time spent inside the animation loop (JS + issuing draw commands)
 *   - GPU time per frame, when the browser exposes EXT_disjoint_timer_query_webgl2
 *   - draw calls, triangles, points and lines from renderer.info
 *   - active lights (and how many cast shadows), shader programs, geometries, textures
 *
 * `window.__perf` returns the same numbers as an object, and `window.__gallery` exposes
 * the scene, renderer and camera, so measurements can be repeated and scripted.
 */

const WINDOW = 120 // frames in the rolling window

interface GpuTimer {
  begin(): void
  end(): void
  poll(): void
  readonly samples: number[]
}

function createGpuTimer(gl: WebGL2RenderingContext): GpuTimer | null {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as {
    TIME_ELAPSED_EXT: number
    GPU_DISJOINT_EXT: number
  } | null
  if (!ext) return null
  const pending: WebGLQuery[] = []
  let active: WebGLQuery | null = null
  const samples: number[] = []
  return {
    begin() {
      if (active || pending.length > 6) return
      active = gl.createQuery()
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active)
    },
    end() {
      if (!active) return
      gl.endQuery(ext.TIME_ELAPSED_EXT)
      pending.push(active)
      active = null
    },
    poll() {
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)
      while (pending.length) {
        const q = pending[0]
        if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break
        pending.shift()
        if (!disjoint) {
          samples.push(Number(gl.getQueryParameter(q, gl.QUERY_RESULT)) / 1e6)
          if (samples.length > WINDOW) samples.shift()
        }
        gl.deleteQuery(q)
      }
    },
    samples,
  }
}

function stats(values: number[]) {
  if (!values.length) return { avg: 0, p95: 0, max: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return { avg, p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))], max: sorted[sorted.length - 1] }
}

export interface PerfSnapshot {
  fps: number
  frameMs: { avg: number; p95: number; max: number }
  cpuMs: { avg: number; p95: number; max: number }
  gpuMs: { avg: number; p95: number; max: number } | null
  drawCalls: number
  triangles: number
  points: number
  lines: number
  lights: { total: number; shadowCasting: number; byType: Record<string, number> }
  programs: number
  geometries: number
  textures: number
  pixelRatio: number
  drawingBuffer: [number, number]
  gpu: string
}

export interface PerfOverlay {
  begin(): void
  end(): void
  snapshot(): PerfSnapshot
}

export function createPerfOverlay(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): PerfOverlay {
  const gl = renderer.getContext() as WebGL2RenderingContext
  const timer = createGpuTimer(gl)
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'unknown'

  const frames: number[] = []
  const cpu: number[] = []
  let lastBegin = 0
  let cpuStart = 0

  const box = document.createElement('pre')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:8px 10px;font:11px/1.45 ui-monospace,Consolas,monospace;' +
    'color:#9fffb4;background:rgba(0,0,0,.72);border:1px solid rgba(159,255,180,.35);border-radius:6px;pointer-events:none;white-space:pre'
  document.body.appendChild(box)

  function lightCounts() {
    const byType: Record<string, number> = {}
    let total = 0
    let shadowCasting = 0
    scene.traverseVisible((o) => {
      if ((o as THREE.Light).isLight) {
        total++
        byType[o.type] = (byType[o.type] ?? 0) + 1
        if ((o as THREE.Light).castShadow) shadowCasting++
      }
    })
    return { total, shadowCasting, byType }
  }

  function snapshot(): PerfSnapshot {
    const f = stats(frames)
    const info = renderer.info
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    return {
      fps: f.avg ? 1000 / f.avg : 0,
      frameMs: f,
      cpuMs: stats(cpu),
      gpuMs: timer && timer.samples.length ? stats(timer.samples) : null,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      lights: lightCounts(),
      programs: info.programs?.length ?? 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      pixelRatio: renderer.getPixelRatio(),
      drawingBuffer: [size.x, size.y],
      gpu,
    }
  }

  let tick = 0
  function paint() {
    const s = snapshot()
    const l = s.lights
    box.textContent =
      `fps ${s.fps.toFixed(1)}   frame ${s.frameMs.avg.toFixed(2)} ms (p95 ${s.frameMs.p95.toFixed(1)}, max ${s.frameMs.max.toFixed(1)})\n` +
      `cpu ${s.cpuMs.avg.toFixed(2)} ms   gpu ${s.gpuMs === null ? 'n/a' : s.gpuMs.avg.toFixed(2) + ' ms (p95 ' + s.gpuMs.p95.toFixed(2) + ')'}\n` +
      `draw calls ${s.drawCalls}   triangles ${s.triangles.toLocaleString()}   points ${s.points.toLocaleString()}\n` +
      `lights ${l.total} (${l.shadowCasting} cast shadows)   programs ${s.programs}\n` +
      `geometries ${s.geometries}   textures ${s.textures}   buffer ${s.drawingBuffer[0]}x${s.drawingBuffer[1]}`
  }

  const w = window as unknown as Record<string, unknown>
  w.__perf = snapshot
  w.__gallery = { scene, renderer, camera, THREE }

  return {
    begin() {
      const now = performance.now()
      if (lastBegin) {
        frames.push(now - lastBegin)
        if (frames.length > WINDOW) frames.shift()
      }
      lastBegin = now
      cpuStart = now
      timer?.begin()
    },
    end() {
      timer?.end()
      timer?.poll()
      cpu.push(performance.now() - cpuStart)
      if (cpu.length > WINDOW) cpu.shift()
      if (++tick % 20 === 0) paint()
    },
    snapshot,
  }
}
