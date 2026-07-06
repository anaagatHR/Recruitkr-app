import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState } from "../../components/Common";
import Avatar from "../../components/Avatar";
import { messagesApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";
import * as haptics from "../../utils/haptics";

/**
 * Real 1-on-1 chat between a candidate and an employer.
 *
 * Route params:
 *   userId    (required) — the other participant's id
 *   name      (optional) — their display name, for the header before load
 *   photoUrl  (optional)
 *   headline  (optional)
 *   jobId     (optional) — ties a NEW conversation to a job for context
 *
 * New messages are picked up by lightweight polling every 5s while the screen
 * is focused (no websocket infra needed for this app's scale).
 */
export default function ChatScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listRef = useRef(null);

  const { userId, jobId } = route.params || {};
  const [other, setOther] = useState({
    _id: userId,
    name: route.params?.name,
    photoUrl: route.params?.photoUrl,
    headline: route.params?.headline,
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const load = useCallback(
    async ({ silent } = {}) => {
      try {
        const { otherUser, messages } = await messagesApi.with(userId);
        if (otherUser) setOther(otherUser);
        setMessages(messages);
      } catch (e) {
        // On a silent poll failure, keep what we have.
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId]
  );

  // Initial load + poll every 5s while focused.
  useEffect(() => {
    load();
    const id = setInterval(() => load({ silent: true }), 5000);
    return () => clearInterval(id);
  }, [load]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    haptics.tap();
    setInput("");
    setSending(true);

    // Optimistic bubble so the UI feels instant.
    const temp = { _id: `temp-${text.length}-${messages.length}`, text, sentByMe: true, pending: true };
    setMessages((prev) => [...prev, temp]);
    scrollToEnd();

    try {
      await messagesApi.send(userId, text, jobId);
      await load({ silent: true }); // replace temp with the real, saved message
      haptics.success();
    } catch (e) {
      // Mark the optimistic bubble as failed.
      setMessages((prev) =>
        prev.map((m) => (m._id === temp._id ? { ...m, failed: true, pending: false } : m))
      );
      haptics.error();
    } finally {
      setSending(false);
      scrollToEnd();
    }
  }, [input, sending, userId, jobId, messages.length, load, scrollToEnd]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Avatar uri={other.photoUrl} name={other.name} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>{other.name || "Chat"}</Text>
          {other.headline ? (
            <Text style={styles.topSub} numberOfLines={1}>{other.headline}</Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m._id)}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => <Bubble item={item} styles={styles} colors={colors} />}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubbles-outline"
                title="No messages yet"
                subtitle="Say hello to start the conversation."
              />
            }
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Type a message…"
              placeholderTextColor={colors.textLight}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!input.trim() || sending}
            >
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Bubble({ item, styles, colors }) {
  const mine = item.sentByMe;
  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
      {mine && (item.pending || item.failed) ? (
        <Ionicons
          name={item.failed ? "alert-circle" : "time-outline"}
          size={12}
          color={item.failed ? colors.danger : colors.white}
          style={{ marginTop: 2, alignSelf: "flex-end" }}
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  topSub: { fontSize: 12, color: colors.textMuted },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubble: {
    maxWidth: "80%", paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    alignSelf: "flex-start", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: radius.sm,
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44,
    backgroundColor: colors.background, borderRadius: radius.lg,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.textLight },
});
