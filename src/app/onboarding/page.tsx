import { FlowPageShell } from "@/components/FlowPageShell";
import { QuestionnaireForm } from "./QuestionnaireForm";

export default function OnboardingPage() {
  return (
    <FlowPageShell
      current="/onboarding"
      title="Your Food Preference"
      description="Tell MenuKita what you need and what you enjoy before matching the group menu."
    >
      <QuestionnaireForm />
    </FlowPageShell>
  );
}
