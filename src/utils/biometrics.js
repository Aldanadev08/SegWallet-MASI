import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticateBiometric(prompt = "Autenticación requerida") {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: "Usar PIN",
      cancelLabel: "Cancelar",
    });
    return result.success;
  } catch {
    return false;
  }
}