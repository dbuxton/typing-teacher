/**
 * Little synthesised sound effects — no audio files, nothing to download.
 *
 * Everything is made with the Web Audio API on the fly. The audio context is
 * only created on the first sound, which always follows a key press or a click,
 * so browsers that block sound until the page is interacted with are happy.
 * Slips get a soft thud rather than a buzzer: same rule as the amber colour.
 */

export type SoundKind =
  | 'hit'
  | 'word'
  | 'slip'
  | 'shield'
  | 'regen'
  | 'catch'
  | 'found'
  | 'towed'
  | 'launch'
  | 'buy'
  | 'beep'
  | 'power'

type Wave = OscillatorType

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    context ??= new Ctor()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

function tone(ac: AudioContext, freq: number, duration: number, wave: Wave, volume: number, delay = 0, slideTo?: number) {
  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function whoosh(ac: AudioContext, duration: number, volume: number) {
  const length = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(300, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + duration)
  const gain = ac.createGain()
  gain.gain.value = volume
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start()
}

export function playSound(kind: SoundKind): void {
  const ac = audio()
  if (!ac) return
  switch (kind) {
    case 'hit':
      tone(ac, 700 + Math.random() * 120, 0.05, 'sine', 0.025)
      break
    case 'word':
      tone(ac, 880, 0.09, 'triangle', 0.05)
      tone(ac, 1320, 0.12, 'triangle', 0.045, 0.07)
      break
    case 'slip':
      tone(ac, 190, 0.16, 'triangle', 0.08, 0, 120)
      break
    case 'shield':
      tone(ac, 520, 0.14, 'square', 0.025, 0, 260)
      break
    case 'regen':
      tone(ac, 400, 0.18, 'sine', 0.05, 0, 900)
      break
    case 'catch':
      ;[988, 1319, 1760].forEach((f, i) => tone(ac, f, 0.1, 'triangle', 0.045, i * 0.06))
      break
    case 'found':
      ;[523, 659, 784, 1047].forEach((f, i) => tone(ac, f, 0.22, 'triangle', 0.06, i * 0.11))
      break
    case 'towed':
      ;[392, 330, 262].forEach((f, i) => tone(ac, f, 0.24, 'sine', 0.05, i * 0.16))
      break
    case 'launch':
      whoosh(ac, 1.2, 0.18)
      tone(ac, 110, 1.1, 'sawtooth', 0.02, 0, 440)
      break
    case 'buy':
      tone(ac, 660, 0.08, 'square', 0.03)
      tone(ac, 990, 0.14, 'square', 0.03, 0.08)
      break
    case 'beep':
      tone(ac, 1200, 0.05, 'sine', 0.03)
      break
    case 'power':
      tone(ac, 300, 0.2, 'sawtooth', 0.025, 0, 900)
      break
  }
}
