import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface AccessibleTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: any;
  errorStyle?: any;
  accessibilityHint?: string;
}

export function AccessibleTextInput({
  label,
  error,
  required = false,
  containerStyle,
  labelStyle,
  errorStyle,
  accessibilityHint,
  style,
  ...textInputProps
}: AccessibleTextInputProps) {
  const inputId = React.useId();
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          nativeID={labelId}
          style={[styles.label, labelStyle]}
          accessible={true}
          accessibilityRole="text"
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        accessible={true}
        accessibilityLabel={label ? `${label}${required ? ' (required)' : ''}` : undefined}
        accessibilityHint={accessibilityHint || (error ? `Error: ${error}` : undefined)}
        placeholderTextColor={Colors.neutral.main}
      />
      
      {error && (
        <Text
          nativeID={errorId}
          style={[styles.error, errorStyle]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  required: {
    color: Colors.error.main,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.dark,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.error.main,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error.main,
    marginTop: 4,
  },
});