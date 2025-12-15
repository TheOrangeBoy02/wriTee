import { useState, useEffect } from 'react';
import { View, Text, Image,TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, CircleAlert as AlertCircle, LogIn, Eye, EyeOff, User } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth';
import { signUpSchema, validateField } from '@/utils/validation';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setNameError] = useState<string | null>(null);
  const [, setEmailError] = useState<string | null>(null);
  const [, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange((user) => {
      if (user) {
        // Let the RootLayout handle the navigation automatically
        console.log('User authenticated, RootLayout should handle navigation');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const validateForm = (): boolean => {
    const nameValidation = validateField(signUpSchema.shape.displayName, name || undefined);
    const emailValidation = validateField(signUpSchema.shape.email, email);
    const passwordValidation = validateField(signUpSchema.shape.password, password);

    // Show alert for each field error (for debugging)
    if (!nameValidation.isValid) {
      alert('Name error: ' + nameValidation.error);
    } else if (!emailValidation.isValid) {
      alert('Email error: ' + emailValidation.error);
    } else if (!passwordValidation.isValid) {
      alert('Password error: ' + passwordValidation.error);
    }

    console.log('Validation:', {
      name: nameValidation,
      email: emailValidation,
      password: passwordValidation,
    });

    setNameError(nameValidation.error || null);
    setEmailError(emailValidation.error || null);
    setPasswordError(passwordValidation.error || null);

    return nameValidation.isValid && emailValidation.isValid && passwordValidation.isValid;
  };

  const handleSignup = async () => {
    const isValid = validateForm();
    console.log('Form valid?', isValid, { name, email, password });
    if (!isValid) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signUp(email, password, name);
      // Wait a moment for the profile to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      await authService.signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message?.includes('weak password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (err.message?.includes('invalid email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.signInWithGoogle();

      if (result?.url) {
        console.log('🌐 Opening OAuth URL in browser...');

        // Open the OAuth URL in a browser
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.url,
          'writee://'
        );

        console.log('🌐 Browser result type:', browserResult.type);
        console.log('🌐 Browser result:', JSON.stringify(browserResult, null, 2));

        if (browserResult.type === 'success') {
          console.log('✅ Browser OAuth flow completed');

          // Check if we got a URL back with the tokens
          if ('url' in browserResult && browserResult.url) {
            console.log('🔗 Got callback URL:', browserResult.url);
            // The deep link handler should process this, but let's also handle it here
            const url = browserResult.url;
            const hashParams = url.split('#')[1];

            if (hashParams) {
              console.log('🔑 Extracting tokens from callback URL');
              const params = new URLSearchParams(hashParams);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');

              if (accessToken) {
                console.log('✅ Found tokens, setting session...');
                const { supabase } = await import('@/services/supabase');
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });

                if (error) {
                  console.error('❌ Error setting session:', error);
                  setError('Failed to complete sign in. Please try again.');
                } else {
                  console.log('✅ Session set successfully');

                  // Create profile if needed
                  if (data?.user) {
                    await authService.handleOAuthCallback(
                      data.user.id,
                      data.user.email!,
                      data.user.user_metadata?.full_name || data.user.user_metadata?.name
                    );
                  }
                  // Auth state listener will handle navigation
                }
              }
            }
          } else {
            console.log('⚠️ No callback URL in browser result, waiting for deep link...');
          }
        } else if (browserResult.type === 'cancel') {
          setError('Sign in was cancelled. Please try again.');
        } else if (browserResult.type === 'dismiss') {
          console.log('ℹ️ Browser was dismissed');
        }
      }
    } catch (err: any) {
      console.error('❌ Google sign in error:', err);
      setError('Unable to sign in with Google. Please try again.');
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
        <View style={styles.headerContainer}>
              <Image
                                source={require('@/assets/images/writee-logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                              />
          <Text style={styles.subtitle}>Your mindful journaling companion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Account</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.neutral.main}
            />
          </View>

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

         <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn size={20} color="#fff" />
                <Text style={styles.signupButtonText}>Sign Up</Text>
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
            <Text style={styles.googleButtonText}>Sign Up with Google</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Login</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },


  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 42,
    color: Colors.primary.main,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    color: Colors.neutral.dark,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
  },
  formTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: Colors.text.dark,
    marginBottom: 28,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error.main,
  },

  logoImage: {
    width: 80,
    height: 120,
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
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
    paddingVertical: 2,
  },
  passwordToggle: {
    padding: 8,
  },
  signupButton: {
  flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
  },
  signupButtonText: {
   fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.text.medium,
  },
  loginLink: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.border,
  },
  dividerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral.main,
    marginHorizontal: 16,
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
});