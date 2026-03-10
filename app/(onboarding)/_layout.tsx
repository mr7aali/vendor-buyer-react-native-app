import { Stack } from "expo-router";
import { getLayoutDirection } from "@/constants/rtl";
import { useTranslation } from "@/hooks/use-translation";
 
export default function OnboardingLayout() {
  const { language } = useTranslation();
  const isRTL = getLayoutDirection(language) === "rtl";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { direction: isRTL ? "rtl" : "ltr" },
      }}
    />
  );
}
