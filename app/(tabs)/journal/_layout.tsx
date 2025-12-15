import { TransitionStack } from '@/navigation/TransitionStack';
import { JournalDetailTransition } from '@/navigation/transitions';

export default function JournalLayout() {
  return (
    <TransitionStack>
      <TransitionStack.Screen name="index" />
      <TransitionStack.Screen
        name="[id]"
        options={JournalDetailTransition}
      />
    </TransitionStack>
  );
}