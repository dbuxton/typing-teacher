/**
 * The story that ties Star Trail together: why the ship is in pieces, whose
 * messages the trails are, and where the crew went. The ending (ending.ts)
 * pays it off, and the crew turn up in the last planet's messages too.
 */

/** The Lost Ship's crew. They wrote every message on the trails. */
export const CREW = ['Captain Zog', 'Commander Pip', 'Robot Bleep'] as const

export const STORY = {
  /** Under the title in the hangar. */
  premise:
    'Long ago, a star storm broke the Lost Ship into thirty pieces. Its crew — Captain Zog, Commander Pip and Robot Bleep — hid the pieces on ten planets, then drifted off in their escape pod, leaving a trail of glowing letters to every piece.',
  callToAction: 'Follow the trails, rebuild the ship, and find out where the crew went.',
}
