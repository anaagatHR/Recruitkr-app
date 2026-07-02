import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import JobCard from "../../components/JobCard";
import { Loading, EmptyState, ErrorState } from "../../components/Common";
import { companiesApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

export default function CompanyDetailScreen({ route, navigation }) {
  const { name } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { jobs } = await companiesApi.jobs(name);
      setJobs(jobs);
      setError(false);
    } catch (e) {
      setJobs([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [name]);

  useEffect(() => { load(); }, [load]);

  const Header = (
    <View style={styles.companyHead}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>{(name || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.sub}>{jobs.length} open position{jobs.length !== 1 ? "s" : ""}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>Company</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={Header}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} tintColor={colors.primary} />}
          renderItem={({ item, index }) => (
            <JobCard job={item} index={index} onPress={() => navigation.navigate("JobDetail", { jobId: item._id })} />
          )}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState icon="briefcase-outline" title="No open jobs" />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  list: { padding: spacing.lg },
  companyHead: { alignItems: "center", marginBottom: spacing.lg },
  logo: {
    width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 30 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.md, textAlign: "center" },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
