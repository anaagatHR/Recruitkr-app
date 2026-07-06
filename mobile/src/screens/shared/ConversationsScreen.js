import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Loading, EmptyState, ErrorState } from "../../components/Common";
import Avatar from "../../components/Avatar";
import { messagesApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";
import { postedAgo } from "../../utils/time";

/**
 * Inbox: one row per conversation. Shared by candidates and employers — the API
 * returns the correct "other side" for whoever is logged in. The AI assistant
 * lives in its own tab now (candidate navigator), so this screen is messages-only.
 */
export default function ConversationsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { conversations } = await messagesApi.conversations();
      setItems(conversations);
      setError(false);
    } catch (e) {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time the tab is focused (so unread badges stay fresh).
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const openChat = (conv) => {
    navigation.navigate("Chat", {
      userId: conv.otherUser._id,
      name: conv.otherUser.name,
      photoUrl: conv.otherUser.photoUrl,
      headline: conv.otherUser.headline,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSub}>
          {items.length} conversation{items.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.conversationId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => openChat(item)}>
              <Avatar uri={item.otherUser.photoUrl} name={item.otherUser.name} size={52} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.otherUser.name}</Text>
                  <Text style={styles.time}>{postedAgo(item.lastAt)}</Text>
                </View>
                {item.jobTitle ? (
                  <Text style={styles.job} numberOfLines={1}>Re: {item.jobTitle}</Text>
                ) : null}
                <View style={styles.rowBottom}>
                  <Text
                    style={[styles.preview, item.unread > 0 && styles.previewUnread]}
                    numberOfLines={1}
                  >
                    {item.sentByMe ? "You: " : ""}{item.lastMessage}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread > 9 ? "9+" : item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="No messages yet"
                subtitle="When you chat with a company or candidate, it will show up here."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  time: { fontSize: 12, color: colors.textLight },
  job: { fontSize: 12, color: colors.primary, marginTop: 1 },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  preview: { fontSize: 14, color: colors.textMuted, flex: 1 },
  previewUnread: { color: colors.text, fontWeight: "700" },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
});
