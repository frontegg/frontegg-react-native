import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'danger' | 'outline';

export type FronteggButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const COLORS = {
  background: '#F9FAFC',
  text: '#373739',
  primary: '#4D7DFA',
  primaryText: '#FFFFFF',
  gray: '#E6E8EC',
  danger: '#F44336',
};

export default function FronteggButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: FronteggButtonProps) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  const backgroundColor = disabled
    ? COLORS.gray
    : isOutline
    ? '#FFFFFF'
    : isDanger
    ? COLORS.danger
    : COLORS.primary;

  const borderColor = disabled
    ? COLORS.gray
    : isOutline
    ? COLORS.gray
    : 'transparent';

  const color = disabled
    ? COLORS.text
    : isOutline
    ? COLORS.text
    : COLORS.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: 24,
          paddingVertical: 9,
          borderRadius: 8,
          backgroundColor,
          borderWidth: isOutline ? 1 : 0,
          borderColor,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          alignSelf: 'stretch',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.01,
  },
});
