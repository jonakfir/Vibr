"use client";

interface StepIndicatorProps {
  currentStep: number;
  stepName: string;
}

export function StepIndicator({ currentStep, stepName }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <p className="font-body text-[11px] uppercase tracking-wide text-muted mb-3">
        Step {currentStep} of 4 &mdash; {stepName}
      </p>
      <div className="w-full h-px bg-border" />
    </div>
  );
}
