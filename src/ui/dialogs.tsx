import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';

import { colors } from '@/src/core/theme/colors';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  hint?: string;
  confirmText?: string;
}

type DialogValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogValue | null>(null);

type ActiveDialog =
  | { type: 'confirm'; options: ConfirmOptions }
  | { type: 'prompt'; options: PromptOptions };

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [input, setInput] = useState('');
  const resolver = useRef<((value: boolean | string | null) => void) | null>(null);

  const close = useCallback((value: boolean | string | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setActive(null);
    setInput('');
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = (value) => resolve(value === true);
      setInput('');
      setActive({ type: 'confirm', options });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolver.current = (value) => resolve(typeof value === 'string' ? value : null);
      setInput('');
      setActive({ type: 'prompt', options });
    });
  }, []);

  const value = { confirm, prompt };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Portal>
        <Dialog
          visible={!!active}
          onDismiss={() => close(active?.type === 'confirm' ? false : null)}
          style={styles.dialog}
        >
          {active ? (
            <>
              <Dialog.Title style={styles.title}>{active.options.title}</Dialog.Title>
              {active.type === 'confirm' ? (
                <Dialog.Content>
                  <Text style={styles.message}>{active.options.message}</Text>
                </Dialog.Content>
              ) : (
                <Dialog.Content>
                  <TextInput
                    mode="outlined"
                    autoFocus
                    value={input}
                    onChangeText={setInput}
                    placeholder={active.options.hint}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={{ backgroundColor: colors.inputFill }}
                  />
                </Dialog.Content>
              )}
              <Dialog.Actions>
                <Button
                  onPress={() => close(active.type === 'confirm' ? false : null)}
                  textColor={colors.muted}
                >
                  {active.type === 'confirm'
                    ? (active.options.cancelText ?? 'No')
                    : 'Cancelar'}
                </Button>
                <Button
                  onPress={() =>
                    close(
                      active.type === 'confirm'
                        ? true
                        : input.trim() || null,
                    )
                  }
                  textColor={
                    active.type === 'confirm' && active.options.danger
                      ? colors.danger
                      : colors.primary
                  }
                >
                  {active.options.confirmText ??
                    (active.type === 'confirm' ? 'Sí' : 'Agregar')}
                </Button>
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>
      </Portal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogValue {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used inside DialogProvider');
  return context;
}

const styles = StyleSheet.create({
  dialog: { backgroundColor: colors.white, borderRadius: 26 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
});
