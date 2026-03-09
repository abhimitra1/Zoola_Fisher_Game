// Small audio helper using Web Audio API for placeholder sounds
let ctx: AudioContext | null = null

function ensure() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

export function playBeep(type: 'feed' | 'clean' | 'warn' | 'success' | 'fail') {
  const actx = ensure()
  // resume audio context if needed (browsers require a user gesture)
  const tryPlay = () => {
    const o = actx.createOscillator()
    const g = actx.createGain()
    o.connect(g)
    g.connect(actx.destination)
  switch (type) {
    case 'feed':
      o.frequency.value = 880
      g.gain.value = 0.02
      break
    case 'clean':
      o.frequency.value = 660
      g.gain.value = 0.02
      break
    case 'warn':
      o.frequency.value = 220
      g.gain.value = 0.04
      break
    case 'success':
      o.frequency.value = 1320
      g.gain.value = 0.03
      break
    case 'fail':
      o.frequency.value = 120
      g.gain.value = 0.05
      break
  }
    o.type = 'sine'
    const now = actx.currentTime
    o.start(now)
    g.gain.setValueAtTime(g.gain.value, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    o.stop(now + 0.2)
  }

  if (actx.state === 'suspended') {
    actx.resume().then(tryPlay).catch(() => {/* ignore resume errors */})
  } else {
    tryPlay()
  }
}
