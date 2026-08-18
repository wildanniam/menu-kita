import { FlowPageShell } from "@/components/FlowPageShell";
import { GroupOverview } from "./GroupOverview";

export default function GroupPage() {
  return (
    <FlowPageShell
      current="/group"
      title="Your Group"
      description="Review everyone’s food profile before choosing a menu for the table."
      maxWidthClassName="max-w-4xl"
    >
      <GroupOverview />
    </FlowPageShell>
  );
}
