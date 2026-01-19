import { create } from "zustand";
import { SystemSettings } from "../types/settings";

interface SettingsState{
    settings : SystemSettings
    setSettings : (settings : SystemSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings : {} as SystemSettings,

    setSettings : (settings) => set({settings}),
}));