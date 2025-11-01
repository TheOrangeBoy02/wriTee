import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

export default function TimePickerModal({ visible, initialTime, onConfirm, onCancel }: TimePickerModalProps) {
  const { colors } = useTheme();
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  useEffect(() => {
    // Parse the initial time string (format: "HH:MM")
    const [hours, minutes] = initialTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    setSelectedTime(date);
  }, [initialTime, visible]);

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, the picker closes automatically
      if (event.type === 'set' && date) {
        const formattedTime = formatTime(date);
        onConfirm(formattedTime);
      } else {
        onCancel();
      }
    } else {
      // On iOS, update the selected time
      if (date) {
        setSelectedTime(date);
      }
    }
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleConfirm = () => {
    const formattedTime = formatTime(selectedTime);
    onConfirm(formattedTime);
  };

  // On Android, the picker is displayed directly without a modal wrapper
  if (Platform.OS === 'android' && visible) {
    return (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={handleTimeChange}
      />
    );
  }

  // On iOS, we wrap the picker in a modal
  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onCancel}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCancel}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text.dark }]}>Select Time</Text>
            </View>

            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              textColor={colors.text.dark}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.background.light }]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: colors.text.dark }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary.main }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
