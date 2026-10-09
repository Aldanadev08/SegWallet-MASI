import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection, query, where, orderBy, getDocs, doc,
  runTransaction, updateDoc, serverTimestamp, addDoc, getDoc,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { authenticateBiometric } from "../../utils/biometrics";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function RequestsListScreen({ navigation }) {
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    try {
      const rQ = query(
        collection(db, "requests"),
        where("payerId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const rSnap = await getDocs(rQ);
      setReceived(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const sQ = query(
        collection(db, "requests"),
        where("requesterId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const sSnap = await getDocs(sQ);
      setSent(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("requests err", e.message);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatMoney = (n) =>
    "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 });

  const handleAccept = async (req) => {
    // Validar bloqueo de wallet antes de pagar
    const walletSnap = await getDoc(doc(db, "wallets", uid));
    if (walletSnap.exists() && walletSnap.data().locked) {
      Alert.alert(
        "🔒 Billetera bloqueada",
        "Desbloquea tu billetera desde el Perfil para pagar solicitudes",
        [
          { text: "Ir al perfil", onPress: () => navigation.navigate("Profile") },
          { text: "Cancelar", style: "cancel" },
        ]
      );
      return;
    }

    const bioOk = await authenticateBiometric("Confirma el pago");
    if (!bioOk) return;

    try {
      await runTransaction(db, async (tx) => {
        const payerRef = doc(db, "wallets", uid);
        const requesterRef = doc(db, "wallets", req.requesterId);
        const requestRef = doc(db, "requests", req.id);
        const payerSnap = await tx.get(payerRef);
        const requesterSnap = await tx.get(requesterRef);
        const requestSnap = await tx.get(requestRef);

        if (!requestSnap.exists() || requestSnap.data().status !== "pending") {
          throw new Error("Solicitud ya procesada");
        }
        if (payerSnap.data().locked) throw new Error("Tu billetera está bloqueada");
        if (requesterSnap.data().locked) throw new Error("La billetera del solicitante está bloqueada");
        if (payerSnap.data().balance < req.amount) throw new Error("Saldo insuficiente");

        tx.update(payerRef, { balance: payerSnap.data().balance - req.amount });
        tx.update(requesterRef, { balance: requesterSnap.data().balance + req.amount });
        tx.update(requestRef, { status: "accepted", resolvedAt: serverTimestamp() });
      });

      await addDoc(collection(db, "transactions"), {
        senderId: uid,
        senderEmail: auth.currentUser.email,
        recipientId: req.requesterId,
        recipientEmail: req.requesterEmail,
        recipientName: req.requesterName,
        amount: req.amount,
        type: "request_payment",
        note: req.note,
        createdAt: serverTimestamp(),
      });

      Alert.alert("✓ Pago realizado", `Pagaste Q${req.amount.toFixed(2)}`);
      load();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleReject = (req) => {
    Alert.alert("¿Rechazar solicitud?", `Rechazar la solicitud de Q${req.amount.toFixed(2)}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar", style: "destructive",
        onPress: async () => {
          await updateDoc(doc(db, "requests", req.id), {
            status: "rejected",
            resolvedAt: serverTimestamp(),
          });
          load();
        }
      },
    ]);
  };

  const data = tab === "received" ? received : sent;

  const renderItem = ({ item }) => {
    const isReceived = tab === "received";
    const name = isReceived ? item.requesterName : item.payerEmail;
    const email = isReceived ? item.requesterEmail : item.payerEmail;

    const statusConfig = {
      pending: { color: COLORS.warning, label: "PENDIENTE", icon: "time-outline" },
      accepted: { color: COLORS.accent, label: "APROBADO", icon: "checkmark-circle" },
      rejected: { color: COLORS.danger, label: "RECHAZADO", icon: "close-circle" },
      cancelled: { color: COLORS.textMuted, label: "CANCELADO", icon: "ban" },
    };
    const sc = statusConfig[item.status] || statusConfig.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAvatar}>
            <Ionicons
              name={isReceived ? "arrow-down" : "arrow-up"}
              size={18}
              color={COLORS.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>
              {isReceived ? "Te pidió" : "Le pediste a"}
            </Text>
            <Text style={styles.cardName}>{name || email}</Text>
          </View>
          <Text style={styles.cardAmount}>{formatMoney(item.amount)}</Text>
        </View>

        {item.note && (
          <Text style={styles.cardNote}>"{item.note}"</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: `${sc.color}22`, borderColor: sc.color }]}>
            <Ionicons name={sc.icon} size={12} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>

          {isReceived && item.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                <Text style={styles.rejectText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                <LinearGradient colors={COLORS.gradientAccent} style={styles.acceptGradient}>
                  <Text style={styles.acceptText}>Pagar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <LinearGradient colors={COLORS.gradientPrimary} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Solicitudes</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Request")}>
          <Ionicons name="add" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "received" && styles.tabActive]}
          onPress={() => setTab("received")}
        >
          <Text style={[styles.tabText, tab === "received" && styles.tabTextActive]}>
            Recibidas ({received.filter(r => r.status === "pending").length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "sent" && styles.tabActive]}
          onPress={() => setTab("sent")}
        >
          <Text style={[styles.tabText, tab === "sent" && styles.tabTextActive]}>
            Enviadas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin solicitudes</Text>
            <Text style={styles.emptyText}>
              {tab === "received" ? "No tienes solicitudes pendientes" : "No has enviado solicitudes"}
            </Text>
          </View>
        }
      />
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

  tabs: {
    flexDirection: "row", marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: "600" },
  tabTextActive: { color: COLORS.bgPrimary, fontWeight: "800" },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0, 212, 170, 0.15)",
    justifyContent: "center", alignItems: "center", marginRight: SPACING.sm,
  },
  cardLabel: { color: COLORS.textMuted, fontSize: FONT.xs },
  cardName: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600", marginTop: 2 },
  cardAmount: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "800" },
  cardNote: {
    color: COLORS.textSecondary, fontSize: FONT.sm, fontStyle: "italic",
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgInput, borderRadius: 8, marginBottom: SPACING.sm,
  },

  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  actionRow: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.danger,
  },
  rejectText: { color: COLORS.danger, fontSize: FONT.sm, fontWeight: "700" },
  acceptBtn: { borderRadius: 10, overflow: "hidden" },
  acceptGradient: { paddingHorizontal: SPACING.md, paddingVertical: 8 },
  acceptText: { color: COLORS.bgPrimary, fontSize: FONT.sm, fontWeight: "800" },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700", marginTop: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 4, textAlign: "center" },
});