import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Catches render errors anywhere below it so a single bad screen shows a
 * friendly "try again" card instead of crashing the whole app to a red screen.
 * Class component because only class components can be error boundaries.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to a crash reporter (Sentry, etc.).
    if (__DEV__) console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color="#B54708" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 24, backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1A2330", marginTop: 16 },
  subtitle: { fontSize: 14, color: "#667085", marginTop: 8, textAlign: "center" },
  button: {
    marginTop: 24, paddingVertical: 12, paddingHorizontal: 28,
    backgroundColor: "#274B7F", borderRadius: 10,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
