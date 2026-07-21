import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import type { RootStackParamList } from "./src/navigation";
import { colors } from "./src/theme";
import HomeScreen from "./src/screens/HomeScreen";
import ExamDetailScreen from "./src/screens/ExamDetailScreen";
import CameraScreen from "./src/screens/CameraScreen";
import ProcessingScreen from "./src/screens/ProcessingScreen";
import ResultScreen from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const onLayout = useCallback(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                headerTintColor: colors.primary,
                headerTitleStyle: {
                  fontWeight: "700",
                  color: colors.text,
                },
                contentStyle: { backgroundColor: colors.bg },
                animation: "default",
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ExamDetail"
                component={ExamDetailScreen}
                options={{ title: "Exam" }}
              />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ title: "Capture", headerTransparent: true, headerTintColor: "#fff" }}
              />
              <Stack.Screen
                name="Processing"
                component={ProcessingScreen}
                options={{ title: "Checking", headerBackVisible: false }}
              />
              <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Result" }} />
              <Stack.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
