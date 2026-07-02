import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState, ErrorState } from "../../components/Common";
import { jobsApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function MyJobsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { jobs } = await jobsApi.mine();
      setJobs(jobs);
      setError(false);
    } catch (e) {
      setJobs([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  function confirmDelete(job) {
    Alert.alert("Delete job", `Delete "${job.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await jobsApi.remove(job._id);
            load();
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Job Posts</Text>
          <Text style={styles.headerSub}>{jobs.length} active posting{jobs.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("PostJob")}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {!loading && jobs.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{jobs.reduce((s, j) => s + (j.applicantCount || 0), 0)}</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
        </View>
      )}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>{item.location} • {item.category}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("PostJob", { jobId: item._id })} style={styles.delBtn}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.delBtn}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.applicantsBtn}
                onPress={() => navigation.navigate("Applicants", { jobId: item._id, jobTitle: item.title })}
              >
                <Ionicons name="people" size={18} color={colors.primary} />
                <Text style={styles.applicantsText}>
                  {item.applicantCount} applicant{item.applicantCount !== 1 ? "s" : ""}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState
                icon="briefcase-outline"
                title="No jobs posted yet"
                subtitle="Tap + to post your first job."
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
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderRadius: radius.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  addBtn: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  delBtn: { padding: 4 },
  applicantsBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md,
    backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md,
  },
  applicantsText: { flex: 1, color: colors.primary, fontWeight: "700" },
});
