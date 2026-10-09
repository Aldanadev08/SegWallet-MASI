import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { secureStore } from "../../utils/secureStore";
import { auth } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

const PIN_LENGTH = 6;
const STAGES = { CURRENT: "current", NEW: "new", CONFIRM: "confirm" };

export default function ChangePinScreen({ navigation }) {
  const [stage, setStage] = useState(STAGES.CURRENT);
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      const sp = await secureStore.getItem(`pin_${uid}`);
      setStoredPin(sp || "");
    })();
  }, []);

  const handleDigit = (d) => {
    if (pin.length < PIN_LENGTH) {
      const np = pin + d;
      setPin(np);
      if (np.length === PIN_LENGTH) setTimeout(() => processPin(np), 150);
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const processPin = async (fullPin) => {
    if (stage === STAGES.CURRENT) {
      if (fullPin !== storedPin) {
        Alert.alert("Error", "PIN actual incorrecto");
        setPin("");
        return;
      }
      setStage(STAGES.NEW);
      setPin("");
    } else if (stage === STAGES.NEW) {
      setNewPin(fullPin);
      setStage(STAGES.CONFIRM);
      setPin("");
    } else if (stage === STAGES.CONFIRM) {
      if (fullPin !== newPin) {
        Alert.alert("Error", "Los PINs no coinciden");
        setPin("");
        setNewPin("");
        setStage(STAGES.NEW);
        return;
      }
      await secureStore.setItem(`pin_${uid}`, fullPin);
      Alert.alert("✓ Listo", "PIN actualizado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  };

  const titles = {
    [STAGES.CURRENT]: "PIN actual",
    [STAGES.NEW]: "Nuevo PIN",
    [STAGES.CONFIRM]: "Confirma el nuevo PIN",
  };
  const subs = {
    [STAGES.CURRENT]: "Ingresa tu PIN de 6 dígitos",
    [STAGES.NEW]: "Elige un PIN de 6 dígitos",
    [STAGES.CONFIRM]: "Repite el PIN que acabas de ingresar",
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color={COLORS.textLight} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={36} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>{titles[stage]}</Text>
        <Text style={styles.subtitle}>{subs[stage]}</Text>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, stage !== STAGES.CURRENT && styles.progressDotDone]} />
          <View style={[styles.progressDot, stage === STAGES.CONFIRM && styles.progressDotDone]} />
          <View style={[styles.progressDot, false && styles.progressDotDone]} />
        </View>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[[1,2,3],[4,5,6],[7,8,9]].map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map(n => (
              <TouchableOpacity key={n} style={styles.key} onPress={() => handleDigit(String(n))} activeOpacity={0.6}>
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <View style={styles.key} />
          <TouchableOpacity style={styles.key} onPress={() => handleDigit("0")} activeOpacity={0.6}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleDelete} activeOpacity={0.6}>
            <Ionicons name="backspace-outline" size={26} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.xl,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute", top: 50, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border, zIndex: 10,
  },
  header: { alignItems: "center", marginTop: SPACING.xl },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    borderWidth: 2, borderColor: COLORS.accent,
    justifyContent: "center", alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONT.xxl, fontWeight: "800", color: COLORS.textLight, textAlign: "center" },
  subtitle: { fontSize: FONT.md, color: COLORS.textSecondary, marginTop: 6 },

  progressRow: { flexDirection: "row", gap: 8, marginTop: SPACING.lg },
  progressDot: { width: 30, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressDotDone: { backgroundColor: COLORS.accent },

  dots: {
    flexDirection: "row", gap: 14,
    marginTop: SPACING.xl, marginBottom: SPACING.xl,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    borderColor: COLORS.textMuted, backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  keypad: { width: "100%", maxWidth: 320, marginTop: "auto" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.md },
  key: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  keyText: { fontSize: 28, fontWeight: "600", color: COLORS.textLight },
}); 