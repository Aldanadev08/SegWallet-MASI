import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function MyQRScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setUserData(snap.data());
    })();
  }, []);

  const qrPayload = JSON.stringify({
    type: "segwallet",
    uid,
    email: auth.currentUser?.email,
    name: userData?.name || "",
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Envíame dinero en SegWallet a: ${auth.currentUser?.email}`,
      });
    } catch {}
  };

  const initials = (userData?.name || "U")
    .split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mi Código QR</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Pide que escaneen este código{"\n"}para enviarte dinero</Text>

        <View style={styles.qrCard}>
          <LinearGradient colors={COLORS.gradientAccent} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.userName}>{userData?.name || "Usuario"}</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>

          <View style={styles.qrBox}>
            {qrPayload && (
              <QRCode
                value={qrPayload}
                size={220}
                backgroundColor="#FFFFFF"
                color={COLORS.bgPrimary}
              />
            )}
          </View>

          <View style={styles.brandRow}>
            <Ionicons name="wallet" size={16} color={COLORS.accent} />
            <Text style={styles.brandText}>SegWallet</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate("ScanQR")}>
          <Ionicons name="scan-outline" size={20} color={COLORS.accent} />
          <Text style={styles.scanText}>Escanear un código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 50 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  topTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },

  content: { flex: 1, alignItems: "center", paddingHorizontal: SPACING.lg },
  subtitle: {
    color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center",
    marginBottom: SPACING.lg, lineHeight: 22,
  },

  qrCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: SPACING.lg,
    alignItems: "center", width: "100%",
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatarInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: COLORS.accent, fontSize: FONT.xl, fontWeight: "800" },
  userName: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },
  userEmail: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, marginBottom: SPACING.md },

  qrBox: {
    backgroundColor: "#FFFFFF", padding: SPACING.md, borderRadius: 16,
    marginVertical: SPACING.md,
  },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  brandText: { color: COLORS.accent, fontSize: FONT.sm, fontWeight: "700" },

  scanBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: SPACING.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: "rgba(0, 212, 170, 0.1)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(0, 212, 170, 0.3)",
  },
  scanText: { color: COLORS.accent, fontSize: FONT.md, fontWeight: "700" },
});