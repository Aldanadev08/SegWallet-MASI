import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "users", uid), {
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "wallets", uid), {
        balance: 1000.0,
        currency: "GTQ",
        locked: false,
        createdAt: serverTimestamp(),
      });
      navigation.replace("Pin");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a SegWallet en segundos</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE COMPLETO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="Christian Aldana"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Terms */}
            <View style={styles.terms}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.termsText}>
                Al registrarte aceptas nuestros Términos y Política de Privacidad
              </Text>
            </View>

            {/* Register button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={COLORS.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                <Text style={styles.registerText}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Text>
                <Ionicons name="checkmark" size={20} color={COLORS.bgPrimary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg },
  circle: { position: "absolute", borderRadius: 999, opacity: 0.08 },
  circle1: { width: 250, height: 250, top: -60, left: -60, backgroundColor: COLORS.accent },
  circle2: { width: 200, height: 200, bottom: -50, right: -50, backgroundColor: COLORS.secondary },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  header: { marginBottom: SPACING.lg },
  title: { fontSize: FONT.xxl, fontWeight: "800", color: COLORS.textLight },
  subtitle: { fontSize: FONT.md, color: COLORS.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textLight,
    fontSize: FONT.md,
  },

  terms: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginVertical: SPACING.md,
  },
  termsText: { flex: 1, color: COLORS.textMuted, fontSize: FONT.xs, lineHeight: 16 },

  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  registerText: { color: COLORS.bgPrimary, fontSize: FONT.lg, fontWeight: "800" },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  loginText: { color: COLORS.textSecondary, fontSize: FONT.md },
  loginLink: { color: COLORS.accent, fontSize: FONT.md, fontWeight: "700" },
});