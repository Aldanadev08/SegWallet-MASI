import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/Auth/LoginScreen";
import RegisterScreen from "./screens/Auth/RegisterScreen";
import PinScreen from "./screens/Auth/PinScreen";
import HomeScreen from "./screens/Home/HomeScreen";
import TransferScreen from "./screens/Transfer/TransferScreen";
import HistoryScreen from "./screens/History/HistoryScreen";
import ProfileScreen from "./screens/Profile/ProfileScreen";
import MyQRScreen from "./screens/QR/MyQRScreen";
import ScanQRScreen from "./screens/QR/ScanQRScreen";
import ReceiptScreen from "./screens/Receipt/ReceiptScreen";
import RequestScreen from "./screens/Request/RequestScreen";
import RequestsListScreen from "./screens/Request/RequestsListScreen";
import ChangePinScreen from "./screens/Security/ChangePinScreen";
import ContactsScreen from "./screens/Contacts/ContactsScreen";

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Pin" component={PinScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MyQR" component={MyQRScreen} />
        <Stack.Screen name="ScanQR" component={ScanQRScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="Request" component={RequestScreen} />
        <Stack.Screen name="RequestsList" component={RequestsListScreen} />
        <Stack.Screen name="ChangePin" component={ChangePinScreen} />
        <Stack.Screen name="Contacts" component={ContactsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}