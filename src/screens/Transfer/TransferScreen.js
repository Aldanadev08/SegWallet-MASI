import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection, query, where, getDocs, doc,
  runTransaction, serverTimestamp, addDoc,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { authenticateBiometric } from "../../utils/biometrics";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function TransferScreen({ navigation, route }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromQR, setFromQR] = useState(false);

  const quickAmounts = [50, 100, 250, 500];

  useEffect(() => {
    if (route?.params?.prefilledEmail) {
      setRecipientEmail(route.params.prefilledEmail);
      setFromQR(true);
    }
  }, [route?.params]);

  const handleTransfer = async () => {
    const amountNum = parseFloat(amount);
    if (!recipientEmail || !amount) {
      Alert.alert("Error", "Completa correo y monto");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Monto inválido");
      return;
    }

    const bioOk = await authenticateBiometric("Confirma la transferencia");
    if (!bioOk) {
      Alert.alert("Cancelado", "Autenticación requerida");
      return;
    }

    setLoading(true);
    try {
      const usersQ = query(
        collection(db, "users"),
        where("email", "==", recipientEmail.trim())
      );
      const usersSnap = await getDocs(usersQ);
      if (usersSnap.empty) {
        Alert.alert("Error", "Destinatario no encontrado");
        setLoading(false);
        return;
      }
      const recipientDoc = usersSnap.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();

      if (recipientId === auth.currentUser.uid) {
        Alert.alert("Error", "No puedes transferirte a ti mismo");
        setLoading(false);
        return;
      }

      await runTransaction(db, async (tx) => {
        const senderRef = doc(db, "wallets", auth.currentUser.uid);
        const recipientRef = doc(db, "wallets", recipientId);
        const senderSnap = await tx.get(senderRef);
        const recipientSnap = await tx.get(recipientRef);
        if (!senderSnap.exists() || !recipientSnap.exists()) {
          throw new Error("Billetera no encontrada");
        }
        const senderBalance = senderSnap.data().balance;
        if (senderBalance < amountNum) throw new Error("Saldo insuficiente");
        tx.update(senderRef, { balance: senderBalance - amountNum });
        tx.update(recipientRef, { balance: recipientSnap.data().balance + amountNum });
      });

      const txDoc = await addDoc(collection(db, "transactions"), {
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        recipientId,
        recipientEmail: recipientData.email,
        recipientName: recipientData.name,
        amount: amountNum,
        type: "transfer",
        note: note.trim() || null,
        createdAt: serverTimestamp(),
      });

      navigation.replace("Receipt", {
        amount: amountNum,
        recipientEmail: recipientData.email,
        recipientName: recipientData.name,
        senderEmail: auth.currentUser.email,
        transactionId: txDoc.id,
        note: note.trim() || null,
        timestamp: Date.now(),
      });
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Enviar Dinero</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("ScanQR")}>
              <Ionicons name="scan-outline" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {fromQR && (
            <View style={styles.qrNotice}>
              <Ionicons name="qr-code" size={16} color={COLORS.accent} />
              <Text style={styles.qrNoticeText}>Destinatario cargado desde QR</Text>
            </View>
          )}

          <View style={styles.amountHero}>
            <Text style={styles.amountLabel}>MONTO A ENVIAR</Text>
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
              <Text style={styles.label}>CORREO DEL DESTINATARIO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="destinatario@ejemplo.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOTA (OPCIONAL)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.accent} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Pago de almuerzo"
                  placeholderTextColor={COLORS.textMuted}
                  value={note}
                  onChangeText={setNote}
                  maxLength={60}
                />
              </View>
            </View>

            <View style={styles.securityBox}>
              <Ionicons name="finger-print" size={20} color={COLORS.accent} />
              <Text style={styles.securityText}>
                Se requerirá autenticación biométrica para confirmar
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleTransfer} disabled={loading} activeOpacity={0.85} style={{ marginTop: SPACING.lg }}>
            <LinearGradient colors={COLORS.gradientAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.bgPrimary} />
              <Text style={styles.confirmText}>
                {loading ? "Procesando..." : "Confirmar Envío"}
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

  qrNotice: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "rgba(0, 212, 170, 0.1)", borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.3)", alignSelf: "flex-start",
  },
  qrNoticeText: { color: COLORS.accent, fontSize: FONT.sm, fontWeight: "600" },

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

  securityBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: SPACING.md, backgroundColor: "rgba(0, 212, 170, 0.08)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(0, 212, 170, 0.3)",
    marginTop: SPACING.sm,
  },
  securityText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.sm },

  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, borderRadius: 16, gap: 10,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  confirmText: { color: COLORS.bgPrimary, fontSize: FONT.lg, fontWeight: "800" },
});