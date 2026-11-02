import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Surface, TextInput } from "react-native-paper";

import { useNotes } from "../context/NotesContext";

export default function AddNoteScreen() {
  const navigation = useNavigation();
  const { addNote, error } = useNotes();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    const ok = await addNote(text);
    setSaving(false);
    if (ok) navigation.goBack();
  };

  return (
    <Surface style={styles.container}>
      <TextInput
        label="Note"
        accessibilityLabel="Note"
        value={text}
        onChangeText={setText}
        autoFocus
        multiline
        mode="outlined"
      />
      {error && <HelperText type="error">{error}</HelperText>}
      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving || !text.trim()}
        style={styles.button}
      >
        Save
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    marginTop: 16,
  },
});
