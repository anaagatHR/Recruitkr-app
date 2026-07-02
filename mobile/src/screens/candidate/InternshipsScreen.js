import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import JobCard from "../../components/JobCard";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import { EmptyState, ErrorState } from "../../components/Common";
import { jobsApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const keyExtractor = (item) => item._id;

/**
 * A focused, simple internships-only list. Same job cards as the main screen,
 * but filtered to jobType=internship and stripped of the busy home content so
 * candidates who specifically want internships aren't confused.
 */
export default function InternshipsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { jobType: "internship" };
      if (search.trim()) params.search = search.trim();
      const res = await jobsApi.list(params);
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
      setError(false);
    } catch (e) {
      setJobs([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  // Refetch when the screen gains focus, and debounce search typing.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const tmr = setTimeout(load, 300);
      return () => clearTimeout(tmr);
    }, [load])
  );

  const goToDetail = useCallback(
    (jobId) => navigation.navigate("JobDetail", { jobId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.itemWrap}>
        <JobCard job={item} index={index} onPress={() => goToDetail(item._id)} />
      </View>
    ),
    [styles.itemWrap, goToDetail]
  );

  const Header = (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={22} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Internships</Text>
          <Text style={styles.heroSub}>Learn, grow and earn — find internships near you.</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Search internships…"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {!loading && !error && (
        <Text style={styles.count}>{total} internship{total !== 1 ? "s" : ""} available</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={loading ? [] : jobs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={9}
        removeClippedSubviews
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.itemWrap}>
              {[0, 1, 2].map((i) => <JobCardSkeleton key={i} />)}
            </View>
          ) : error ? (
            <View style={styles.itemWrap}>
              <ErrorState onRetry={() => { setLoading(true); load(); }} />
            </View>
          ) : (
            <View style={styles.itemWrap}>
              <EmptyState icon="school-outline" title="No internships yet" subtitle="Check back soon — new internships are added regularly." />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  itemWrap: { marginBottom: 0 },
  hero: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg,
  },
  heroIcon: {
    width: 46, height: 46, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, height: 50, borderRadius: radius.md, marginTop: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  count: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.xs },
});
