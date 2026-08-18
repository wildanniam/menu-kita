import { FlowPageShell } from "@/components/FlowPageShell";
import { MenuScanForm } from "./MenuScanForm";

export default function ScanPage() {
  return (
    <FlowPageShell
      current="/scan"
      title="Scan the Menu"
      description="Take a photo of the menu, or upload one from your device."
    >
      <MenuScanForm />
    </FlowPageShell>
  );
}
