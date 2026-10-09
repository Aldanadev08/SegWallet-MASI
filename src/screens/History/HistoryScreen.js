import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  or,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function HistoryScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const q = query(
        collection(db, "transactions"),
        or(where("senderId", "==", uid), where("recipientId", "==", uid)),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("history error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatMoney = (n) =>
    "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (ts) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    return d.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sent = transactions.filter((t) => t.senderId === uid);
  const received = transactions.filter((t) => t.recipientId === uid);
  const totalSent = sent.reduce((s, t) => s + (t.amount || 0), 0);
  const totalReceived = received.reduce((s, t) => s + (t.amount || 0), 0);

  const renderItem = ({ item }) => {
    const isSent = item.senderId === uid;
    const counterpart = isSent ? item.recipientEmail : item.senderEmail;
    const counterName = isSent ? item.recipientName : "Usuario";

    return (
      <View style={styles.txCard}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isSent ? "rgba(249, 97, 103, 0.15)" : "rgba(0, 212, 170, 0.15)",
              borderColor: isSent ? COLORS.danger : COLORS.accent,
            },
          ]}
        >
          <Ionicons
            name={isSent ? "arrow-up" : "arrow-down"}
            size={20}
            color={isSent ? COLORS.danger : COLORS.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txLabel}>
            {isSent ? "Enviado a" : "Recibido de"}
          </Text>
          <Text style={styles.txName} numberOfLines={1}>
            {counterName || counterpart}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: isSent ? COLORS.danger : COLORS.accent },
          ]}
        >
          {isSent ? "-" : "+"}{formatMoney(item.amount)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Historial</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-down" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.statLabel}>RECIBIDO</Text>
          <Text style={[styles.statValue, { color: COLORS.accent }]}>
            {formatMoney(totalReceived)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(249, 97, 103, 0.15)" }]}>
            <Ionicons name="arrow-up" size={16} color={COLORS.danger} />
          </View>
          <Text style={styles.statLabel}>ENVIADO</Text>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            {formatMoney(totalSent)}
          </Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Sin movimientos</Text>
              <Text style={styles.emptyText}>
                Tus transferencias aparecerán aquí
              </Text>
            </View>
          )
        }
      />
    </View>
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

  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 212, 170, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statValue: { fontSize: FONT.lg, fontWeight: "800", marginTop: 2 },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    borderWidth: 1,
  },
  txLabel: { color: COLORS.textMuted, fontSize: FONT.xs },
  txName: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600", marginTop: 2 },
  txDate: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },
  txAmount: { fontSize: FONT.md, fontWeight: "800" },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700", marginTop: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 4 },
});