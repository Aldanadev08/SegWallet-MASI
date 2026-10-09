import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, StatusBar, Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { isBiometricAvailable, authenticateBiometric } from "../../utils/biometrics";
import { isBiometricEnabled, setBiometricEnabled } from "../../utils/biometricPref";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [walletLocked, setWalletLocked] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setUserData(snap.data());
      setBioAvailable(await isBiometricAvailable());
      setBioEnabled(await isBiometricEnabled(uid));
    })();

    const unsub = onSnapshot(doc(db, "wallets", uid), (snap) => {
      if (snap.exists()) setWalletLocked(!!snap.data().locked);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir", style: "destructive",
        onPress: async () => { await signOut(auth); navigation.replace("Login"); },
      },
    ]);
  };

  const handleToggleBio = async (val) => {
    if (!bioAvailable) {
      Alert.alert("No disponible", "Tu dispositivo no tiene biometría configurada");
      return;
    }
    if (val) {
      const ok = await authenticateBiometric("Verifica para activar biometría");
      if (!ok) return;
    }
    await setBiometricEnabled(uid, val);
    setBioEnabled(val);
  };

  const handleToggleLock = async () => {
    const action = walletLocked ? "desbloquear" : "bloquear";
    const confirmTitle = walletLocked ? "¿Desbloquear billetera?" : "¿Bloquear billetera?";
    const confirmMsg = walletLocked
      ? "Podrás enviar y recibir dinero de nuevo"
      : "No podrás enviar ni pagar solicitudes hasta desbloquearla";

    Alert.alert(confirmTitle, confirmMsg, [
      { text: "Cancelar", style: "cancel" },
      {
        text: walletLocked ? "Desbloquear" : "Bloquear",
        style: walletLocked ? "default" : "destructive",
        onPress: async () => {
          const bioOk = await authenticateBiometric(`Confirma para ${action}`);
          if (!bioOk && bioEnabled) return;
          await updateDoc(doc(db, "wallets", uid), { locked: !walletLocked });
          Alert.alert("✓ Listo", `Billetera ${walletLocked ? "desbloqueada" : "bloqueada"}`);
        },
      },
    ]);
  };

  const initials = (userData?.name || "U")
    .split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Mi Perfil</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={COLORS.gradientAccent} style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{userData?.name || "Usuario"}</Text>
          <Text style={styles.userEmail}>{userData?.email || auth.currentUser?.email}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
            <Text style={styles.verifiedText}>Cuenta Verificada</Text>
          </View>
        </View>

        {/* Wallet status */}
        {walletLocked && (
          <View style={styles.lockBanner}>
            <Ionicons name="lock-closed" size={20} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockTitle}>Billetera Bloqueada</Text>
              <Text style={styles.lockDesc}>No puedes enviar dinero hasta desbloquearla</Text>
            </View>
          </View>
        )}

        {/* Account info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <InfoRow icon="mail-outline" label="Correo" value={userData?.email || auth.currentUser?.email} />
          <InfoRow icon="finger-print" label="ID" value={`${uid.slice(0, 10)}...${uid.slice(-6)}`} mono />
          <InfoRow icon="globe-outline" label="Moneda" value="GTQ (Quetzales)" />
        </View>

        {/* Security section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate("ChangePin")}>
            <View style={styles.settingIcon}>
              <Ionicons name="key" size={18} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Cambiar PIN</Text>
              <Text style={styles.settingDesc}>Actualiza tu PIN de 6 dígitos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="finger-print" size={18} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Biometría</Text>
              <Text style={styles.settingDesc}>
                {!bioAvailable ? "No disponible en el dispositivo" :
                  bioEnabled ? "Activada para login y pagos" : "Desactivada"}
              </Text>
            </View>
            <Switch
              value={bioEnabled}
              onValueChange={handleToggleBio}
              disabled={!bioAvailable}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleToggleLock}
          >
            <View style={[styles.settingIcon, walletLocked && { backgroundColor: "rgba(255, 153, 0, 0.15)" }]}>
              <Ionicons
                name={walletLocked ? "lock-closed" : "lock-open"}
                size={18}
                color={walletLocked ? COLORS.warning : COLORS.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>
                {walletLocked ? "Desbloquear billetera" : "Bloquear billetera"}
              </Text>
              <Text style={styles.settingDesc}>
                {walletLocked
                  ? "Reactiva envíos y pagos"
                  : "Impide transferencias si pierdes el teléfono"}
              </Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: walletLocked ? `${COLORS.warning}22` : `${COLORS.accent}22`,
              borderColor: walletLocked ? COLORS.warning : COLORS.accent,
            }]}>
              <Text style={{
                color: walletLocked ? COLORS.warning : COLORS.accent,
                fontSize: 10, fontWeight: "700", letterSpacing: 1,
              }}>
                {walletLocked ? "BLOQUEADA" : "ACTIVA"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate("Contacts")}>
            <View style={styles.settingIcon}>
              <Ionicons name="people" size={18} color={COLORS.accent} />
            </View>
            <Text style={[styles.settingLabel, { flex: 1 }]}>Mis contactos</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle" size={18} color={COLORS.accent} />
            </View>
            <Text style={[styles.settingLabel, { flex: 1 }]}>Versión</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: FONT.sm }}>1.0.0</Text>
          </View>
        </View>

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

  avatarSection: { alignItems: "center", marginBottom: SPACING.lg },
  avatarWrapper: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: "center", alignItems: "center",
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  avatarText: { color: COLORS.bgPrimary, fontSize: FONT.display, fontWeight: "800" },
  userName: { color: COLORS.textLight, fontSize: FONT.xl, fontWeight: "700", marginTop: SPACING.md },
  userEmail: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 4 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    borderWidth: 1, borderColor: "rgba(0, 212, 170, 0.3)",
  },
  verifiedText: { color: COLORS.accent, fontSize: FONT.xs, fontWeight: "700" },

  lockBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    padding: SPACING.md, borderRadius: 12,
    backgroundColor: "rgba(255, 153, 0, 0.1)",
    borderWidth: 1, borderColor: "rgba(255, 153, 0, 0.3)",
  },
  lockTitle: { color: COLORS.warning, fontSize: FONT.md, fontWeight: "700" },
  lockDesc: { color: COLORS.textSecondary, fontSize: FONT.xs, marginTop: 2 },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: FONT.xs, fontWeight: "700",
    letterSpacing: 1.5, marginBottom: SPACING.sm, paddingLeft: 4,
  },

  infoRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    justifyContent: "center", alignItems: "center", marginRight: SPACING.md,
  },
  infoLabel: { color: COLORS.textMuted, fontSize: FONT.xs, marginBottom: 2 },
  infoValue: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600" },

  settingRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    justifyContent: "center", alignItems: "center",
  },
  settingLabel: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600" },
  settingDesc: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: SPACING.md, marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, borderRadius: 14,
    backgroundColor: "rgba(249, 97, 103, 0.1)",
    borderWidth: 1, borderColor: "rgba(249, 97, 103, 0.3)",
  },
  logoutText: { color: COLORS.danger, fontSize: FONT.md, fontWeight: "700" },
});