import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Animated } from 'react-native';
import Colors from '@/constants/Colors';

interface UnsavedChangesDialogProps {
  visible: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function UnsavedChangesDialog({
  visible,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Error saving:', error);
      // Keep dialog open if save fails
      setIsSaving(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Unsaved Journal Entry</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.discardButton]}
              onPress={onDiscard}
              disabled={isSaving}
            >
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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
  } as any,
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  } as any,
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text.dark,
  } as any,
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as any,
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  } as any,
  saveButton: {
    backgroundColor: Colors.primary.main,
  } as any,
  discardButton: {
    backgroundColor: Colors.background || '#FFEBEB',
    color: Colors.text.dark
  } as any,
  cancelButton: {
    backgroundColor: Colors.background.main,
  } as any,
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  } as any,
  cancelText: {
    color: 'red',
    textAlign: 'center',
    fontWeight: '600',
  } as any,
  discardText: {
    color: 'black',
    textAlign: 'center',
    fontWeight: '600',
  } as any,
});