import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setUserData(snap.data());
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          navigation.replace("Login");
        },
      },
    ]);
  };

  const initials = (userData?.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const uid = auth.currentUser?.uid || "";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Mi Perfil</Text>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="create-outline" size={22} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={COLORS.gradientAccent}
            style={styles.avatarWrapper}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{userData?.name || "Usuario"}</Text>
          <Text style={styles.userEmail}>{userData?.email || auth.currentUser?.email}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
            <Text style={styles.verifiedText}>Cuenta Verificada</Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la cuenta</Text>

          <InfoRow
            icon="mail-outline"
            label="Correo"
            value={userData?.email || auth.currentUser?.email}
          />
          <InfoRow
            icon="finger-print"
            label="ID de Usuario"
            value={`${uid.slice(0, 10)}...${uid.slice(-6)}`}
            mono
          />
          <InfoRow
            icon="key-outline"
            label="Proveedor"
            value={auth.currentUser?.providerData?.[0]?.providerId || "password"}
          />
          <InfoRow
            icon="globe-outline"
            label="Moneda"
            value="GTQ (Quetzales)"
          />
        </View>

        {/* Security section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>

          <SettingRow
            icon="lock-closed-outline"
            label="Cambiar PIN"
            onPress={() => Alert.alert("Próximamente")}
          />
          <SettingRow
            icon="finger-print"
            label="Biometría"
            value="Activada"
            valueColor={COLORS.accent}
            onPress={() => Alert.alert("Próximamente")}
          />
          <SettingRow
            icon="shield-outline"
            label="Privacidad"
            onPress={() => Alert.alert("Próximamente")}
          />
        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>

          <SettingRow
            icon="help-circle-outline"
            label="Ayuda y soporte"
            onPress={() => Alert.alert("Próximamente")}
          />
          <SettingRow
            icon="document-text-outline"
            label="Términos y condiciones"
            onPress={() => Alert.alert("Próximamente")}
          />
          <SettingRow
            icon="information-circle-outline"
            label="Versión"
            value="1.0.0"
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, mono && { fontFamily: "monospace" }]}>{value}</Text>
      </View>
    </View>
  );
}

function SettingRow({ icon, label, value, valueColor, onPress }) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.accent} />
      </View>
      <Text style={[styles.infoValue, { flex: 1 }]}>{label}</Text>
      {value && (
        <Text style={{ color: valueColor || COLORS.textMuted, fontSize: FONT.sm, marginRight: 6 }}>
          {value}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 50 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },

  avatarSection: { alignItems: "center", marginBottom: SPACING.xl },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarText: { color: COLORS.bgPrimary, fontSize: FONT.display, fontWeight: "800" },
  userName: { color: COLORS.textLight, fontSize: FONT.xl, fontWeight: "700", marginTop: SPACING.md },
  userEmail: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 4 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.3)",
  },
  verifiedText: { color: COLORS.accent, fontSize: FONT.xs, fontWeight: "700" },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    paddingLeft: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  infoLabel: { color: COLORS.textMuted, fontSize: FONT.xs, marginBottom: 2 },
  infoValue: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    backgroundColor: "rgba(249, 97, 103, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 97, 103, 0.3)",
  },
  logoutText: { color: COLORS.danger, fontSize: FONT.md, fontWeight: "700" },
});