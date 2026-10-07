import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { collection, query, where, orderBy, onSnapshot, or } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

export default function HistoryScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "transactions"),
      or(where("senderId", "==", uid), where("recipientId", "==", uid)),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(txs);
    });

    return () => unsub();
  }, []);

  const renderItem = ({ item }) => {
    const isSender = item.senderId === auth.currentUser.uid;
    return (
      <View style={styles.txCard}>
        <View style={styles.txLeft}>
          <Text style={styles.txIcon}>{isSender ? "🔴" : "🟢"}</Text>
          <View>
            <Text style={styles.txName}>
              {isSender ? item.recipientEmail : item.senderEmail}
            </Text>
            <Text style={styles.txDate}>
              {item.createdAt?.toDate?.()?.toLocaleDateString() || "Pendiente"}
            </Text>
          </View>
        </View>
        <Text style={[styles.txAmount, { color: isSender ? "#E74C3C" : "#27AE60" }]}>
          {isSender ? "-" : "+"}Q {item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Historial</Text>

      {transactions.length === 0 ? (
        <Text style={styles.empty}>No hay transacciones aún</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 25, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backText: { color: "#2E86C1", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 20 },
  empty: { color: "#7B8CA6", textAlign: "center", marginTop: 40, fontSize: 16 },
  txCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1A2744", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2A3A5C" },
  txLeft: { flexDirection: "row", alignItems: "center" },
  txIcon: { fontSize: 20, marginRight: 12 },
  txName: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  txDate: { color: "#7B8CA6", fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: "bold" },
});