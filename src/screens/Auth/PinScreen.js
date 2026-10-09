import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { secureStore } from "../../utils/secureStore";
import { authenticateBiometric, isBiometricAvailable } from "../../utils/biometrics";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { COLORS, SPACING, FONT } from "../../theme/colors";

const PIN_LENGTH = 6;

export default function PinScreen({ navigation }) {
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const [confirmingPin, setConfirmingPin] = useState(false);
  const [tempPin, setTempPin] = useState("");
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await secureStore.getItem(`pin_${auth.currentUser?.uid}`);
      if (existing) {
        setStoredPin(existing);
      } else {
        setIsSetup(true);
      }
      const bio = await isBiometricAvailable();
      setBioAvailable(bio);
    })();
  }, []);

  const handleDigit = (digit) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => processPin(newPin), 150);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const processPin = async (fullPin) => {
    if (isSetup && !confirmingPin) {
      setTempPin(fullPin);
      setConfirmingPin(true);
      setPin("");
    } else if (isSetup && confirmingPin) {
      if (fullPin === tempPin) {
        await secureStore.setItem(`pin_${auth.currentUser?.uid}`, fullPin);
        Alert.alert("Listo", "PIN creado correctamente");
        navigation.replace("Home");
      } else {
        Alert.alert("Error", "Los PINs no coinciden");
        setTempPin("");
        setConfirmingPin(false);
        setPin("");
      }
    } else {
      if (fullPin === storedPin) {
        navigation.replace("Home");
      } else {
        Alert.alert("Error", "PIN incorrecto");
        setPin("");
      }
    }
  };

  const handleBiometric = async () => {
    const ok = await authenticateBiometric("Desbloquea SegWallet");
    if (ok) navigation.replace("Home");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  const getTitle = () => {
    if (isSetup && !confirmingPin) return "Crea tu PIN";
    if (isSetup && confirmingPin) return "Confirma tu PIN";
    return "Ingresa tu PIN";
  };

  const getSubtitle = () => {
    if (isSetup && !confirmingPin) return "6 dígitos para proteger tu cuenta";
    if (isSetup && confirmingPin) return "Repite el PIN que acabas de ingresar";
    return "Bienvenido de vuelta";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />
      <View style={[styles.circle, styles.circle1]} />

      {/* Logout en top */}
      {!isSetup && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {/* Icon + title */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ].map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.key}
                onPress={() => handleDigit(String(n))}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          {bioAvailable && !isSetup ? (
            <TouchableOpacity style={styles.key} onPress={handleBiometric} activeOpacity={0.6}>
              <Ionicons name="finger-print" size={28} color={COLORS.accent} />
            </TouchableOpacity>
          ) : (
            <View style={styles.key} />
          )}
          <TouchableOpacity
            style={styles.key}
            onPress={() => handleDigit("0")}
            activeOpacity={0.6}
          >
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
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    alignItems: "center",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.08,
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: COLORS.accent,
  },

  logoutBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },

  header: { alignItems: "center", marginTop: SPACING.xl },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.xxl,
    fontWeight: "800",
    color: COLORS.textLight,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT.md,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    gap: 14,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  keypad: { width: "100%", maxWidth: 320, marginTop: "auto" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyText: { fontSize: 28, fontWeight: "600", color: COLORS.textLight },
});