import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { CameroonRouteMapContent } from './CameroonRouteMapContent';

export function CameroonRouteMap() {
  return <CameroonRouteMapContent renderMap={(url) => <WebView source={{ uri: url }} style={styles.map} javaScriptEnabled domStorageEnabled />} />;
}
const styles = StyleSheet.create({ map: { flex: 1 } });

