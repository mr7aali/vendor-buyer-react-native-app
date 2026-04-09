import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
};

export function EmptyState({
  message,
  iconName = "file-tray-outline",
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={30} color="#278687" />
      </View>
      <Text style={styles.message}>{message}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 220,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EAF6F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#213036",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7B83",
    textAlign: "center",
    maxWidth: 280,
  },
});
