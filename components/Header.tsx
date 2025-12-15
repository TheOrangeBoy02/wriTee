import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type HeaderProps = {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export default function Header({ title, showBackButton, onBackPress }: HeaderProps) {
  return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ArrowLeft size={24} color={Colors.text.dark} />
        </TouchableOpacity>
      )}
      {title ? (
        <Text style={[styles.title, showBackButton && styles.titleWithBack]}>{title}</Text>
      ) : (
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/writee-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.background.main,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.text.dark,
  },
  titleWithBack: {
    flex: 1,
  },
  logo: {
    display: 'none', // Hide old text logo
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 40,
  },
});