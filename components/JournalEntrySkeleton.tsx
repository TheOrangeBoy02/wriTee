// components/JournalEntrySkeleton.tsx

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

type JournalEntrySkeletonProps = {
  count?: number;
};

const SkeletonBox = ({ width, height, style, delay = 0 }: { width: number | string; height: number; style?: any; delay?: number }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [3.3, 0.7, 0.1]
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors.neutral.border,
          borderRadius: 6,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const SingleSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Title */}
      <SkeletonBox width="60%" height={12} style={{ marginBottom: 8 }} delay={0} />

      {/* Date */}
      <SkeletonBox width="30%" height={14} style={{ marginBottom: 12 }} delay={150} />

      {/* Excerpt - 3 lines */}
      <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} delay={300} />

      {/* Shelf tags */}
      <View style={styles.shelvesContainer}>
        <SkeletonBox width={8} height={8} style={{ borderRadius: 4 }} delay={450} />
        <SkeletonBox width={8} height={8} style={{ borderRadius: 4, marginLeft: 8 }} delay={550} />
        <SkeletonBox width={8} height={8} style={{ borderRadius: 4, marginLeft: 8 }} delay={650} />
      </View>
    </View>
  );
};

export default function JournalEntrySkeleton({ count = 5 }: JournalEntrySkeletonProps) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  container: {
    backgroundColor: Colors.background.light,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.neutral.border,
  },
  shelvesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
