import React, { useRef } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function ReceiptScreen({ navigation, route }) {
  const {
    amount, recipientEmail, recipientName,
    senderEmail, transactionId, note, timestamp,
  } = route.params || {};

  const viewShotRef = useRef();

  const formatMoney = (n) =>
    "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const dateStr = dateObj.toLocaleDateString("es-GT", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("es-GT", {
    hour: "2-digit", minute: "2-digit",
  });

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, { format: "png", quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Comprobante SegWallet",
        });
      } else {
        Alert.alert("Error", "Compartir no está disponible");
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo compartir el comprobante");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="close" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Comprobante</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.receipt}>
            {/* Success icon */}
            <View style={styles.successIcon}>
              <LinearGradient colors={COLORS.gradientAccent} style={styles.successCircle}>
                <Ionicons name="checkmark" size={40} color={COLORS.bgPrimary} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>¡Transferencia Exitosa!</Text>
            <Text style={styles.amount}>{formatMoney(amount)}</Text>
            <Text style={styles.subtitle}>fueron enviados correctamente</Text>

            {/* Dashed separator */}
            <View style={styles.dashLine}>
              {Array.from({ length: 25 }).map((_, i) => (
                <View key={i} style={styles.dash} />
              ))}
            </View>

            {/* Details */}
            <DetailRow label="De" value={senderEmail} />
            <DetailRow label="Para" value={recipientName || recipientEmail} />
            <DetailRow label="Correo" value={recipientEmail} />
            {note && <DetailRow label="Nota" value={note} />}
            <DetailRow label="Fecha" value={dateStr} />
            <DetailRow label="Hora" value={timeStr} />
            <DetailRow label="ID Transacción" value={transactionId?.slice(0, 16) + "..."} mono />
            <DetailRow label="Estado" value="COMPLETADO" valueColor={COLORS.accent} bold />

            {/* Footer */}
            <View style={styles.dashLine}>
              {Array.from({ length: 25 }).map((_, i) => (
                <View key={i} style={styles.dash} />
              ))}
            </View>

            <View style={styles.brandRow}>
              <Ionicons name="wallet" size={20} color={COLORS.accent} />
              <Text style={styles.brandText}>SegWallet</Text>
            </View>
            <Text style={styles.footerText}>Billetera Digital P2P Segura</Text>
          </View>
        </ViewShot>

        <TouchableOpacity onPress={handleShare} activeOpacity={0.85} style={{ marginTop: SPACING.lg }}>
          <LinearGradient colors={COLORS.gradientAccent} style={styles.shareBtn}>
            <Ionicons name="share-social" size={20} color={COLORS.bgPrimary} />
            <Text style={styles.shareText}>Compartir Comprobante</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.homeBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, mono, bold, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          mono && { fontFamily: "monospace", fontSize: FONT.sm },
          bold && { fontWeight: "800" },
          valueColor && { color: valueColor },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 50 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgCard,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  topTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },

  receipt: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  successIcon: { marginBottom: SPACING.md },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center",
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  title: { color: COLORS.textLight, fontSize: FONT.xl, fontWeight: "800" },
  amount: { color: COLORS.accent, fontSize: FONT.display, fontWeight: "800", marginTop: SPACING.sm },
  subtitle: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 4 },

  dashLine: {
    flexDirection: "row", justifyContent: "space-between",
    width: "100%", marginVertical: SPACING.md,
  },
  dash: { width: 6, height: 1, backgroundColor: COLORS.textMuted, opacity: 0.4 },

  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    width: "100%", paddingVertical: 8,
  },
  detailLabel: { color: COLORS.textMuted, fontSize: FONT.sm },
  detailValue: {
    color: COLORS.textLight, fontSize: FONT.sm, fontWeight: "600",
    maxWidth: "60%", textAlign: "right",
  },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandText: { color: COLORS.accent, fontSize: FONT.lg, fontWeight: "800" },
  footerText: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 4 },

  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  shareText: { color: COLORS.bgPrimary, fontSize: FONT.md, fontWeight: "800" },

  homeBtn: { alignItems: "center", paddingVertical: SPACING.md, marginTop: SPACING.sm },
  homeBtnText: { color: COLORS.textSecondary, fontSize: FONT.md },
});