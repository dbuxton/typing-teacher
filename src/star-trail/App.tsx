import { activePilot, useStarTrail } from './store/pilotStore'
import { Arrival } from './screens/Arrival'
import { Galaxy } from './screens/Galaxy'
import { Hangar } from './screens/Hangar'
import { Hunt } from './screens/Hunt'
import { Ending, LostShip } from './screens/LostShip'
import { Found, Towed } from './screens/Results'
import { SpaceStation } from './screens/SpaceStation'
import { Starfield } from './components/Starfield'

/**
 * Star Trail's screens, switched on a field in the store. No router: the game
 * is one page, like Typing Teacher, which keeps its sub-path hosting trivial.
 */
export default function App() {
  const screen = useStarTrail((s) => s.screen)
  const pilot = useStarTrail(activePilot)
  const plan = useStarTrail((s) => s.plan)

  if (!pilot || screen === 'hangar') {
    return (
      <>
        <Starfield />
        <Hangar />
      </>
    )
  }

  switch (screen) {
    case 'arrival':
      return <Arrival pilot={pilot} />
    case 'hunt':
      // Keyed on the seed so every hunt starts with a fresh trail state.
      return plan ? <Hunt key={plan.seed} pilot={pilot} plan={plan} /> : <Galaxy pilot={pilot} />
    case 'found':
      return <Found pilot={pilot} />
    case 'towed':
      return <Towed pilot={pilot} />
    case 'station':
      return <SpaceStation pilot={pilot} />
    case 'ship':
      return <LostShip pilot={pilot} />
    case 'ending':
      return <Ending pilot={pilot} />
    case 'galaxy':
    default:
      return <Galaxy pilot={pilot} />
  }
}
