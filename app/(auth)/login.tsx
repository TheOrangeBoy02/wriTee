import { useState } from 'react';
import { View, Text, Image,TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, CircleAlert as AlertCircle, LogIn } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { login } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Welcome Text */}
        <View style={styles.logoContainer}>
           <Image
                      source={require('@/assets/images/writee-logo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>
            Welcome to <Text style={styles.wriTeeText}>WriTee</Text>
            <Text style={styles.purpleExclaim}>!</Text>
          </Text>
        
        </View>

        <View style={styles.formContainer}>
         
          
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Colors.neutral.main}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={Colors.neutral.main}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => {/* Navigate to password reset */}}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Google Sign In Button */}
          <TouchableOpacity style={styles.googleButton}>
            {/* Placeholder for Google logo */}
            <View style={styles.googleLogo} />
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    marginTop: 30,
    width: 95,
    height: 150,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.primary.main,
    fontFamily: 'Playfair-Bold',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.dark,
    textAlign: 'center',
  },
  wriTeeText: {
    color: Colors.primary.main,
    fontFamily: 'Inter-Bold',
  },
  purpleExclaim: {
    color: Colors.primary.main,
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.text.dark,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error.light,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error.main,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary.main,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
  },
  loginButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4', // Placeholder color for Google logo
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text.dark,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
  },
  signupLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.primary.main,
  },
});