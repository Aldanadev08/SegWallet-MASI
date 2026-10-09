import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function ScanQRScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      if (parsed.type !== "segwallet" || !parsed.email) throw new Error();
      navigation.replace("Transfer", {
        prefilledEmail: parsed.email,
        prefilledName: parsed.name,
      });
    } catch {
      Alert.alert("QR inválido", "No es un código SegWallet válido", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={60} color={COLORS.accent} />
          <Text style={styles.permissionTitle}>Permiso de cámara</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear códigos QR
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: COLORS.textMuted, marginTop: SPACING.md }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Overlay oscuro con hueco en el centro */}
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Escanear QR</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.scanArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <View style={styles.bottomInfo}>
          <Ionicons name="qr-code-outline" size={28} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Centra el código QR dentro del marco
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", paddingTop: 50 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center",
  },
  topTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },

  scanArea: { alignItems: "center" },
  frame: { width: 260, height: 260, position: "relative" },
  corner: {
    position: "absolute", width: 40, height: 40,
    borderColor: COLORS.accent, borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },

  bottomInfo: {
    alignItems: "center", gap: 10, paddingBottom: 60, paddingHorizontal: SPACING.lg,
  },
  infoText: { color: COLORS.textLight, fontSize: FONT.md, textAlign: "center" },

  permissionBox: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: SPACING.lg, backgroundColor: COLORS.bgPrimary,
  },
  permissionTitle: {
    color: COLORS.textLight, fontSize: FONT.xl, fontWeight: "700",
    marginTop: SPACING.md,
  },
  permissionText: {
    color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center",
    marginTop: SPACING.sm, marginBottom: SPACING.lg,
  },
  permissionBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: SPACING.xl, paddingVertical: 14,
    borderRadius: 14,
  },
  permissionBtnText: { color: COLORS.bgPrimary, fontSize: FONT.md, fontWeight: "700" },
});