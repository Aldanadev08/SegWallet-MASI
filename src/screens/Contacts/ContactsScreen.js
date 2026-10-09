import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar,
  TextInput, Alert, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS, SPACING, FONT } from "../../theme/colors";

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    try {
      const q = query(
        collection(db, "users", uid, "contacts"),
        orderBy("useCount", "desc")
      );
      const snap = await getDocs(q);
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.log("contacts err", e.message); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (contact) => {
    Alert.alert("¿Eliminar contacto?", `Eliminar a ${contact.name || contact.email}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "users", uid, "contacts", contact.id));
          load();
        },
      },
    ]);
  };

  const handleTransfer = (contact) => {
    navigation.navigate("Transfer", {
      prefilledEmail: contact.email,
      prefilledName: contact.name,
    });
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const getInitials = (name, email) => {
    const src = name || email || "U";
    return src.split(/[\s@]/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
  };

  const getColor = (str) => {
    const colors = ["#4A90D9", "#00D4AA", "#7C4DFF", "#FF6F00", "#F96167", "#F9E795"];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const renderItem = ({ item }) => {
    const color = getColor(item.email || "x");
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: `${color}30`, borderColor: color }]}>
          <Text style={[styles.avatarText, { color }]}>{getInitials(item.name, item.email)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name || item.email}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.useCount > 1 && (
            <Text style={styles.meta}>{item.useCount} transferencias</Text>
          )}
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleTransfer(item)}>
          <Ionicons name="arrow-up" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
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
        <Text style={styles.topTitle}>Contactos</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contacto..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabel}>
        {filtered.length} {filtered.length === 1 ? "contacto" : "contactos"}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {search ? "Sin resultados" : "Sin contactos"}
            </Text>
            <Text style={styles.emptyText}>
              {search ? "Intenta con otro término" : "Tus contactos se guardan automáticamente\nal enviar o recibir dinero"}
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

  searchWrapper: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: COLORS.textLight, fontSize: FONT.md },

  sectionLabel: {
    color: COLORS.textMuted, fontSize: FONT.xs,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700",
  },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", borderWidth: 1,
  },
  avatarText: { fontSize: FONT.md, fontWeight: "800" },
  name: { color: COLORS.textLight, fontSize: FONT.md, fontWeight: "600" },
  email: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },
  meta: { color: COLORS.accent, fontSize: 10, fontWeight: "600", marginTop: 2 },

  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0, 212, 170, 0.15)",
    justifyContent: "center", alignItems: "center",
  },
  actionBtnDanger: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(249, 97, 103, 0.15)",
    justifyContent: "center", alignItems: "center",
  },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: COLORS.textLight, fontSize: FONT.lg, fontWeight: "700", marginTop: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 4, textAlign: "center", lineHeight: 20 },
});