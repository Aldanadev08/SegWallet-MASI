import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Vibration,
} from "react-native";
import { savePin, getPin } from "../../utils/secureStore";
import { isBiometricAvailable, authenticateWithBiometrics } from "../../utils/biometrics";

export default function PinScreen({ navigation }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    const stored = await getPin();
    if (stored) {
      setHasPin(true);
      tryBiometrics();
    }
  };

  const tryBiometrics = async () => {
    const available = await isBiometricAvailable();
    if (available) {
      const success = await authenticateWithBiometrics();
      if (success) {
        navigation.replace("Home");
      }
    }
  };

  const handlePress = async (digit) => {
    const current = hasPin ? pin : isConfirming ? confirmPin : pin;

    if (current.length >= 6) return;

    const newValue = current + digit;

    if (hasPin) {
      setPin(newValue);
      if (newValue.length === 6) {
        const stored = await getPin();
        if (newValue === stored) {
          navigation.replace("Home");
        } else {
          Vibration.vibrate(300);
          Alert.alert("Error", "PIN incorrecto");
          setPin("");
        }
      }
    } else if (isConfirming) {
      setConfirmPin(newValue);
      if (newValue.length === 6) {
        if (newValue === pin) {
          await savePin(newValue);
          Alert.alert("Éxito", "PIN configurado correctamente", [
            { text: "OK", onPress: () => navigation.replace("Home") },
          ]);
        } else {
          Vibration.vibrate(300);
          Alert.alert("Error", "Los PINs no coinciden, intenta de nuevo");
          setPin("");
          setConfirmPin("");
          setIsConfirming(false);
        }
      }
    } else {
      setPin(newValue);
      if (newValue.length === 6) {
        setIsConfirming(true);
      }
    }
  };

  const handleDelete = () => {
    if (hasPin) {
      setPin(pin.slice(0, -1));
    } else if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const currentPin = hasPin ? pin : isConfirming ? confirmPin : pin;
  const title = hasPin ? "Ingresa tu PIN" : isConfirming ? "Confirma tu PIN" : "Crea un PIN de 6 dígitos";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {hasPin ? "O usa tu huella dactilar" : "Este PIN protegerá tu billetera"}
      </Text>

      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.dot, i < currentPin.length && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((digit, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, digit === null && styles.keyEmpty]}
            onPress={() => {
              if (digit === "⌫") handleDelete();
              else if (digit !== null) handlePress(String(digit));
            }}
            disabled={digit === null}
          >
            <Text style={styles.keyText}>{digit !== null ? digit : ""}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasPin && (
        <TouchableOpacity onPress={tryBiometrics} style={styles.bioButton}>
          <Text style={styles.bioText}>🔐 Usar huella dactilar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#7B8CA6", marginBottom: 40 },
  dotsContainer: { flexDirection: "row", marginBottom: 40 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#2A3A5C", marginHorizontal: 10 },
  dotFilled: { backgroundColor: "#2E86C1", borderColor: "#2E86C1" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 280, justifyContent: "center" },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1A2744", justifyContent: "center", alignItems: "center", margin: 8 },
  keyEmpty: { backgroundColor: "transparent" },
  keyText: { fontSize: 28, color: "#FFFFFF", fontWeight: "600" },
  bioButton: { marginTop: 25, padding: 15 },
  bioText: { color: "#2E86C1", fontSize: 16 },
});