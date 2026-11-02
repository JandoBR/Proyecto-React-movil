import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const data = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    title: `Elemento ${i + 1}`,
  }));
  return (
    <SafeAreaView>
      <View style={{ flexDirection: "row", padding: 9, paddingBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>Bienvenido</Text>
          <Text style={{ fontSize: 22, color: "grey" }}>Uninorte</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="black">
          {" "}
        </Ionicons>
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                marginVertical: 8,
                marginHorizontal: 8,
                borderRadius: 8,
                padding: 16,
                backgroundColor: "#dbeafe",
              }}
            >
              <Text>{item.title}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
