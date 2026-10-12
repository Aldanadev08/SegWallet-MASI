import React from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT } from "../theme/colors";

/**
 * Modal reutilizable de confirmación.
 * Props:
 *  - visible, onCancel, onConfirm
 *  - title, message
 *  - icon (nombre Ionicons)
 *  - type: "danger" | "warning" | "info" | "success"
 *  - confirmText, cancelText
 */
export default function ConfirmModal({
  visible,
  onCancel,
  onConfirm,
  title = "Confirmar",
  message = "",
  icon = "help-circle",
  type = "info",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}) {
  const styleMap = {
    danger:  { color: COLORS.danger,  bg: "rgba(249, 97, 103, 0.15)",  gradient: ["#F96167", "#C73339"] },
    warning: { color: COLORS.warning, bg: "rgba(255, 153, 0, 0.15)",   gradient: ["#FF9900", "#C77000"] },
    info:    { color: COLORS.secondary, bg: "rgba(74, 144, 217, 0.15)",gradient: ["#4A90D9", "#2A6FB0"] },
    success: { color: COLORS.accent,  bg: "rgba(0, 212, 170, 0.15)",   gradient: COLORS.gradientAccent },
  };
  const s = styleMap[type] || styleMap.info;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: s.bg, borderColor: s.color }]}>
            <Ionicons name={icon} size={34} color={s.color} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Actions */}
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, !onCancel && { flex: 1 }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmText}>{confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textLight,
    fontSize: FONT.xl,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: FONT.md,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: FONT.md,
    fontWeight: "800",
  },
});