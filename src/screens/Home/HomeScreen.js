import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, collection, query, where, or, orderBy, limit, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function HomeScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [recentTx, setRecentTx] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubWallet = onSnapshot(doc(db, "wallets", uid), (snap) => {
      if (snap.exists()) setBalance(snap.data().balance || 0);
    });
    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUserName(snap.data().name || "");
    });
    loadRecent();
    return () => {
      unsubWallet();
      unsubUser();
    };
  }, []);

  const loadRecent = async () => {
    try {
      const q = query(
        collection(db, "transactions"),
        or(where("senderId", "==", uid), where("recipientId", "==", uid)),
        orderBy("createdAt", "desc"),
        limit(4)
      );
      const snap = await getDocs(q);
      setRecentTx(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("recent tx error", e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecent();
    setRefreshing(false);
  };

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

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const formatMoney = (n) =>
    "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.avatarText}>{initials || "U"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.greeting}>Hola 👋</Text>
            <Text style={styles.userName}>{userName || "Usuario"}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textLight} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={["#00D4AA", "#00A383"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Decoration */}
            <View style={styles.cardDecor1} />
            <View style={styles.cardDecor2} />

            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.bgPrimary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.balanceAmount}>
              {showBalance ? formatMoney(balance) : "Q ••••••"}
            </Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardFooterLabel}>MONEDA</Text>
                <Text style={styles.cardFooterValue}>GTQ</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.cardFooterLabel}>SEGWALLET</Text>
                <Text style={styles.cardFooterValue}>•• {uid?.slice(-4).toUpperCase()}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <ActionButton
            icon="arrow-up"
            label="Enviar"
            color={COLORS.accent}
            onPress={() => navigation.navigate("Transfer")}
          />
          <ActionButton
            icon="arrow-down"
            label="Recibir"
            color={COLORS.secondary}
            onPress={() => Alert.alert("Próximamente", "Función en desarrollo")}
          />
          <ActionButton
            icon="time"
            label="Historial"
            color="#7C4DFF"
            onPress={() => navigation.navigate("History")}
          />
          <ActionButton
            icon="person"
            label="Perfil"
            color="#FF6F00"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimientos recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aún no tienes movimientos</Text>
            </View>
          ) : (
            recentTx.map((tx) => {
              const sent = tx.senderId === uid;
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: sent ? "rgba(249, 97, 103, 0.15)" : "rgba(0, 212, 170, 0.15)" },
                    ]}
                  >
                    <Ionicons
                      name={sent ? "arrow-up" : "arrow-down"}
                      size={18}
                      color={sent ? COLORS.danger : COLORS.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {sent ? `A: ${tx.recipientEmail}` : `De: ${tx.senderEmail}`}
                    </Text>
                    <Text style={styles.txSubtitle}>P2P Transfer</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: sent ? COLORS.danger : COLORS.accent },
                    ]}
                  >
                    {sent ? "-" : "+"} {formatMoney(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}22`, borderColor: color }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 50 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatarText: { color: COLORS.accent, fontSize: FONT.lg, fontWeight: "800" },
  greeting: { color: COLORS.textMuted, fontSize: FONT.sm },
  userName: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },

  balanceCardWrapper: { paddingHorizontal: SPACING.lg },
  balanceCard: {
    borderRadius: 24,
    padding: SPACING.lg,
    overflow: "hidden",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardDecor1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -80,
    right: -60,
  },
  cardDecor2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -40,
    left: -30,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: { color: COLORS.bgPrimary, fontSize: FONT.sm, fontWeight: "600", opacity: 0.8 },
  balanceAmount: {
    color: COLORS.bgPrimary,
    fontSize: FONT.display,
    fontWeight: "800",
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardFooterLabel: { color: COLORS.bgPrimary, fontSize: 9, fontWeight: "700", opacity: 0.7, letterSpacing: 1 },
  cardFooterValue: { color: COLORS.bgPrimary, fontSize: FONT.md, fontWeight: "700", marginTop: 2 },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  action: { alignItems: "center", flex: 1 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  actionLabel: { color: COLORS.textLight, fontSize: FONT.sm, fontWeight: "600", marginTop: 8 },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700" },
  sectionLink: { color: COLORS.accent, fontSize: FONT.sm, fontWeight: "600" },

  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 8 },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  txTitle: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600" },
  txSubtitle: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },
  txAmount: { fontSize: FONT.md, fontWeight: "700" },

  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  logoutText: { color: COLORS.danger, fontSize: FONT.md, fontWeight: "600" },
});