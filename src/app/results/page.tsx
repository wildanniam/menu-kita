import { FlowPageShell } from "@/components/FlowPageShell";
import { ResultsView } from "./ResultsView";

export default function ResultsPage() {
  return (
    <FlowPageShell
      current="/results"
      title="Who Can Have What"
      description="Choose a person for a focused answer, or open All for the full group overview."
      maxWidthClassName="max-w-6xl"
    >
      <ResultsView />
    </FlowPageShell>
  );
}
