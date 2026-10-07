import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Verifica tu identidad",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar PIN",
    disableDeviceFallback: true,
  });
  return result.success;
}