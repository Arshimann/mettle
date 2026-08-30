import { useUI } from '../store/useUI';

/**
 * The two guided tours, as data.
 *
 * Steps address real elements by selector, and most of them already carry an
 * aria-label for accessibility, so there is nothing to add to the markup. The
 * `before` hook navigates first, which is what makes the welcome tour a walk
 * through the actual app rather than a slideshow about it.
 */
export interface CoachStep {
  id: string;
  /** CSS selector for the element to spotlight. */
  target: string;
  title: string;
  body: string;
  /** Runs before the step is measured — usually a navigate. */
  before?: () => void;
}

export type TourId = 'welcome' | 'first-lift';

const go = (screen: Parameters<ReturnType<typeof useUI.getState>['navigate']>[0]) => () =>
  useUI.getState().navigate(screen);

export const WELCOME_TOUR: CoachStep[] = [
  {
    id: 'home',
    target: 'nav button[aria-label="Home"]',
    title: 'Home',
    body: 'Your day at a glance — streak, what’s next, and how the week is going.',
    before: go('home'),
  },
  {
    id: 'split',
    target: 'nav button[aria-label="Split"]',
    title: 'Your split',
    body: 'Training days live here. Build them once and reuse them forever, or start from a template.',
    before: go('split'),
  },
  {
    id: 'train',
    target: 'nav button[aria-label="Train"]',
    title: 'Train',
    body: 'Pick a day, hit Start, and log each set as you go. This is where you’ll spend most of your time.',
    before: go('train'),
  },
  {
    id: 'you',
    target: 'nav button[aria-label="You"]',
    title: 'You',
    body: 'Body weight, goals, progress photos and your consistency — everything about you rather than the session.',
    before: go('you'),
  },
  {
    id: 'settings',
    target: 'header button[aria-label="Settings"]',
    title: 'Settings',
    body: 'Themes, units, privacy — and a searchable FAQ under About if you ever get stuck.',
    before: go('home'),
  },
];

export const FIRST_LIFT_TOUR: CoachStep[] = [
  {
    id: 'weight',
    target: 'input[aria-label="Weight"]',
    title: 'Weight',
    body: 'Type what you lifted. The faded number is a suggestion based on last time — tap the tick to accept it as-is.',
  },
  {
    id: 'reps',
    target: 'input[aria-label="Reps"]',
    title: 'Reps',
    body: 'How many you got. Leave it blank and the tick fills in the suggestion for you.',
  },
  {
    id: 'failure',
    target: 'button[aria-label="To failure"]',
    title: 'Taken to failure?',
    body: 'Tap F when you emptied the tank on that set. Failure sets keep exactly the reps you type, since the whole point is you didn’t know the number in advance.',
  },
  {
    id: 'done',
    target: 'button[aria-label="Mark set done"]',
    title: 'Log the set',
    body: 'This records it and starts your rest timer. It’s the button you’ll press most in the whole app.',
  },
  {
    id: 'add-set',
    target: '[data-coach="add-set"]',
    title: 'More sets',
    body: 'Add as many as you need — your split just sets the starting point, not a limit.',
  },
  {
    id: 'finish',
    target: '[data-coach="finish-workout"]',
    title: 'Finishing up',
    body: 'When you’re done, this saves the session and shows you what you did. Nothing is logged until you do.',
  },
];

export const TOURS: Record<TourId, CoachStep[]> = {
  welcome: WELCOME_TOUR,
  'first-lift': FIRST_LIFT_TOUR,
};
