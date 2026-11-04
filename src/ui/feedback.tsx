import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar } from 'react-native-paper';

import { getErrorMessage } from '@/src/core/roble/errors';
import { colors } from '@/src/core/theme/colors';

type FeedbackValue = {
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, error: unknown) => void;
};

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [snack, setSnack] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  const showSuccess = useCallback((title: string, message?: string) => {
    setSnack({ message: message ? `${title}: ${message}` : title, error: false });
  }, []);

  const showError = useCallback((title: string, error: unknown) => {
    setSnack({ message: `${title}: ${getErrorMessage(error)}`, error: true });
  }, []);

  const value = useMemo(() => ({ showSuccess, showError }), [showSuccess, showError]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={3500}
        style={{
          backgroundColor: snack?.error ? colors.red : colors.green,
          marginBottom: 16,
        }}
      >
        {snack?.message ?? ''}
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider');
  return context;
}
