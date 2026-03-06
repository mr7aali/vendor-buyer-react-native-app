import { Tabs } from "expo-router";
import {
  Home,
  MessageCircle,
  Package,
  ShoppingBag,
  User,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";
import React from "react";
import { Image, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function UsersLayout() {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user as any);
  const profileImageUri =
    user?.buyer?.profilePhotoUrl ||
    user?.buyer?.avatar ||
    user?.avatar ||
    user?.image ||
    user?.logo ||
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
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab_chat", "Chat"),
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: t("tab_order", "Order"),
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tab_cart", "Cart"),
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab_profile", "Profile"),
          tabBarIcon: ({ color }) =>
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
              <User size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="categoriesScreen"
        options={{
          title: t("tab_categories", "Categories"),
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
      <Tabs.Screen
        name="Information"
        options={{
          title: t("tab_information", "Information"),
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
