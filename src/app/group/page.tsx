import { FlowNav } from "@/components/FlowNav";
import { PageHeaderCard } from "@/components/PageHeaderCard";
import { ResetJourneyButton } from "@/components/ResetJourneyButton";
import { pacifico } from "@/lib/fonts";
import { GroupOverview } from "./GroupOverview";

const DECORATIVE_DOTS = ["#AD390B", "#385610", "#D97706", "#7C2D12"];

export default function GroupPage() {
  return (
    <main className="flex min-h-screen w-full justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
        <PageHeaderCard
          nav={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FlowNav current="/group" />
              <ResetJourneyButton />
            </div>
          }
        >
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
            className={`${pacifico.className} text-3xl sm:text-4xl`}
          >
            Your Group
          </h1>
          <GroupOverview />
        </PageHeaderCard>
      </div>
    </main>
  );
}
