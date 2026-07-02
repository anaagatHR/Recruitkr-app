import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../../components/Common";
import { useNotifications } from "../../context/NotificationsContext";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const { items, loading, refresh, markAllSeen } = useNotifications();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Mark all seen when the screen opens
  useFocusEffect(
    useCallback(() => {
      refresh();
      const t = setTimeout(markAllSeen, 600);
      return () => clearTimeout(t);
    }, [refresh, markAllSeen])
  );

  const colorFor = (c) => colors[c] || colors.primary;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colorFor(item.color) + "1A" }]}>
              <Ionicons name={item.icon} size={20} color={colorFor(item.color)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.time)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            subtitle="Updates about your applications will show up here."
          />
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  topTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    flexDirection: "row", gap: spacing.md, alignItems: "flex-start",
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 4 },
});
