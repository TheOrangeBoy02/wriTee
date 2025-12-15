import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { runOnJS } from 'react-native-reanimated';


interface StreakCelebrationProps {
  visible: boolean;
  streakCount: number;
  isNewRecord?: boolean;
  onComplete: () => void;
  onNavigateToJournal?: () => void;
}

const { width, height } = Dimensions.get('window');

// Generate random confetti data once
const generateConfettiData = () => {
  return [...Array(30)].map(() => ({
    startX: Math.random() * width,
    startY: -50 - Math.random() * 100,
    endY: height + 50,
    rotation: Math.random() * 360,
    swingAmplitude: 20 + Math.random() * 40,
    duration: 3000 + Math.random() * 2000,
    delay: Math.random() * 1000,
    color: [
      Colors.primary.light,
      '#FFD700',
      '#FF6B6B',
      '#4ECDC4',
      '#95E1D3',
    ][Math.floor(Math.random() * 5)],
  }));
};

const ConfettiPiece = ({ data }: { data: any }) => {
  const translateY = useSharedValue(data.startY);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Falling animation
    translateY.value = withDelay(
      data.delay,
      withRepeat(
        withTiming(data.endY, {
          duration: data.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Swinging animation
    translateX.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.swingAmplitude, {
            duration: data.duration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-data.swingAmplitude, {
            duration: data.duration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    // Rotation animation
    rotation.value = withDelay(
      data.delay,
      withRepeat(
        withTiming(360, {
          duration: data.duration / 2,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: data.startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        { backgroundColor: data.color },
      ]}
    />
  );
};

export default function StreakCelebration({
  visible,
  streakCount,
  isNewRecord = false,
  onComplete,
  onNavigateToJournal,
}: StreakCelebrationProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const confettiOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const chevronTranslateX = useSharedValue(0);
  const [confettiData] = React.useState(generateConfettiData());

  useEffect(() => {
    if (visible) {
      // Reset all animations
      opacity.value = 0;
      translateY.value = 30;
      confettiOpacity.value = 0;
      logoOpacity.value = 0;
      buttonOpacity.value = 0;
      chevronTranslateX.value = 0;

      // Smooth fade in and slide up
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 400 });

      // Logo fade in
      logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

      // Confetti fade in
      confettiOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));

      // Button fade in after everything else
      buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

      // Chevron subtle left-right animation (starts after button fades in)
      chevronTranslateX.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    }
  }, [visible]);

  const handleContinue = () => {
    // Close modal first with fade out animation
  opacity.value = withTiming(0, { duration: 300 }, (finished) => {
    if (finished) {
      // Use runOnJS to safely call React/JS functions from Reanimated thread
      runOnJS(onComplete)();
      if (onNavigateToJournal) runOnJS(onNavigateToJournal)();
    }
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chevronTranslateX.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.fullScreenContainer}>
        <Animated.View style={[styles.contentContainer, containerStyle]}>
          {/* Main celebration card */}
          <View style={styles.card}>
            {/* WriTee Logo */}
            {/* <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={require('@/assets/images/writee-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View> */}

            {/* Streak number */}
            <View>
              <Text style={styles.streakNumber}>{streakCount}</Text>
              <Text style={styles.dayText}>
                {streakCount === 1 ? 'Day' : 'Days'}
              </Text>
            </View>

            {/* Message */}
            <Text style={styles.title}>Your streak just leveled up!</Text>
            <Text style={styles.subtitle}>
              You're on fire! Keep the momentum going.
            </Text>

            {/* New record badge */}
            {isNewRecord && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Best Streak!</Text>
              </View>
            )}
          </View>

          {/* Continue button */}
          <Animated.View style={buttonStyle}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Animated.View style={chevronStyle}>
                <ChevronRight size={24} color={Colors.background.main} strokeWidth={3} />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Confetti in front of everything */}
        <Animated.View style={[styles.confettiContainer, confettiStyle]} pointerEvents="none">
          {confettiData.map((data, i) => (
            <ConfettiPiece key={i} data={data} />
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,

  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  card: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  streakNumber: {
    fontFamily: 'Playfair-Bold',
    fontSize: 102,
    color: Colors.primary.main,
    textAlign: 'center',
    lineHeight: 80,
  },
  dayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: Colors.text.medium,
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: Colors.text.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    maxWidth: 250,
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#8B4513',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 60,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.background.main,
  },
});
