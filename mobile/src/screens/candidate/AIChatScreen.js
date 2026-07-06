import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../../components/Common";
import { aiApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import { spacing, radius } from "../../theme/colors";
import * as haptics from "../../utils/haptics";

const GREETING =
  "Hi! I'm your RecruitKR Assistant 👋\nMain aapki job search, resume, ya interview me help kar sakta hoon. Kuch bhi poochho!";

const SUGGESTIONS = [
  "Resume tips for a fresher",
  "How to prepare for an interview?",
  "Which skills are in demand?",
  "Help me write a cover note",
];

export default function AIChatScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const aiEnabled = useAIEnabled();
  const listRef = useRef(null);

  // messages: { role: "user"|"assistant", text }
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback(
    async (raw) => {
      const text = (raw ?? input).trim();
      if (!text || sending) return;
      haptics.tap();

      const userMsg = { role: "user", text };
      // Optimistically add the user's message; keep a copy for the API call.
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput("");
      setSending(true);
      scrollToEnd();

      try {
        // Send history WITHOUT the greeting (it's a UI-only intro).
        const apiHistory = nextHistory
          .filter((m, i) => !(i === 0 && m.role === "assistant" && m.text === GREETING))
          .map((m) => ({ role: m.role, text: m.text }));
        const { reply } = await aiApi.chat(apiHistory);
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        haptics.success();
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `⚠️ ${e.message || "Something went wrong. Please try again."}`, isError: true },
        ]);
        haptics.error();
      } finally {
        setSending(false);
        scrollToEnd();
      }
    },
    [input, messages, sending, scrollToEnd]
  );

  const showSuggestions = messages.length === 1 && !sending;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <View style={styles.titleWrap}>
          <View style={styles.botDot}>
            <Ionicons name="sparkles" size={14} color={colors.white} />
          </View>
          <Text style={styles.topTitle}>AI Assistant</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {!aiEnabled ? (
        <EmptyState
          icon="sparkles-outline"
          title="Assistant unavailable"
          subtitle="The AI assistant isn't configured on the server right now. Please try again later."
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => <Bubble item={item} styles={styles} />}
            ListFooterComponent={
              sending ? (
                <View style={[styles.bubble, styles.bubbleBot]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />

          {showSuggestions && (
            <View style={styles.suggestWrap}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => send(s)}>
                  <Text style={styles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything…"
              placeholderTextColor={colors.textLight}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              editable={!sending}
              onSubmitEditing={() => send()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={() => send()}
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

function Bubble({ item, styles }) {
  const isUser = item.role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, item.isError && styles.bubbleError]}>
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  botDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  bubble: {
    maxWidth: "82%", paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    alignSelf: "flex-end", backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleBot: {
    alignSelf: "flex-start", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: radius.sm,
  },
  bubbleError: { borderColor: colors.danger, backgroundColor: colors.danger + "14" },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTextUser: { color: colors.white },
  suggestWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  suggestChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12",
  },
  suggestText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
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
