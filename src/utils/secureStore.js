import * as SecureStore from "expo-secure-store";

export const secureStore = {
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await SecureStore.setItem(key, value);
    }
  },
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return SecureStore.getItem(key);
    }
  },
  deleteItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await SecureStore.deleteItem(key);
    }
  },
};