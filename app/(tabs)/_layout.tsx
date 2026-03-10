import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTranslation } from "@/hooks/use-translation";
import { Tabs } from "expo-router";
import React from "react";
import { Image, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function TabLayout() {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user as any);
  const profileImageUri =
    user?.vendor?.logoUrl ||
    user?.vendor?.logo ||
    user?.logo ||
    user?.avatar ||
    user?.image ||
    user?.profilePhotoUrl ||
    "";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2A8383",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 10,
          height: 85,
          direction: "ltr",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab_home", "Home"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="product"
        options={{
          title: t("tab_product", "Product"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather name="shopping-cart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: t("tab_order", "Order"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather name="package" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab_chat", "Chat"),
          tabBarIcon: ({ color }: { color: string }) => (
            <AntDesign name="message" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab_profile", "Profile"),
          tabBarIcon: ({ color }: { color: string }) =>
            profileImageUri ? (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: color,
                }}
              >
                <Image
                  source={{ uri: profileImageUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
            ) : (
              <FontAwesome5 name="user-circle" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="electronics-products"
        options={{
          title: t("tab_electronics", "Electronics"),
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
          tabBarStyle: {
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
            display: "flex",
          },
        }}
      />
    </Tabs>
  );
}
