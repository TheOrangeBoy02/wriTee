import { useState, useEffect } from 'react';
import { View,ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, RefreshCw, Pencil, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import StreakIndicator from '@/components/StreakIndicator';
import JournalPrompt from '@/components/JournalPrompt';
import { getRandomPrompt } from '@/services/prompts';
import { getUserStreak, getUsername } from '@/services/user';

export default function HomeScreen() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [username, setUsername] = useState('');
  const [streak, setStreak] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    setGreeting(getGreeting());
    loadRandomPrompt();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await getUsername();
      const userStreak = await getUserStreak();
      setUsername(name);
      setStreak(userStreak);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRandomPrompt = async () => {
    try {
      const newPrompt = await getRandomPrompt();
      setPrompt(newPrompt);
    } catch (error) {
      console.error('Error loading prompt:', error);
      setPrompt('What are you grateful for today?');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleNewEntry = () => {
    router.push('/journal/new');
  };

  const handleRefreshPrompt = () => {
    loadRandomPrompt();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.username}>{username || 'Writer'}</Text>
        </View>

        <View style={styles.streakContainer}>
          <StreakIndicator streak={streak} />
        </View>

        <View style={styles.promptSection}>
          <View style={styles.promptHeader}>
            <View style={styles.promptTitleContainer}>
              <Sparkles size={20} color={Colors.accent.main} />
              <Text style={styles.promptTitle}>Today's Prompt</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefreshPrompt}
            >
              <RefreshCw size={16} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>
          
          <JournalPrompt prompt={prompt} />
          
          <TouchableOpacity
            style={styles.writeButton}
            onPress={handleNewEntry}
          >
            <Pencil size={20} color="#fff" />
            <Text style={styles.writeButtonText}>Write Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <TouchableOpacity 
            style={styles.recentEntryCard}
            onPress={() => router.push('/journal')}
          >
            <BookOpen size={20} color={Colors.primary.main} />
            <Text style={styles.viewAllText}>View All Entries</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: Colors.text.medium,
  },
  username: {
    fontFamily: 'Playfair-Bold',
    fontSize: 32,
    color: Colors.text.dark,
  },
  streakContainer: {
    marginBottom: 32,
  },
  promptSection: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text.dark,
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.main,
  },
  writeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  writeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text.dark,
    marginBottom: 16,
  },
  recentEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.primary.main,
    marginLeft: 12,
  },
});