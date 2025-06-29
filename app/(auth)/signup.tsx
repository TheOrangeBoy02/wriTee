import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { User, Mail, Lock, CircleAlert as AlertCircle, Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth';
import { signUpSchema, validateField } from '@/utils/validation';

// Country codes data
const countryCodes = [
  { code: '+265', country: 'Malawi' },
  { code: '+44', country: 'UK' },
  { code: '+1', country: 'USA' },
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+91', country: 'India' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+86', country: 'China' },
  { code: '+55', country: 'Brazil' },
  { code: '+7', country: 'Russia' },
  { code: '+27', country: 'South Africa' },
  // Add more country codes as needed
];

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+265');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setNameError] = useState<string | null>(null);
  const [, setEmailError] = useState<string | null>(null);
  const [, setPasswordError] = useState<string | null>(null);
  const [, setPhoneError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    const fullPhoneNumber = countryCode + phoneNumber.replace(/\s|\(|\)|-/g, '');

    const nameValidation = validateField(signUpSchema.shape.displayName, name || undefined);
    const emailValidation = validateField(signUpSchema.shape.email, email);
    const passwordValidation = validateField(signUpSchema.shape.password, password);
    const phoneValidation = validateField(signUpSchema.shape.phoneNumber, fullPhoneNumber || undefined);

    // Show alert for each field error (for debugging)
    if (!nameValidation.isValid) {
      alert('Name error: ' + nameValidation.error);
    } else if (!emailValidation.isValid) {
      alert('Email error: ' + emailValidation.error);
    } else if (!passwordValidation.isValid) {
      alert('Password error: ' + passwordValidation.error);
    } else if (!phoneValidation.isValid) {
      alert('Phone error: ' + phoneValidation.error + '\nValue: ' + fullPhoneNumber);
    }

    console.log('Validation:', {
      name: nameValidation,
      email: emailValidation,
      password: passwordValidation,
      phone: phoneValidation,
      fullPhoneNumber,
    });

    setNameError(nameValidation.error || null);
    setEmailError(emailValidation.error || null);
    setPasswordError(passwordValidation.error || null);
    setPhoneError(phoneValidation.error || null);

    return nameValidation.isValid && emailValidation.isValid && passwordValidation.isValid && phoneValidation.isValid;
  };

  const handleSignup = async () => {
    const isValid = validateForm();
    console.log('Form valid?', isValid, { name, email, phoneNumber, password, countryCode });
    if (!isValid) {
      return;
    }

    const fullPhoneNumber = countryCode + phoneNumber.replace(/[\s()-]/g, '');

    setIsLoading(true);
    setError(null);

    try {
      await authService.signUp(email, password, name, fullPhoneNumber);
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

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Format as XXX XXX XXXX
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean);
      return parts.join(' ');
    }
    return text;
  };

  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1} 
        onPress={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalContent}>
          <FlatList
            data={countryCodes}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryCode}>{item.code}</Text>
                <Text style={styles.countryName}>{item.country}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <Text style={styles.title}>WriTee</Text>
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
              placeholder="Full Name *"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.neutral.main}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Colors.neutral.main}
            />
          </View>

          <View style={styles.phoneContainer}>
            <TouchableOpacity
              style={styles.countryCodeButton}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <ChevronDown size={16} color={Colors.neutral.main} />
            </TouchableOpacity>

            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone Number *"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                placeholderTextColor={Colors.neutral.main}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.neutral.main} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
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
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
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
      {renderCountryPicker()}
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
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 16,
    color: Colors.neutral.dark,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
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
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error.main,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
    marginBottom: 20,
    backgroundColor: '#fff',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    height: 60,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 28,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 0.5,
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 60,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  countryCodeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    marginRight: 4,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
    backgroundColor: '#fff',
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
    paddingVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.main,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.border,
  },
  countryCode: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    marginRight: 12,
    width: 60,
  },
  countryName: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
  },
});