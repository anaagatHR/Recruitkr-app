import React, { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

/**
 * A lightweight themed dropdown: a tappable field that opens a modal list.
 * Props: label, value, onValueChange, items (string[]), placeholder, searchable
 */
export default function Dropdown({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = "Select...",
  searchable = false,
  style,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = searchable && query
    ? items.filter((i) => i.toLowerCase().includes(query.toLowerCase()))
    : items;

  function choose(item) {
    onValueChange?.(item);
    setOpen(false);
    setQuery("");
  }

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.field} activeOpacity={0.8} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{label || "Select"}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor={colors.textLight}
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(i) => i}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity style={styles.option} onPress={() => choose(item)}>
                    <Text style={[styles.optionText, selected && styles.optionSelected]}>{item}</Text>
                    {selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: spacing.xs + 2 },
  field: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  fieldText: { fontSize: 15, color: colors.text, flex: 1 },
  placeholder: { color: colors.textLight },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md,
    height: 44, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  optionText: { fontSize: 15, color: colors.text },
  optionSelected: { color: colors.primary, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.textMuted, padding: spacing.lg },
});
