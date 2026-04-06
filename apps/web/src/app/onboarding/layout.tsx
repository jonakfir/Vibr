"use client";

import { usePathname } from "next/navigation";
import { StepIndicator } from "@/components/ui/step-indicator";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

const STEP_MAP: Record<string, { step: number; name: string }> = {
  "/onboarding/profile": { step: 1, name: "Profile" },
  "/onboarding/ideas": { step: 2, name: "Ideas" },
  "/onboarding/build": { step: 3, name: "Build" },
  "/onboarding/launch": { step: 4, name: "Launch" },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const setStep = useStore((s) => s.setStep);

  const current = STEP_MAP[pathname] ?? { step: 1, name: "Profile" };

  useEffect(() => {
    setStep(current.step);
  }, [current.step, setStep]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[960px] mx-auto px-6 pt-12 pb-6">
        <StepIndicator
          currentStep={current.step}
          stepName={current.name}
        />
      </div>
      <div className="px-6 pb-24">{children}</div>
    </div>
  );
}
