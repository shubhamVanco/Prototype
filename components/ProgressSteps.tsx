import { cn } from "@/lib/cn";

export function ProgressSteps({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={`Step ${step} of ${total}`}>
      <span className="tabular text-sm text-muted">Step {step} of {total}</span>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <div className={cn("h-full rounded-full bg-ink transition-all duration-300", i < step ? "w-full" : "w-0")} />
          </div>
        ))}
      </div>
    </div>
  );
}
