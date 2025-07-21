import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Keyboard } from 'react-native';

interface KeyboardDismissButtonProps {
  style?: any;
  textStyle?: any;
}

const KeyboardDismissButton: React.FC<KeyboardDismissButtonProps> = ({ 
  style, 
  textStyle 
}) => {
  return (
    <TouchableOpacity
      style={[styles.keyboardDismissButton, style]}
      onPress={Keyboard.dismiss}
      accessibilityLabel="Dismiss keyboard"
    >
      <Text style={[styles.keyboardDismissText, textStyle]}>⌨️</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  keyboardDismissButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  keyboardDismissText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default KeyboardDismissButton; 