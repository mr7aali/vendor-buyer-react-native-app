import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { LanguageCode } from "../../constants/translations";

type LanguageState = {
  language: LanguageCode;
};

const initialState: LanguageState = {
  language: "en",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export const selectLanguage = (state: RootState) => state.language.language;

export default languageSlice.reducer;
