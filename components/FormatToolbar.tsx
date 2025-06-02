import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type FormatToolbarProps = {
  onFormat: (formatType: string) => void;
};

export default function FormatToolbar({ onFormat }: FormatToolbarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('bold')}
      >
        <Bold size={18} color={Colors.text.dark} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('italic')}
      >
        <Italic size={18} color={Colors.text.dark} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('underline')}
      >
        <Underline size={18} color={Colors.text.dark} />
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('alignLeft')}
      >
        <AlignLeft size={18} color={Colors.text.dark} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('alignCenter')}
      >
        <AlignCenter size={18} color={Colors.text.dark} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton}
        onPress={() => onFormat('alignRight')}
      >
        <AlignRight size={18} color={Colors.text.dark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background.light,
    borderRadius: 8,
    padding: 4,
    marginVertical: 12,
  },
  toolButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.neutral.border,
    marginHorizontal: 8,
  },
});