import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "wallets", uid), {
        balance: 1000.00,
        currency: "GTQ",
        createdAt: serverTimestamp(),
      });

      navigation.replace("Home");
    } catch (error) {
      let msg = "Error al registrar";
      if (error.code === "auth/email-already-in-use") msg = "Este correo ya está registrado";
      if (error.code === "auth/invalid-email") msg = "Correo inválido";
      if (error.code === "auth/weak-password") msg = "Contraseña muy débil";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Únete a SegWallet</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#999" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Confirmar contraseña" placeholderTextColor="#999" secureTextEntry value={confirm} onChangeText={setConfirm} />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrarse</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", justifyContent: "center", paddingHorizontal: 30 },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  subtitle: { fontSize: 14, color: "#7B8CA6", marginTop: 5 },
  form: { width: "100%" },
  input: { backgroundColor: "#1A2744", borderRadius: 12, padding: 16, fontSize: 16, color: "#FFFFFF", marginBottom: 15, borderWidth: 1, borderColor: "#2A3A5C" },
  button: { backgroundColor: "#2E86C1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10, marginBottom: 20 },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  linkText: { color: "#7B8CA6", textAlign: "center", fontSize: 14 },
  link: { color: "#2E86C1", fontWeight: "bold" },
});