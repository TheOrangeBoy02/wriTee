import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '@/constants/Colors';

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  return (
    <View style={styles.header}>
      {title ? (
        <Text style={styles.title}>{title}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.background.main,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.text.dark,
  },
  logo: {
    display: 'none', // Hide old text logo
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 40,
  },

});