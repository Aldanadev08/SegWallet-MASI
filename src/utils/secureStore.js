import * as SecureStore from "expo-secure-store";

export async function savePin(pin) {
  await SecureStore.setItem("user_pin", pin);
}

export async function getPin() {
  return SecureStore.getItem("user_pin");
}

export async function deletePin() {
  await SecureStore.deleteItem("user_pin");
}