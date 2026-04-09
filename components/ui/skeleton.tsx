import React from "react";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

type SkeletonBlockProps = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const opacity = React.useRef(new Animated.Value(0.42)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.88,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#DDE7E6",
    overflow: "hidden",
  },
});
