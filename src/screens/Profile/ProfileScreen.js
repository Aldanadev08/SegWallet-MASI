import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ name: "", email: "" });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUser(snap.data());
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>UID</Text>
          <Text style={styles.infoValue}>{auth.currentUser?.uid}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Proveedor</Text>
          <Text style={styles.infoValue}>{auth.currentUser?.providerData[0]?.providerId || "email"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 25, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backText: { color: "#2E86C1", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 25 },
  card: { backgroundColor: "#1A2744", borderRadius: 20, padding: 30, alignItems: "center", marginBottom: 25, borderWidth: 1, borderColor: "#2A3A5C" },
  avatar: { fontSize: 50, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
  email: { fontSize: 14, color: "#7B8CA6", marginTop: 5 },
  infoSection: { backgroundColor: "#1A2744", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2A3A5C", marginBottom: 30 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2A3A5C" },
  infoLabel: { color: "#7B8CA6", fontSize: 14 },
  infoValue: { color: "#FFFFFF", fontSize: 14, maxWidth: "60%" },
  logoutButton: { backgroundColor: "#E74C3C", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});