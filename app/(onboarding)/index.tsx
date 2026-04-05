import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(onboarding)/PrivacyPolicy");
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#5BA5A5", "#E8F4F4", "#5BA5A5"]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View>
        <Image
          source={require("../../assets/images/imagelogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 600,
          paddingTop: 20,
        }}
      >
        Trade Smarter, Scale Faster!
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 220,
    height: 120,
  },
});
