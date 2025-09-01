import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  ListRenderItem,
  Animated 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Rive from 'rive-react-native';
import Colors from '@/constants/Colors';
import { ChevronRight } from 'lucide-react-native';

// Get device width for slides
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define the structure of each slide
interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  riveResource: string; // Rive resource name
  stateMachineName?: string; // Optional: for Rive state machines
  artboardName?: string; // Optional: for specific Rive artboards
}

// STEP 1: Define your slide data with Rive animations
const ONBOARDING_DATA: OnboardingSlide[] = [
{
  id: '1',
  title: 'Welcome to WriTee!',
  subtitle: 'Your personal space to capture thoughts, reflect, and grow every day.',
  riveResource: 'handwrite', // This matches handwrite.riv
},
{
  id: '2', 
  title: 'Make It a Habit',
  subtitle: 'Stay motivated with streaks and reminders that keep journaling simple.',
  riveResource: 'handwrite', // Using same animation, you can change this
},
{
  id: '3',
  title: 'Find Your Spark',
  subtitle: 'Explore prompts that open doors to new thoughts and deeper reflections.',
  riveResource: 'handwrite', // Using same animation, you can change this
}
];

export default function WelcomeScreen() {
  const router = useRouter();
  
  // STEP 2: State management for slides
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const riveRefs = useRef<{ [key: string]: any }>({});
  
  // STEP 2.1: Animation values for button transition
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;

  // STEP 3: Handle slide completion and navigation
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasLaunchedBefore', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error marking app as launched:', error);
      router.replace('/(auth)/login');
    }
  };

  // STEP 4: Handle animation when slide becomes active (Rive handles autoplay)
  useEffect(() => {
    const currentSlide = ONBOARDING_DATA[currentIndex];
    if (currentSlide.riveResource && riveRefs.current[currentSlide.id]) {
      // Rive animations typically handle their own playback
      // You can trigger specific states here if needed
      console.log(`Switched to slide with Rive resource: ${currentSlide.riveResource}`);
    }
  }, [currentIndex]);

  // STEP 5: Handle next slide navigation
  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      
      // Trigger animation when reaching last slide via button
      if (nextIndex === ONBOARDING_DATA.length - 1) {
        setTimeout(() => animateToGetStarted(), 300); // Delay for slide transition
      }
    } else {
      handleGetStarted();
    }
  };

  // STEP 6: Handle automatic slide detection when user swipes
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      setCurrentIndex(newIndex);
      
      // Trigger animation when reaching last slide
      if (newIndex === ONBOARDING_DATA.length - 1) {
        animateToGetStarted();
      }
    }
  });

  // STEP 6.1: Animation for button transition to "Get Started"
  const animateToGetStarted = () => {
    // Create a sequence: scale down -> scale up with style change
    Animated.sequence([
      // First: scale down and fade slightly
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // Then: scale back up and restore opacity
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // STEP 7: Create individual slide component
  const renderSlide: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Rive
          ref={(ref) => {
            riveRefs.current[item.id] = ref;
          }}
          resourceName={item.riveResource}
          style={styles.riveAnimation}
          autoplay={true}
          stateMachineName={item.stateMachineName}
          artboardName={item.artboardName}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  // STEP 8: Create pagination dots
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {ONBOARDING_DATA.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex ? styles.paginationDotActive : styles.paginationDotInactive
          ]}
        />
      ))}
    </View>
  );

  // STEP 9: Determine button text and style based on current slide
  const getButtonText = () => {
    return currentIndex === ONBOARDING_DATA.length - 1 ? "Let's Get Started ->" : 'Continue ->';
  };

  const isLastSlide = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <View style={styles.container}>

      {/* STEP 11: Slides carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* STEP 12: Bottom section with pagination and buttons */}
      <View style={styles.bottomSection}>
        {renderPagination()}
        
        <Animated.View
          style={[
            { transform: [{ scale: buttonScale }], opacity: buttonOpacity }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              isLastSlide ? styles.continueButtonSolid : styles.continueButtonOutline
            ]} 
            onPress={handleNext}
          >
            <Text 
              style={[
                styles.continueButtonText,
                isLastSlide ? styles.continueButtonTextSolid : styles.continueButtonTextOutline
              ]}
            >
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  riveAnimation: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
  },
  textContainer: {
    flex: 0.8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  slideTitle: {
    fontSize: 32,
    fontFamily: 'Playfair-Bold',
    color: Colors.text.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    color: Colors.text.medium,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  paginationDot: {
    width: 23,
    height: 4,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary.main,
  },
  paginationDotInactive: {
    backgroundColor: Colors.neutral.light,
  },
  continueButton: {
    paddingHorizontal: 90,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
  },
  // Solid button style (for "Let's Get Started")
  continueButtonSolid: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  // Outline button style (for "Continue")
  continueButtonOutline: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary.main,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  // Solid button text (white text)
  continueButtonTextSolid: {
    color: '#fff',
  },
  // Outline button text (primary color text)
  continueButtonTextOutline: {
    color: Colors.primary.main,
  },
});