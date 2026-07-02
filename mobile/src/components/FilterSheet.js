import React, { useMemo } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const SALARY_OPTS = [
  { label: "Any", value: "" },
  { label: "₹3L+", value: "300000" },
  { label: "₹5L+", value: "500000" },
  { label: "₹8L+", value: "800000" },
  { label: "₹12L+", value: "1200000" },
];
const DATE_OPTS = [
  { label: "Any time", value: "" },
  { label: "Last 24h", value: "1" },
  { label: "Last 3 days", value: "3" },
  { label: "Last week", value: "7" },
  { label: "Last month", value: "30" },
];
const SORT_OPTS = [
  { label: "Newest", value: "newest" },
  { label: "Highest salary", value: "salary" },
  { label: "Oldest", value: "oldest" },
];

export default function FilterSheet({ visible, onClose, filters, onApply }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [local, setLocal] = React.useState(filters);

  React.useEffect(() => { setLocal(filters); }, [visible]);

  function Row({ title, options, field }) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.chipWrap}>
          {options.map((o) => {
            const active = (local[field] || (field === "sort" ? "newest" : "")) === o.value;
            return (
              <TouchableOpacity
                key={o.value || "any"}
                onPress={() => setLocal((s) => ({ ...s, [field]: o.value }))}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <Row title="Minimum salary" options={SALARY_OPTS} field="minSalary" />
            <Row title="Date posted" options={DATE_OPTS} field="postedWithin" />
            <Row title="Sort by" options={SORT_OPTS} field="sort" />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setLocal({ minSalary: "", postedWithin: "", sort: "newest" })}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply(local); onClose(); }}>
              <Text style={styles.applyText}>Show results</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.background,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.white },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  clearBtn: {
    flex: 1, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.border,
  },
  clearText: { color: colors.text, fontWeight: "700", fontSize: 15 },
  applyBtn: {
    flex: 2, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primary,
  },
  applyText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
