// app/(tabs)/index.tsx

import { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, RefreshCw, Pencil, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import StreakIndicator from '@/components/StreakIndicator';
import JournalPrompt from '@/components/JournalPrompt';
import { getRandomPrompt } from '@/services/prompts';
import { getUserStreaks, getUsername } from '@/services/user';
import { getRecentJournalEntries } from '@/services/journal';
import MinimalRecentEntry from '@/components/MinimalRecentEntry';

export default function HomeScreen() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [username, setUsername] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentEntries, setRecentEntries] = useState<import('@/types').JournalEntry[]>([]);

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    loadUserData();
    setGreeting(getGreeting);
    loadRandomPrompt();
    loadRecentEntries();
  }, [getGreeting]);

  const loadUserData = async () => {
    try {
      const name = await getUsername();
      const { currentStreak, bestStreak } = await getUserStreaks();
      setUsername(name);
      setCurrentStreak(currentStreak);
      setBestStreak(bestStreak);
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

  const loadRecentEntries = async () => {
    try {
      const entries = await getRecentJournalEntries(3);
      setRecentEntries(entries);
    } catch (error) {
      console.error('Error loading recent entries:', error);
      setRecentEntries([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload all data
      await Promise.all([
        loadUserData(),
        loadRandomPrompt(),
        loadRecentEntries()
      ]);
      // Update greeting in case time has changed
      setGreeting(getGreeting);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewEntry = () => {
    router.push({
      pathname: '/journal/[id]',
      params: { id: 'new', prompt }
    });
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
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
            progressBackgroundColor={Colors.background.light}
          />
        }
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.username}>{username || 'Writer'}</Text>
        </View>

        <View style={styles.streakContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
           <StreakIndicator streak={currentStreak} label="Current Streak"/>
           <StreakIndicator streak={bestStreak} label="Best Streak"/>
          </View>
        </View>

        <View style={styles.promptSection}>
          <View style={styles.promptHeader}>
            <View style={styles.promptTitleContainer}>
              <Sparkles size={20} color={Colors.accent.main} />
              <Text style={styles.promptTitle}>Today&apos;s Prompt</Text>
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
          {recentEntries.length === 0 ? (
            <Text style={{ color: Colors.text.medium, marginBottom: 8 }}>No recent entries found.</Text>
          ) : (
            recentEntries.map(entry => (
              <MinimalRecentEntry
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/journal/${entry.id}`)}
              />
            ))
          )}
          {/* View All Entries button */}
          <TouchableOpacity 
            style={{
              backgroundColor: Colors.background.main,
              borderWidth: 1,
              borderColor: Colors.primary.main,
              paddingVertical: 14,
              paddingHorizontal: 24,
              marginTop: 16,
              borderRadius: 30,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push('/journal')}
          >
            <BookOpen size={24} color="#af1dbf" />
            <Text style={{
              fontFamily: 'Inter-Bold',
              fontSize: 18,
              marginLeft: 12,
              color: Colors.primary.main,
            }}>View All Entries</Text>
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
    fontFamily: 'ComforterBrush_400Regular',
    fontSize: 50,
    color: Colors.text.dark,
  },
  streakContainer: {
    alignContent: 'center',
    // backgroundColor: Colors.background.light,
    borderRadius: 16,
    marginBottom: 32,
  },
  promptSection: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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