import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function RequestScreen({ navigation }) {
  const [payerEmail, setPayerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const quickAmounts = [50, 100, 250, 500];

  const handleRequest = async () => {
    const amountNum = parseFloat(amount);
    if (!payerEmail || !amount) {
      Alert.alert("Error", "Completa correo y monto");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Monto inválido");
      return;
    }
    if (payerEmail.trim() === auth.currentUser.email) {
      Alert.alert("Error", "No puedes solicitarte a ti mismo");
      return;
    }

    setLoading(true);
    try {
      const usersQ = query(
        collection(db, "users"),
        where("email", "==", payerEmail.trim())
      );
      const usersSnap = await getDocs(usersQ);
      if (usersSnap.empty) {
        Alert.alert("Error", "Usuario no encontrado");
        setLoading(false);
        return;
      }
      const payerDoc = usersSnap.docs[0];

      const myDoc = await getDocs(
        query(collection(db, "users"), where("email", "==", auth.currentUser.email))
      );
      const myName = myDoc.docs[0]?.data()?.name || "";

      await addDoc(collection(db, "requests"), {
        requesterId: auth.currentUser.uid,
        requesterEmail: auth.currentUser.email,
        requesterName: myName,
        payerId: payerDoc.id,
        payerEmail: payerDoc.data().email,
        amount: amountNum,
        note: note.trim() || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert("✓ Solicitud enviada", `Le pediste Q${amountNum.toFixed(2)} a ${payerDoc.data().name}`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Solicitar Dinero</Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate("RequestsList")}
            >
              <Ionicons name="list" size={22} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountHero}>
            <Text style={styles.amountLabel}>MONTO A SOLICITAR</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currency}>Q</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(202, 220, 252, 0.3)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.underline} />

            <View style={styles.quickRow}>
              {quickAmounts.map((q) => (
                <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => setAmount(String(q))}>
                  <Text style={styles.quickText}>Q{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO DE QUIEN TE PAGARÁ</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={payerEmail}
                  onChangeText={setPayerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOTIVO (OPCIONAL)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Mi parte de la cena"
                  placeholderTextColor={COLORS.textMuted}
                  value={note}
                  onChangeText={setNote}
                  maxLength={60}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
              <Text style={styles.infoText}>
                La persona recibirá tu solicitud y podrá aprobarla o rechazarla
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRequest}
            disabled={loading}
            activeOpacity={0.85}
            style={{ marginTop: SPACING.lg }}
          >
            <LinearGradient colors={COLORS.gradientAccent} style={styles.confirmBtn}>
              <Ionicons name="paper-plane" size={20} color={COLORS.bgPrimary} />
              <Text style={styles.confirmText}>
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.xl },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  topTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },

  amountHero: { alignItems: "center", marginVertical: SPACING.xl },
  amountLabel: {
    color: COLORS.textMuted, fontSize: 10, fontWeight: "700",
    letterSpacing: 2, marginBottom: SPACING.md,
  },
  amountInputRow: { flexDirection: "row", alignItems: "flex-start" },
  currency: {
    color: COLORS.accent, fontSize: FONT.xxl, fontWeight: "700",
    marginTop: 10, marginRight: 4,
  },
  amountInput: {
    color: COLORS.textLight, fontSize: FONT.hero, fontWeight: "800",
    minWidth: 150, textAlign: "center", padding: 0,
  },
  underline: { width: 200, height: 2, backgroundColor: COLORS.accent, marginTop: 8, opacity: 0.5 },
  quickRow: {
    flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg,
    flexWrap: "wrap", justifyContent: "center",
  },
  quickBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  quickText: { color: COLORS.textLight, fontSize: FONT.sm, fontWeight: "600" },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1.5, marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgInput,
    borderRadius: 12, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: SPACING.sm,
    color: COLORS.textLight, fontSize: FONT.md,
  },

  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: SPACING.md, backgroundColor: "rgba(74, 144, 217, 0.08)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(74, 144, 217, 0.3)",
    marginTop: SPACING.sm,
  },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.sm },

  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, borderRadius: 16, gap: 10,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  confirmText: { color: COLORS.bgPrimary, fontSize: FONT.lg, fontWeight: "800" },
});