import { TransitionStack } from '@/navigation/TransitionStack';
import { FadeTransition } from '@/navigation/transitions';

export default function AuthLayout() {
  return (
    <TransitionStack screenOptions={FadeTransition}>
      <TransitionStack.Screen name="login" />
      <TransitionStack.Screen name="signup" />
      <TransitionStack.Screen name="WelcomeScreen" />
    </TransitionStack>
  );
}