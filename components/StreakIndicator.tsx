import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type StreakIndicatorProps = {
  streak: number;
};

export default function StreakIndicator({ streak }: StreakIndicatorProps) {
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
            <Flame size={24} color={Colors.accent.main} />
          </Animated.View>
          <Text style={styles.streakTitle}>Current Streak</Text>
        </View>
        
        <View style={styles.streakContent}>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>days</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(streak / 30 * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {streak >= 30 ? 'Monthly goal reached!' : `${30 - streak} days to monthly goal`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  streakCard: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  streakCount: {
    fontFamily: 'Playfair-Bold',
    fontSize: 40,
    color: Colors.text.dark,
  },
  streakLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.medium,
    marginLeft: 8,
    marginBottom: 8,
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