import { Redirect } from 'expo-router';

// Redirect any unknown routes to the home tab
export default function NotFoundScreen() {
  return <Redirect href="/(tabs)/home" />;
}
