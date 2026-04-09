// Stub store - real implementation in iCloud
import { create } from "zustand";

interface StoreState {
  ideas: any[];
  profile: any;
  selectedIdea: any;
  productName: string;
  flowMode: string;
  projectDescription: string;
  prompt: string;
  deployUrl: string;
  projectPath: string;
  setProfile: (p: any) => void;
  setIdeas: (i: any[]) => void;
  setSelectedIdea: (i: any) => void;
  setProductName: (n: string) => void;
  setFlowMode: (m: string) => void;
  setProjectDescription: (d: string) => void;
  setPrompt: (p: string) => void;
  setDeployUrl: (u: string) => void;
  setProjectPath: (p: string) => void;
  [key: string]: any;
}

export const useStore = create<StoreState>((set) => ({
  ideas: [],
  profile: null,
  selectedIdea: null,
  productName: "",
  flowMode: "guided",
  projectDescription: "",
  prompt: "",
  deployUrl: "",
  projectPath: "",
  setProfile: (p) => set({ profile: p }),
  setIdeas: (i) => set({ ideas: i }),
  setSelectedIdea: (i) => set({ selectedIdea: i }),
  setProductName: (n) => set({ productName: n }),
  setFlowMode: (m) => set({ flowMode: m }),
  setProjectDescription: (d) => set({ projectDescription: d }),
  setPrompt: (p) => set({ prompt: p }),
  setDeployUrl: (u) => set({ deployUrl: u }),
  setProjectPath: (p) => set({ projectPath: p }),
}));

export default useStore;

export interface Idea {
  id: string;
  name: string;
  description: string;
  market_size: string;
  time_to_mvp: string;
  competition: string;
  category: string;
}
