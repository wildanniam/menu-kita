import { FlowNav } from "@/components/FlowNav";
import { PageHeaderCard } from "@/components/PageHeaderCard";
import { ResetJourneyButton } from "@/components/ResetJourneyButton";
import { pacifico } from "@/lib/fonts";
import { ResultsView } from "./ResultsView";

export default function ResultsPage() {
  return (
    <main className="flex min-h-screen w-full justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
        <PageHeaderCard
          nav={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FlowNav current="/results" />
              <ResetJourneyButton />
            </div>
          }
        >
          <h1
            style={{ color: "#7C2D12" }}
            className={`${pacifico.className} text-3xl sm:text-4xl`}
          >
            Who Can Have What
          </h1>
          <ResultsView />
        </PageHeaderCard>
      </div>
    </main>
  );
}
