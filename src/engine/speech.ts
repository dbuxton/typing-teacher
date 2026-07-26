/**
 * Speaking spelling words aloud.
 *
 * This is the ONLY place the app makes any sound, and it exists for a specific
 * reason: a word shown on screen tests transcription, not spelling. Copying
 * letters you can see is a different skill from knowing how a word is spelled.
 * Hearing the word while it stays hidden is what makes a Spelling Star an actual
 * spelling test.
 *
 * Uses the browser's built-in `speechSynthesis`, so there's nothing to download
 * and no network request — the app stays a self-contained static bundle.
 */

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Prefer a British voice to match the word bank ("colour", "favourite"). Falls
 * back to any English voice, then to the browser default.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechAvailable()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null // not loaded yet; the default will do
  return (
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  )
}

export type SpeakOptions = {
  /** Slower than conversational — the kid is spelling along, not listening. */
  rate?: number
}

export function speak(text: string, { rate = 0.85 }: SpeakOptions = {}): void {
  if (!isSpeechAvailable()) return
  // Cancel anything still being said, or repeated taps of "say it again" queue
  // up and talk over each other.
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.lang = 'en-GB'
  const voice = pickVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

/**
 * Say a word, then the hint sentence with the word in place. Hearing it in
 * context is how the word means something rather than being nine letters.
 */
export function speakWordWithHint(word: string, hint?: string): void {
  const sentence = hint ? hint.replace('___', word) : ''
  speak(sentence ? `${word}. ${sentence}` : word)
}

export function cancelSpeech(): void {
  if (!isSpeechAvailable()) return
  window.speechSynthesis.cancel()
}
