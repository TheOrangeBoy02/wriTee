import { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { validateField } from '@/utils/validation';
import { z } from 'zod';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Check for valid recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔐 Checking for recovery session...');

        // First check if we have a valid session (Supabase automatically handles the token from the deep link)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session check error:', error);
          setError('Invalid or expired reset link. Please request a new one.');
          setCheckingSession(false);
          return;
        }

        if (session) {
          console.log('✅ Valid recovery session found for user:', session.user.email);
          setIsValidSession(true);
        } else {
          console.warn('⚠️ No session found');
          setError('Invalid or expired reset link. Please request a new one.');
        }
      } catch (err) {
        console.error('❌ Error checking session:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setCheckingSession(false);
      }
    };

    // Small delay to ensure deep link has been processed
    const timer = setTimeout(() => {
      checkSession();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const validateForm = (): boolean => {
    const passwordValidation = validateField(passwordSchema, newPassword);
    setPasswordError(passwordValidation.error || null);

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return false;
    }

    setConfirmError(null);
    return passwordValidation.isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.updatePassword(newPassword);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.message?.includes('session')) {
        setError('Your reset link has expired. Please request a new one.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (!isValidSession) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.errorStateContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={64} color={Colors.error.main} />
            </View>

            <Text style={styles.errorStateTitle}>Link Expired</Text>
            <Text style={styles.errorStateText}>
              {error || 'Your password reset link has expired or is invalid.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(auth)/forgot-password')}
            >
              <Text style={styles.primaryButtonText}>Request New Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (success) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Check size={64} color={Colors.success.main} />
            </View>

            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successText}>
              Your password has been successfully reset.
            </Text>
            <Text style={styles.instructionText}>
              Redirecting you to login...
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/writee-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Please enter your new password below.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, passwordError && styles.inputError]}>
            <Lock size={20} color={passwordError ? Colors.error.main : Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) setPasswordError(null);
                if (error) setError(null);
              }}
              secureTextEntry={!showNewPassword}
              placeholderTextColor={Colors.neutral.main}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff size={20} color={Colors.neutral.main} />
              ) : (
                <Eye size={20} color={Colors.neutral.main} />
              )}
            </TouchableOpacity>
          </View>
          {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}

          <View style={[styles.inputContainer, confirmError && styles.inputError]}>
            <Lock size={20} color={confirmError ? Colors.error.main : Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmError) setConfirmError(null);
                if (error) setError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor={Colors.neutral.main}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={Colors.neutral.main} />
              ) : (
                <Eye size={20} color={Colors.neutral.main} />
              )}
            </TouchableOpacity>
          </View>
          {confirmError && <Text style={styles.fieldError}>{confirmError}</Text>}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>
              Back to <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.main,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    marginTop: 16,
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
    width: 80,
    height: 120,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
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
    flex: 1,
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
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
  },
  loginLinkBold: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary.main,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  // Error state styles
  errorStateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.error.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  errorStateTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    height: 56,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 12,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary.main,
  },
});
