import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Privacy Policy" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.introText, { color: colors.text.dark }]}>
          This Privacy Policy explains how we collect, use, and protect your information. By using WriTee, you agree to the practices described here.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Information We Collect</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          We collect information you provide when using the app, including your email address, display name, phone number (optional), journal entries, and book shelf data. We also collect basic usage information to improve the app.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>How We Store Your Data</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          Your data is stored securely using Supabase, a trusted cloud database provider. Your journal entries and personal information are protected with industry-standard security measures. Only you can access your journal entries through your authenticated account.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>How We Use Your Information</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          We use your information solely to provide and improve your journaling experience. We do not sell or share your personal information for marketing purposes.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Third-Party Services</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          WriTee uses a Supabase for data storage and authentication, and Expo for push notifications. These services operate under their own privacy policies.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Your Control</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          You can edit or delete your journal entries and account data at any time. Deleting your account will permanently remove all your data from our servers.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Contact</Text>
        <Text style={[styles.bodyText, { color: colors.text.medium }]}>
          For questions or requests about your data, contact us at writee@tamandakanjaye.com
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  introText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});
