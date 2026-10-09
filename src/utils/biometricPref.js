import { secureStore } from "./secureStore";

const key = (uid) => `biometric_enabled_${uid}`;

export async function isBiometricEnabled(uid) {
  if (!uid) return false;
  const val = await secureStore.getItem(key(uid));
  return val === "true";
}

export async function setBiometricEnabled(uid, enabled) {
  if (!uid) return;
  await secureStore.setItem(key(uid), enabled ? "true" : "false");
}