import { TransitionStack } from '@/navigation/TransitionStack';
import { SettingsTransition } from '@/navigation/transitions';

export default function SettingsLayout() {
  return (
    <TransitionStack screenOptions={SettingsTransition}>
      <TransitionStack.Screen name="index" />
      <TransitionStack.Screen name="profile" />
      <TransitionStack.Screen name="privacy-policy" />
      <TransitionStack.Screen name="feedback" />
    </TransitionStack>
  );
}
