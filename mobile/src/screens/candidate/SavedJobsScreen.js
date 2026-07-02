import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import JobCard from "../../components/JobCard";
import { EmptyState } from "../../components/Common";
import { useSavedJobs } from "../../context/SavedJobsContext";
import { useLang } from "../../i18n/LanguageContext";
import { spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function SavedJobsScreen({ navigation }) {
  const { savedList } = useSavedJobs();
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("savedJobs")}</Text>
        <Text style={styles.headerSub}>
          {savedList.length} {savedList.length === 1 ? "job" : "jobs"}
        </Text>
      </View>

      <FlatList
        data={savedList}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() =>
              navigation.navigate("Jobs", {
                screen: "JobDetail",
                params: { jobId: item._id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={t("noSavedJobs")}
            subtitle={t("noSavedJobsSub")}
          />
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.lg, flexGrow: 1 },
});
