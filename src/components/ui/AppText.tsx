import { Text, type TextProps } from 'react-native';
import { colors, typography } from '@/theme';

export type AppTextVariant = keyof typeof typography;

type AppTextProps = TextProps & { variant?: AppTextVariant; color?: string };

export function AppText({ variant = 'body', color = colors.text, style, ...props }: AppTextProps) {
  return <Text {...props} style={[typography[variant], { color }, style]} />;
}

