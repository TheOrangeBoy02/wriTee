import React from 'react';
import { View, Modal, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AccessibleButton } from './AccessibleButton';
import { Text } from 'react-native';
import Colors from '../constants/Colors';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  visible,
  title,
  onSave,
  onDiscard,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.buttonContainer}>
            <AccessibleButton
              onPress={onSave}
              style={{...styles.button, ...styles.saveButton}}
              accessibilityLabel="Save changes"
              title="Save"
            />
            <AccessibleButton
              onPress={onDiscard}
              style={{...styles.button, ...styles.discardButton}}
              accessibilityLabel="Discard changes"
              title="Discard"
            />
            <AccessibleButton
              onPress={onCancel}
              style={{...styles.button, ...styles.cancelButton}}
              accessibilityLabel="Cancel and stay on current screen"
              title="Cancel"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
  } as ViewStyle,
  saveButton: {
    backgroundColor: Colors.primary.main,
  } as ViewStyle,
  discardButton: {
    backgroundColor: Colors.error?.main || '#FF3B30',
  } as ViewStyle,
  cancelButton: {
    backgroundColor: Colors.secondary.main,
  } as ViewStyle,
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,
});