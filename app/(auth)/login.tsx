// login.tsx - Corrected Navigation

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, CircleAlert as AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth';
import { signInSchema, validateField } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange((user) => {
      if (user) {
        // Let the RootLayout handle the navigation automatically
        // Don't manually navigate here to avoid conflicts
        console.log('User authenticated, RootLayout should handle navigation');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const validateForm = (): boolean => {
    const emailValidation = validateField(signInSchema.shape.email, email);
    const passwordValidation = validateField(signInSchema.shape.password, password);

    setEmailError(emailValidation.error || null);
    setPasswordError(passwordValidation.error || null);

    return emailValidation.isValid && passwordValidation.isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signIn(email, password);
      
      // Don't manually navigate here - let RootLayout handle it
      // The useEffect above will detect the auth state change
      // and RootLayout will automatically navigate to /(tabs)
      
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account.');
      } else if (err.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError('Unable to sign in. Please try again.');
        console.error('Login error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { url } = await authService.signInWithGoogle();
      
      // Open URL in browser for OAuth flow
      await WebBrowser.openAuthSessionAsync(url, 'writee://', {
        showInRecents: true,
      });

    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
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

          <View style={[styles.inputContainer, emailError && styles.inputError]}>
            <Mail size={20} color={emailError ? Colors.error.main : Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Colors.neutral.main}
            />
          </View>
          {emailError && <Text style={styles.fieldError}>{emailError}</Text>}

          <View style={[styles.inputContainer, passwordError && styles.inputError]}>
            <Lock size={20} color={passwordError ? Colors.error.main : Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry={!showPassword}
              placeholderTextColor={Colors.neutral.main}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.neutral.main} />
              ) : (
                <Eye size={20} color={Colors.neutral.main} />
              )}
            </TouchableOpacity>
          </View>
          {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}

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
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={require('@/assets/images/google-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </TouchableOpacity>

          {/* Debug buttons */}
          <TouchableOpacity 
            style={{...styles.googleButton, backgroundColor: '#ff4444'}}
            onPress={async () => {
              await AsyncStorage.removeItem('hasLaunchedBefore');
              alert('Onboarding reset! Close and restart the app.');
            }}
          >
            <Text style={{color: 'white'}}>🔄 Reset Onboarding (DEV)</Text>
          </TouchableOpacity>

          {/* Test manual navigation - for debugging only */}
          <TouchableOpacity 
            style={{...styles.googleButton, backgroundColor: '#4444ff'}}
            onPress={() => {
              console.log('Testing manual navigation to tabs...');
              router.replace('/(tabs)');
            }}
          >
            <Text style={{color: 'white'}}>🧪 Manual Nav Test (DEV)</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
           <Link href="/(auth)/signup" asChild>
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
    borderColor: '#E0E0E0',
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
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
  passwordToggle: {
    padding: 8,
  },
  inputError: {
    borderColor: Colors.error.main,
  },
  fieldError: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.error.main,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
});