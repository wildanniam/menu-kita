import { FlowNav } from "@/components/FlowNav";
import { MenuScanForm } from "./MenuScanForm";

const DECORATIVE_DOTS = ["#AD390B", "#385610", "#D97706", "#7C2D12"];

export default function ScanPage() {
  return (
    <main
      style={{ backgroundColor: "#F5E6C8" }}
      className="flex min-h-screen w-full justify-center px-4 py-10 sm:px-6 sm:py-16"
    >
      <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-3">
          <FlowNav current="/scan" />
          <div className="flex gap-1.5" aria-hidden="true">
            {DECORATIVE_DOTS.map((color) => (
              <span
                key={color}
                style={{ backgroundColor: color }}
                className="h-2 w-2 rounded-full"
              />
            ))}
          </div>
          <h1
            style={{ color: "#7C2D12" }}
            className="text-3xl font-extrabold sm:text-4xl"
          >
            Scan the Menu
          </h1>
          <p className="text-sm text-neutral-600">
            Take a photo of the menu, or upload one from your device.
          </p>
        </div>
        <MenuScanForm />
      </div>
    </main>
  );
}
