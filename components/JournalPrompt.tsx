import { Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

type JournalPromptProps = {
  prompt: string;
};

export default function JournalPrompt({ prompt }: JournalPromptProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  // Animate on mount
  opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  translateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.promptText}>{prompt}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary.light,
    borderRadius: 12,
    padding: 16,
  },
  promptText: {
    fontFamily: 'Playfair-SemiBold',
    fontSize: 18,
    color: Colors.primary.dark,
    lineHeight: 28,
  },
});