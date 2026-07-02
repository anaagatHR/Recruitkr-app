import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState, ErrorState, StatusBadge } from "../../components/Common";
import { applicationsApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function MyApplicationsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { applications } = await applicationsApi.mine();
      setApps(applications);
      setError(false);
    } catch (e) {
      setApps([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>{apps.length} application{apps.length !== 1 ? "s" : ""}</Text>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const jobId = item.job?._id || item.job;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                disabled={!jobId}
                onPress={() => jobId && navigation.navigate("Jobs", { screen: "JobDetail", params: { jobId } })}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{item.job?.title || "Job removed"}</Text>
                    <Text style={styles.company}>{item.job?.company}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.job?.location || "-"}</Text>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                  <Text style={styles.metaText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="No applications yet"
                subtitle="Apply to jobs and track their status here."
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
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  jobTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md },
  metaText: { fontSize: 13, color: colors.textMuted },
});
