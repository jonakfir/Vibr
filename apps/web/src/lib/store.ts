// Stub store - real implementation in iCloud
import { create } from "zustand";

interface Profile {
  full_name: string;
  skills: string[];
  experience_level: string;
  interests: string[];
  resume_url: string;
  linkedin_url: string;
}

const emptyProfile: Profile = {
  full_name: "",
  skills: [],
  experience_level: "",
  interests: [],
  resume_url: "",
  linkedin_url: "",
};

interface StoreState {
  step: number;
  ideas: any[];
  profile: Profile;
  selectedIdea: any;
  productName: string;
  flowMode: string;
  projectDescription: string;
  prompt: string;
  deployUrl: string;
  projectPath: string;
  sessionId: string | null;
  marketers: any[];
  setStep: (s: number) => void;
  setProfile: (p: Partial<Profile>) => void;
  setIdeas: (i: any[]) => void;
  setSelectedIdea: (i: any) => void;
  setProductName: (n: string) => void;
  setFlowMode: (m: string) => void;
  setProjectDescription: (d: string) => void;
  setPrompt: (p: string) => void;
  setDeployUrl: (u: string) => void;
  setProjectPath: (p: string) => void;
  setSessionId: (id: string | null) => void;
  setMarketers: (m: any[]) => void;
  [key: string]: any;
}

export const useStore = create<StoreState>((set) => ({
  step: 1,
  ideas: [],
  profile: emptyProfile,
  selectedIdea: null,
  productName: "",
  flowMode: "guided",
  projectDescription: "",
  prompt: "",
  deployUrl: "",
  projectPath: "",
  sessionId: null,
  marketers: [],
  setStep: (s) => set({ step: s }),
  setProfile: (p) => set((state) => ({ profile: { ...state.profile, ...p } })),
  setIdeas: (i) => set({ ideas: i }),
  setSelectedIdea: (i) => set({ selectedIdea: i }),
  setProductName: (n) => set({ productName: n }),
  setFlowMode: (m) => set({ flowMode: m }),
  setProjectDescription: (d) => set({ projectDescription: d }),
  setPrompt: (p) => set({ prompt: p }),
  setDeployUrl: (u) => set({ deployUrl: u }),
  setProjectPath: (p) => set({ projectPath: p }),
  setSessionId: (id) => set({ sessionId: id }),
  setMarketers: (m) => set({ marketers: m }),
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
