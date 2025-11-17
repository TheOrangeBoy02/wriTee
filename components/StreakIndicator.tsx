import { View, Text, StyleSheet } from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type StreakIndicatorProps = {
  streak: number;
  label?: string;
};

export default function StreakIndicator({ streak, label = "Current Streak" }: StreakIndicatorProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Animate on mount
  scale.value = withSpring(1.1, { damping: 4 });
  setTimeout(() => {
    scale.value = withSpring(1, { damping: 4 });
  }, 500);

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Animated.View style={animatedStyle}>
            {label === "Best Streak" ? (
              <Trophy size={24} color={Colors.accent.main} />
            ) : (
              <Flame size={24} color={Colors.accent.main} />
            )}
          </Animated.View>
          <Text style={styles.streakTitle}>{label}</Text>
        </View>
        
        <View style={styles.streakContent}>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>Days</Text>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  streakCard: {
    // backgroundColor: Colors.background.light,
    borderRadius: 16,
    padding: 20,
    width: 160,
    marginHorizontal: -20,
    // borderWidth: 1,
    borderColor:Colors.primary.main,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text.dark,
    marginLeft: 8,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  streakCount: {
    fontFamily: 'Playfair-Bold',
    fontSize: 60,
    color: Colors.text.dark,
  },
  streakLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.medium,
    marginLeft: 8,
    marginBottom: 18,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.neutral.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.main,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.text.medium,
    textAlign: 'right',
  },
});