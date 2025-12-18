import Transition from 'react-native-screen-transitions';
import { interpolate, Extrapolation } from 'react-native-reanimated';

/**
 * Slide from bottom transition with gesture dismiss
 * Used for modal-like screens (journal entry detail)
 *
 * Timing: 350ms ease-out
 * Gesture: Vertical swipe down (50% threshold)
 */
export const JournalDetailTransition = Transition.Presets.SlideFromBottom({
  gestureEnabled: true,
  gestureDirection: 'vertical',
});

/**
 * Slide from right transition with gesture back
 * Used for hierarchical navigation (settings screens)
 *
 * Timing: 300ms ease-in-out
 * Gesture: Horizontal swipe right
 */
export const SettingsTransition = {
  screenStyleInterpolator: (props: any) => {
    'worklet';
    const { progress, layouts } = props;

    return {
      contentStyle: {
        transform: [
          {
            translateX: interpolate(
              progress,
              [0, 1],
              [layouts.screen.width, 0],
              Extrapolation.CLAMP
            ),
          },
        ],
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
};

/**
 * Fade transition
 * Used for auth flow screens
 *
 * Timing: 250ms linear
 * Gesture: Disabled
 */
export const FadeTransition = {
  screenStyleInterpolator: (props: any) => {
    'worklet';
    const { progress } = props;

    return {
      contentStyle: {
        opacity: progress,
      },
    };
  },
  gestureEnabled: false,
};

/**
 * Tab slide transition
 * Used for tab switching with horizontal slide
 *
 * Timing: 200ms ease-in-out
 */
export const TabSlideTransition = {
  screenStyleInterpolator: (props: any) => {
    'worklet';
    const { progress, layouts } = props;

    return {
      contentStyle: {
        transform: [
          {
            translateX: interpolate(
              progress,
              [0, 1],
              [layouts.screen.width * 0.3, 0],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          progress,
          [0, 0.5, 1],
          [0, 1, 1],
          Extrapolation.CLAMP
        ),
      },
    };
  },
  gestureEnabled: false,
};
