import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from "react-native";
import { collection, query, where, getDocs, doc, runTransaction, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { isBiometricAvailable, authenticateWithBiometrics } from "../../utils/biometrics";

export default function TransferScreen({ navigation }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!recipientEmail || !amount) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    const senderUid = auth.currentUser.uid;
    const senderEmail = auth.currentUser.email;

    if (recipientEmail.trim() === senderEmail) {
      Alert.alert("Error", "No puedes transferirte a ti mismo");
      return;
    }

    // Confirmación biométrica antes de transferir
    const bioAvailable = await isBiometricAvailable();
    if (bioAvailable) {
      const success = await authenticateWithBiometrics();
      if (!success) {
        Alert.alert("Error", "Autenticación biométrica fallida. Transferencia cancelada.");
        return;
      }
    }

    setLoading(true);
    try {
      // Buscar destinatario
      const q = query(collection(db, "users"), where("email", "==", recipientEmail.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Error", "No se encontró un usuario con ese correo");
        setLoading(false);
        return;
      }

      const recipientUid = snapshot.docs[0].id;
      const recipientName = snapshot.docs[0].data().name;

      // Transacción atómica
      await runTransaction(db, async (transaction) => {
        const senderWalletRef = doc(db, "wallets", senderUid);
        const recipientWalletRef = doc(db, "wallets", recipientUid);

        const senderWallet = await transaction.get(senderWalletRef);
        const recipientWallet = await transaction.get(recipientWalletRef);

        if (!senderWallet.exists() || !recipientWallet.exists()) {
          throw new Error("Wallet no encontrada");
        }

        const senderBalance = senderWallet.data().balance;
        if (senderBalance < parsedAmount) {
          throw new Error("Saldo insuficiente");
        }

        transaction.update(senderWalletRef, { balance: senderBalance - parsedAmount });
        transaction.update(recipientWalletRef, { balance: recipientWallet.data().balance + parsedAmount });
      });

      // Registrar transacción
      await addDoc(collection(db, "transactions"), {
        senderId: senderUid,
        senderEmail: senderEmail,
        recipientId: recipientUid,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName,
        amount: parsedAmount,
        type: "transfer",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Éxito", `Q ${parsedAmount.toFixed(2)} enviados a ${recipientName}`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo completar la transferencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Transferir</Text>
      <Text style={styles.subtitle}>Envía dinero a otro usuario de SegWallet</Text>

      <TextInput style={styles.input} placeholder="Correo del destinatario" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={recipientEmail} onChangeText={setRecipientEmail} />
      <TextInput style={styles.input} placeholder="Monto (Q)" placeholderTextColor="#999" keyboardType="numeric" value={amount} onChangeText={setAmount} />

      <TouchableOpacity style={styles.button} onPress={handleTransfer} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 25, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backText: { color: "#2E86C1", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#7B8CA6", marginBottom: 30 },
  input: { backgroundColor: "#1A2744", borderRadius: 12, padding: 16, fontSize: 16, color: "#FFFFFF", marginBottom: 15, borderWidth: 1, borderColor: "#2A3A5C" },
  button: { backgroundColor: "#27AE60", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});