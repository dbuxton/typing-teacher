import { useState } from 'react'
import { useStore } from '../store/profileStore'
import { BigButton } from '../components/Chrome'

const AVATARS = ['🦊', '🐼', '🐙', '🦖', '🐧', '🦄', '🐝', '🐸', '🦉', '🐳']

/** Profile picker. Multiple kids can share one computer without sharing a garden. */
export function Home() {
  const save = useStore((s) => s.save)
  const addProfile = useStore((s) => s.addProfile)
  const selectProfile = useStore((s) => s.selectProfile)
  const deleteProfile = useStore((s) => s.deleteProfile)

  const [adding, setAdding] = useState(save.profiles.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    addProfile(trimmed, avatar)
    setName('')
    setAdding(false)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-slate-800">Typing Teacher</h1>
        <p className="mt-2 text-lg text-slate-500">Eyes up, fingers busy! ⌨️</p>
      </div>

      {save.profiles.length > 0 && (
        <div className="flex w-full flex-col gap-3">
          {save.profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow"
            >
              <button
                onClick={() => selectProfile(profile.id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <span className="text-4xl">{profile.avatar}</span>
                <span className="flex-1">
                  <span className="block text-xl font-bold">{profile.name}</span>
                  <span className="block text-sm text-slate-500">
                    Level {profile.currentLevel} · {profile.lessonsCompleted} lesson
                    {profile.lessonsCompleted === 1 ? '' : 's'}
                    {profile.streak > 0 && ` · 🔥 ${profile.streak}`}
                  </span>
                </span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${profile.name}'s progress? This cannot be undone.`)) {
                    deleteProfile(profile.id)
                  }
                }}
                className="rounded-full px-2 py-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                title="Delete this player"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow">
          <label className="w-full">
            <span className="mb-1 block text-sm font-bold text-slate-600">What's your name?</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              maxLength={16}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-sky-400"
              placeholder="Type your name"
            />
          </label>

          <div className="w-full">
            <span className="mb-2 block text-sm font-bold text-slate-600">Pick a friend</span>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`rounded-xl p-2 text-3xl transition ${
                    avatar === emoji ? 'bg-sky-100 ring-2 ring-sky-400' : 'hover:bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <BigButton onClick={create} disabled={!name.trim()}>
              Let's go!
            </BigButton>
            {save.profiles.length > 0 && (
              <BigButton tone="secondary" onClick={() => setAdding(false)}>
                Cancel
              </BigButton>
            )}
          </div>
        </div>
      ) : (
        <BigButton tone="secondary" onClick={() => setAdding(true)}>
          ➕ New player
        </BigButton>
      )}
    </div>
  )
}
