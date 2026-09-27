import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * localStorage, but it never throws and never silently loses a save.
 *
 * zustand's default JSON storage parses without a guard: a corrupt save throws,
 * the game starts empty, and the next write overwrites the only copy. Here an
 * unreadable save is copied aside to `<key>.corrupt` (once — a second failure
 * won't overwrite the first backup) before the game starts fresh, so a grown-up
 * can still rescue it. Storage that is full or switched off is survived quietly.
 */

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // Some browsers throw on the mere mention of localStorage when it's disabled.
    return null
  }
}

export function safeStorage<S>(): PersistStorage<S> {
  return {
    getItem(name) {
      const store = storage()
      let raw: string | null = null
      try {
        raw = store?.getItem(name) ?? null
      } catch {
        return null
      }
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<S>
      } catch {
        try {
          const backup = `${name}.corrupt`
          if (store && store.getItem(backup) === null) store.setItem(backup, raw)
        } catch {
          // Nowhere to put the backup either; nothing more we can do.
        }
        return null
      }
    },
    setItem(name, value) {
      try {
        storage()?.setItem(name, JSON.stringify(value))
      } catch {
        // Full or disabled storage: keep playing, just unsaved.
      }
    },
    removeItem(name) {
      try {
        storage()?.removeItem(name)
      } catch {
        // As above.
      }
    },
  }
}
