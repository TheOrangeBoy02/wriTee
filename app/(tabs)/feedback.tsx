import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { getUserProfile } from '@/services/user';
import { supabase } from '@/services/supabase';

interface FeedbackForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function FeedbackScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FeedbackForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setForm({
          name: profile.display_name || '',
          email: profile.email,
          subject: '',
          message: '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load your profile information.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return 'Name is required';
    }
    if (form.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return 'Please enter a valid email address';
    }

    if (!form.subject.trim()) {
      return 'Subject is required';
    }
    if (form.subject.trim().length < 3) {
      return 'Subject must be at least 3 characters';
    }
    if (form.subject.trim().length > 100) {
      return 'Subject must be less than 100 characters';
    }

    if (!form.message.trim()) {
      return 'Message is required';
    }
    if (form.message.trim().length < 10) {
      return 'Message must be at least 10 characters';
    }
    if (form.message.trim().length > 1000) {
      return 'Message must be less than 1000 characters';
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Error', 'You must be logged in to send feedback.');
        setSubmitting(false);
        return;
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-feedback', {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        },
      });

      if (error) {
        console.error('Error sending feedback:', error);
        Alert.alert(
          'Error',
          'Failed to send feedback. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Success
      Alert.alert(
        'Success',
        'Thank you for your feedback! We\'ll get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setForm({
                ...form,
                subject: '',
                message: '',
              });
              // Navigate back
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Feedback" />

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.introText}>
            We'd love to hear from you! Send us your questions, feedback, or suggestions.
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="Your name"
            editable={!submitting}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            placeholder="Your email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!submitting}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={form.subject}
            onChangeText={(text) => setForm({ ...form, subject: text })}
            placeholder="Brief subject line"
            maxLength={100}
            editable={!submitting}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={form.message}
            onChangeText={(text) => setForm({ ...form, message: text })}
            placeholder="Your message (10-1000 characters)"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />

          <Text style={styles.charCount}>
            {form.message.length}/1000 characters
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Send Feedback</Text>
            )}
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  introText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    marginBottom: 24,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: Colors.background.light,
    color: Colors.text.dark,
  },
  messageInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  charCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.text.light,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: Colors.primary.main,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
  },
});
