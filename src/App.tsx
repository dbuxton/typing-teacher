import { useStore } from './store/profileStore'
import { TopBar } from './components/Chrome'
import { Home } from './screens/Home'
import { LessonMap } from './screens/LessonMap'
import { Lesson } from './screens/Lesson'
import { Results } from './screens/Results'
import { GardenScreen } from './screens/GardenScreen'
import { BadgeShelf } from './screens/BadgeShelf'

/**
 * Five screens, switched on a field in the store. No router: the whole app is
 * one page with no URLs worth linking to, and this keeps the GitHub Pages
 * sub-path deployment completely trivial.
 */
export default function App() {
  const screen = useStore((s) => s.screen)
  const profile = useStore((s) => s.save.profiles.find((p) => p.id === s.save.activeProfileId) ?? null)

  if (!profile || screen === 'home') return <Home />

  return (
    <div className="flex min-h-full flex-col">
      <TopBar profile={profile} />
      <main className="flex-1">
        {screen === 'map' && <LessonMap profile={profile} />}
        {screen === 'lesson' && <Lesson profile={profile} />}
        {screen === 'results' && <Results profile={profile} />}
        {screen === 'garden' && <GardenScreen profile={profile} />}
        {screen === 'badges' && <BadgeShelf profile={profile} />}
      </main>
    </div>
  )
}
