import { create } from 'zustand';

interface Metro {
    id: string;
    name: string;
    state: string;
    bbox: [number, number, number, number]; // [west, south, east, north]
    center: [number, number]; // [lng, lat]
}

interface MetroState {
    selectedMetro: Metro | null;
    metroOptions: Metro[];
    setSelectedMetro: (metro: Metro | null) => void;
    setMetroOptions: (options: Metro[]) => void;
}

export const useMetroStore = create<MetroState>((set) => ({
    selectedMetro: null,
    metroOptions: [],
    setSelectedMetro: (metro) => set({ selectedMetro: metro }),
    setMetroOptions: (options) => set({ metroOptions: options }),
}));

export type { Metro };
