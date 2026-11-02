import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Checkbox, FAB, HelperText, IconButton, List, Surface, Text } from "react-native-paper";

import { useNotes } from "../context/NotesContext";

export default function NoteListScreen() {
  const navigation = useNavigation();
  const { notes, loading, error, refresh, toggleNote, deleteNote } = useNotes();

  if (loading) {
    return (
      <Surface style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      {error && <HelperText type="error">{error}</HelperText>}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        refreshing={false}
        contentContainerStyle={notes.length === 0 && styles.center}
        ListEmptyComponent={<Text>No notes yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <List.Item
            title={item.text}
            titleStyle={item.done && styles.done}
            left={() => (
              <View style={styles.side}>
                <Checkbox.Android
                  status={item.done ? "checked" : "unchecked"}
                  onPress={() => toggleNote(item.id)}
                  accessibilityLabel={`Mark "${item.text}" as ${item.done ? "not done" : "done"}`}
                />
              </View>
            )}
            right={() => (
              <View style={styles.side}>
                <IconButton
                  icon="delete-outline"
                  onPress={() => deleteNote(item.id)}
                  accessibilityLabel={`Delete "${item.text}"`}
                />
              </View>
            )}
          />
        )}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("AddNote")}
        accessibilityLabel="Add note"
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  side: {
    justifyContent: "center",
  },
  done: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
