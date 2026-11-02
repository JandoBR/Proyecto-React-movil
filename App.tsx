import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { DIProvider } from "./src/core/di/DIProvider";
import { NotesProvider } from "./src/features/notes/presentation/context/NotesContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { darkTheme, lightTheme } from "./src/theme/theme";

// Expo Go doesn't support customizing the splash screen; only apply options in development/production builds.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Keep the native splash screen visible until the app has finished loading.
SplashScreen.preventAutoHideAsync();
if (!isExpoGo) {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const scheme = useColorScheme();
  const theme = lightTheme;

  useEffect(() => {
    async function prepare() {
      try {
        // Load anything the first screen needs here (fonts, saved preferences, session...).
        // Paper draws its icons with MaterialCommunityIcons, so preload that font.
        await Font.loadAsync(MaterialCommunityIcons.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (__DEV__) console.log("Current theme:", scheme);

  const navigationTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      primary: theme.colors.primary,
      notification: theme.colors.error,
    },
  };

  return (
    <DIProvider>
      <NotesProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </NotesProvider>
    </DIProvider>
  );
}
