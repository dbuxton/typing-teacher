/** Star Trail's root. Screens arrive with the store; for now, the title card. */
export default function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="neon-title text-6xl font-black tracking-wide text-neon-cyan">Star Trail</h1>
      <p className="text-lg text-dim">Follow the glowing letters. Find the Lost Ship.</p>
    </main>
  )
}
