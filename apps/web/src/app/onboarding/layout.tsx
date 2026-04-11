"use client";

import { usePathname } from "next/navigation";
import { StepIndicator } from "@/components/ui/step-indicator";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

const STEP_MAP: Record<string, { step: number; name: string }> = {
  "/onboarding/profile": { step: 1, name: "Profile" },
  "/onboarding/ideas": { step: 2, name: "Ideas" },
  "/onboarding/build": { step: 3, name: "Build" },
  "/onboarding/deploy": { step: 4, name: "Deploy" },
  "/onboarding/launch": { step: 5, name: "Launch" },
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

  // The IDE / build page is full-screen by design — no step indicator,
  // no extra padding, no footer (the root layout handles that). It
  // wants every available pixel under the nav.
  const isFullScreen = pathname === "/onboarding/build";

  if (isFullScreen) {
    // h-screen + overflow-hidden locks the page to one viewport so the
    // chat panel scrolls internally instead of pushing the page taller
    // as the assistant streams. The pt-24 makes room for the fixed nav.
    return (
      <div className="bg-background h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 pt-24">{children}</div>
      </div>
    );
  }

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
