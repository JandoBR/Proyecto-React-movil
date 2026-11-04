import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DIProvider } from "./src/core/di/DIProvider";
import { colors } from "./src/core/theme/colors";
import { paperTheme } from "./src/core/theme/theme";
import { AuthProvider, useAuth } from "./src/features/auth/AuthContext";
import SplashScreenView from "./src/features/auth/screens/SplashScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { DialogProvider } from "./src/ui/dialogs";
import { FeedbackProvider } from "./src/ui/feedback";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

SplashScreen.preventAutoHideAsync();
if (!isExpoGo) {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.white,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.danger,
  },
};

function AppContent() {
  const { status } = useAuth();
  const [brandingDone, setBrandingDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBrandingDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (status === "restoring" || !brandingDone) {
    return <SplashScreenView />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(MaterialCommunityIcons.font);
      } catch (error) {
        console.warn(error);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) SplashScreen.hide();
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DIProvider>
          <PaperProvider theme={paperTheme}>
            <StatusBar style="dark" />
            <FeedbackProvider>
              <DialogProvider>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </DialogProvider>
            </FeedbackProvider>
          </PaperProvider>
        </DIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
