import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState, ErrorState } from "../../components/Common";
import { companiesApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

export default function CompaniesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { companies } = await companiesApi.list();
      setCompanies(companies);
      setError(false);
    } catch (e) {
      setCompanies([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Companies</Text>
        <Text style={styles.headerSub}>{companies.length} hiring now</Text>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(c) => c.name}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("CompanyDetail", { name: item.name })}
            >
              <View style={styles.logo}>
                <Text style={styles.logoText}>{(item.name || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.jobCount} open job{item.jobCount !== 1 ? "s" : ""}
                  {item.categories?.length ? ` • ${item.categories.slice(0, 2).join(", ")}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState icon="business-outline" title="No companies yet" subtitle="Companies with active jobs will appear here." />
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
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  logo: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 20 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
