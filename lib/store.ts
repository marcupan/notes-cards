import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

type State = {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | Id<"folders"> | null) => void;
};

export const useAppStore = create<State>((set) => ({
  selectedFolderId: null,
  setSelectedFolderId: (id) => set({ selectedFolderId: id as string | null }),
}));

