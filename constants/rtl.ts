import type { LanguageCode } from "@/constants/translations";
import { I18nManager, type StyleProp, type TextStyle } from "react-native";

export const RTL_LANGUAGE: LanguageCode = "he";

export const isRTLLanguage = (language: LanguageCode) => language === RTL_LANGUAGE;

export const getLayoutDirection = (language: LanguageCode) =>
  isRTLLanguage(language) ? "rtl" : "ltr";

export const syncRTLForLanguage = (language: LanguageCode) => {
  const isRTL = isRTLLanguage(language);
  const directionChanged = I18nManager.isRTL !== isRTL;

  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  I18nManager.forceRTL(isRTL);

  return {
    directionChanged,
    isRTL,
  };
};

export const getDirectionalIconStyle = (
  style?: StyleProp<TextStyle>,
): StyleProp<TextStyle> => [
  style,
  I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : null,
];

export const getMirroredTextAlign = () => (I18nManager.isRTL ? "left" : "right");
