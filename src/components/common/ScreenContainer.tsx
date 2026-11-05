import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type Props = ScrollViewProps & { scroll?: boolean };

export function ScreenContainer({ children, scroll = true, contentContainerStyle, ...props }: Props) {
  const content = scroll ? <ScrollView keyboardShouldPersistTaps="handled" {...props} contentContainerStyle={[styles.content, contentContainerStyle]}>{children}</ScrollView> : children;
  return <SafeAreaView className="flex-1 bg-white" style={styles.safe}><KeyboardAvoidingView className="flex-1" style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{content}</KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.white }, flex: { flex: 1 }, content: { flexGrow: 1, padding: spacing[6] } });

