import { useEffect, useState } from 'react'

let ctx: AudioContext | null = null

/** Call from a user gesture so the browser lets us play sound later. */
export function primeAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* no audio */
  }
}

export function beep() {
  if (!ctx) return
  try {
    const at = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 1320 : 880
      gain.gain.setValueAtTime(0.0001, at + i * 0.22)
      gain.gain.exponentialRampToValueAtTime(0.4, at + i * 0.22 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + i * 0.22 + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at + i * 0.22)
      osc.stop(at + i * 0.22 + 0.2)
    }
  } catch {
    /* ignore */
  }
}

export function buzz() {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400])
  } catch {
    /* ignore */
  }
}

export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** Keep the screen on while a workout is running. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        /* denied or unsupported */
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [enabled])
}
