import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";

export default function HomeScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubWallet = onSnapshot(doc(db, "wallets", uid), (snap) => {
      if (snap.exists()) setBalance(snap.data().balance);
    });

    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUserName(snap.data().name);
    });

    return () => { unsubWallet(); unsubUser(); };
  }, []);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí",
        onPress: async () => {
          await signOut(auth);
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {userName} 👋</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.profileIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo disponible</Text>
        <Text style={styles.balanceAmount}>Q {balance.toFixed(2)}</Text>
        <Text style={styles.currency}>Quetzales (GTQ)</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Transfer")}>
          <Text style={styles.actionIcon}>💸</Text>
          <Text style={styles.actionText}>Transferir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("History")}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Historial</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 25, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
  profileIcon: { fontSize: 24 },
  balanceCard: { backgroundColor: "#1A2744", borderRadius: 20, padding: 30, alignItems: "center", marginBottom: 30, borderWidth: 1, borderColor: "#2A3A5C" },
  balanceLabel: { fontSize: 14, color: "#7B8CA6", marginBottom: 8 },
  balanceAmount: { fontSize: 40, fontWeight: "bold", color: "#2E86C1" },
  currency: { fontSize: 12, color: "#7B8CA6", marginTop: 5 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  actionButton: { flex: 1, backgroundColor: "#1A2744", borderRadius: 16, padding: 25, alignItems: "center", marginHorizontal: 8, borderWidth: 1, borderColor: "#2A3A5C" },
  actionIcon: { fontSize: 30, marginBottom: 8 },
  actionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  logoutButton: { alignItems: "center", padding: 15 },
  logoutText: { color: "#E74C3C", fontSize: 14 },
});