import { NavigatorScreenParams } from "@react-navigation/native";

// Screens inside the bottom tabs.
export type TabParamList = {
  Home: undefined;
  Notes: undefined;
};

// Screens in the root stack. Add params here, e.g. EditNote: { id: string }.
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  AddNote: undefined;
};

// Makes useNavigation() / navigation.navigate() type-checked across the app.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
