import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { isSameDay, relativeDate } from '@/src/core/date-labels';
import { colors } from '@/src/core/theme/colors';
import { ChatRepository } from '@/src/features/workspace/data/ChatRepository';
import { WorkspaceRepository } from '@/src/features/workspace/data/WorkspaceRepository';
import { CHAT_MESSAGE_MAX_LENGTH, ChatMessage } from '@/src/features/workspace/domain/chat';
import { WorkspaceMember } from '@/src/features/workspace/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import { Avatar, CircleIconButton, EmptyState } from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectChat'>;

const POLL_INTERVAL_MS = 4000;

function timeLabel(date: Date | null): string {
  if (!date) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function ProjectChatScreen({ navigation, route }: Props) {
  const { projectId, projectTitle } = route.params;
  const di = useDI();
  const chat = useMemo(() => di.resolve<ChatRepository>(TOKENS.ChatRepo), [di]);
  const workspace = useMemo(
    () => di.resolve<WorkspaceRepository>(TOKENS.WorkspaceRepo),
    [di],
  );
  const { showError } = useFeedback();
  const currentUserId = chat.currentUserId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // Only the latest read may land: a slow poll must not hide a message just sent.
  const latestRead = useRef(0);

  const refresh = useCallback(async () => {
    const read = ++latestRead.current;
    try {
      const loaded = await chat.getMessages(projectId);
      if (read !== latestRead.current) return;
      setMessages(loaded);
      setLoadError(false);
    } catch {
      if (read === latestRead.current) setLoadError(true);
    } finally {
      if (read === latestRead.current) setLoading(false);
    }
  }, [chat, projectId]);

  useEffect(() => {
    refresh();
    workspace
      .getMembers(projectId)
      .then(setMembers)
      .catch(() => {});
  }, [refresh, workspace, projectId]);

  // No realtime: read again every few seconds while the chat is open.
  useEffect(() => {
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const avatars = useMemo(
    () => new Map(members.map((member) => [member.id, member.avatarUrl])),
    [members],
  );

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const sent = await chat.sendMessage(projectId, text);
      latestRead.current++; // Drop any poll that started before this message.
      setMessages((current) => [...current, sent]);
      setDraft('');
      refresh();
    } catch (error) {
      showError('No se pudo enviar el mensaje', error);
    } finally {
      setSending(false);
    }
  };

  // The list is inverted so it starts at the bottom: newest first.
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerSubtitle}>Chat del equipo</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {projectTitle}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : loadError && !messages.length ? (
          <View style={styles.center}>
            <EmptyState
              icon="alert-circle-outline"
              title="No se pudo cargar el chat"
              message="Revisa tu conexión e inténtalo de nuevo."
            />
            <Pressable onPress={refresh} style={{ marginTop: 12 }}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </View>
        ) : !messages.length ? (
          <View style={styles.center}>
            <EmptyState
              icon="chat-outline"
              title="Todavía no hay mensajes"
              message="Escribe el primero para empezar a coordinar con tu equipo."
            />
          </View>
        ) : (
          <FlatList
            inverted
            data={newestFirst}
            keyExtractor={(message) => message.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              // `index + 1` is the previous message in time (the list is reversed).
              const previous = newestFirst[index + 1];
              const newDay =
                !previous ||
                !item.sentAt ||
                !previous.sentAt ||
                !isSameDay(item.sentAt, previous.sentAt);
              const firstOfGroup =
                newDay || !previous || previous.senderId !== item.senderId;
              return (
                <>
                  {newDay && item.sentAt ? (
                    <Text style={styles.daySeparator}>{relativeDate(item.sentAt)}</Text>
                  ) : null}
                  <MessageBubble
                    message={item}
                    mine={item.senderId === currentUserId}
                    showSender={firstOfGroup}
                    avatarUrl={avatars.get(item.senderId)}
                  />
                </>
              );
            }}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            style={styles.input}
            testID="chat-input"
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || sending}
            accessibilityLabel="Enviar mensaje"
            testID="chat-send"
            style={[
              styles.sendButton,
              (!draft.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  mine,
  showSender,
  avatarUrl,
}: {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  avatarUrl?: string;
}) {
  return (
    <View
      style={[
        styles.row,
        mine ? styles.rowMine : styles.rowTheirs,
        showSender && { marginTop: 12 },
      ]}
    >
      {!mine ? (
        <View style={styles.avatarSlot}>
          {showSender ? <Avatar uri={avatarUrl} size={30} /> : null}
        </View>
      ) : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!mine && showSender ? (
          <Text style={styles.sender}>{message.senderName}</Text>
        ) : null}
        <Text style={[styles.text, mine && { color: colors.white }]}>{message.text}</Text>
        <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.8)' }]}>
          {timeLabel(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSubtitle: { fontSize: 13, color: colors.muted },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textSoft },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retry: { color: colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  daySeparator: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtle,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatarSlot: { width: 30, marginRight: 8 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.white, borderBottomLeftRadius: 6 },
  sender: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20, color: colors.text },
  time: { alignSelf: 'flex-end', marginTop: 2, fontSize: 11, color: colors.subtle },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 22,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputFill,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: { opacity: 0.45 },
});
