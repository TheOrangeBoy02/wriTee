import { TransitionStack } from '@/navigation/TransitionStack';
import { SettingsTransition } from '@/navigation/transitions';
import Transition from 'react-native-screen-transitions';

export default function SettingsLayout() {
  const DraggableCardOptions = Transition.Presets.DraggableCard({
    gestureEnabled: true,
    gestureDirection: 'vertical',
  });

  return (
    <TransitionStack screenOptions={SettingsTransition}>
      <TransitionStack.Screen name="index" />
      <TransitionStack.Screen name="profile" options={DraggableCardOptions} />
      <TransitionStack.Screen name="privacy-policy" options={DraggableCardOptions} />
      <TransitionStack.Screen name="feedback" options={DraggableCardOptions} />
    </TransitionStack>
  );
}
