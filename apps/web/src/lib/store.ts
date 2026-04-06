import { create } from "zustand";

export interface Idea {
  id: string;
  sector: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export interface Marketer {
  id: string;
  name: string;
  avatar_url: string;
  specialty: string;
  bio: string;
  rating: number;
  projects_completed: number;
}

export interface Profile {
  full_name: string;
  skills: string[];
  experience_level: string;
  interests: string[];
  resume_url: string;
  linkedin_url: string;
}

interface OnboardingState {
  currentStep: number;
  profile: Profile;
  ideas: Idea[];
  selectedIdea: Idea | null;
  productName: string;
  prompt: string;
  marketers: Marketer[];
  selectedMarketers: Marketer[];
  sessionId: string | null;

  setStep: (step: number) => void;
  setProfile: (profile: Partial<Profile>) => void;
  setIdeas: (ideas: Idea[]) => void;
  setSelectedIdea: (idea: Idea | null) => void;
  setProductName: (name: string) => void;
  setPrompt: (prompt: string) => void;
  setMarketers: (marketers: Marketer[]) => void;
  setSelectedMarketers: (marketers: Marketer[]) => void;
  setSessionId: (id: string | null) => void;
}

export const useStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  profile: {
    full_name: "",
    skills: [],
    experience_level: "",
    interests: [],
    resume_url: "",
    linkedin_url: "",
  },
  ideas: [],
  selectedIdea: null,
  productName: "",
  prompt: "",
  marketers: [],
  selectedMarketers: [],
  sessionId: null,

  setStep: (step) => set({ currentStep: step }),
  setProfile: (profile) =>
    set((state) => ({ profile: { ...state.profile, ...profile } })),
  setIdeas: (ideas) => set({ ideas }),
  setSelectedIdea: (idea) => set({ selectedIdea: idea }),
  setProductName: (name) => set({ productName: name }),
  setPrompt: (prompt) => set({ prompt }),
  setMarketers: (marketers) => set({ marketers }),
  setSelectedMarketers: (marketers) => set({ selectedMarketers: marketers }),
  setSessionId: (id) => set({ sessionId: id }),
}));
