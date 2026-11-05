module.exports = ({ config }) => {
  const mapsPlugin = ['react-native-maps', {
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
  }];
  return {
    ...config,
    ios: { ...config.ios, bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.kaziride.passenger' },
    android: { ...config.android, package: config.android?.package ?? 'com.kaziride.passenger' },
    plugins: [...(config.plugins ?? []), mapsPlugin],
  };
};
