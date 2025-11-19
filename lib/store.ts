import { create } from "zustand";

type State = {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
};

export const useAppStore = create<State>((set) => ({
  selectedFolderId: null,
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
}));

