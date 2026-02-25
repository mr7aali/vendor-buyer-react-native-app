import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, type LanguageCode } from "@/constants/translations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLanguage, setLanguage } from "@/store/slices/languageSlice";

const STORAGE_KEY = "app_language";

export const useTranslation = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);

  const t = (key: string, fallback?: string) =>
    translations[language][key] || fallback || key;

  const setAppLanguage = async (next: LanguageCode) => {
    dispatch(setLanguage(next));
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return {
    language,
    setAppLanguage,
    t,
  };
};
