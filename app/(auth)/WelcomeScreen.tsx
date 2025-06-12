import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/writee-logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to WriTee</Text>
          <Text style={styles.exclamation}>!</Text>
        </Text>

        <Text style={styles.subtitle}>
          Your daily space for reflection, ideas, and growth
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 32,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Playfair-Bold',
    color: Colors.text.dark,
  },
  exclamation: {
    fontSize: 32,
    fontFamily: 'Playfair-Bold',
    color: Colors.primary.main,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: Colors.text.medium,
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
});