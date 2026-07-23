import { Check, LockKeyhole } from "lucide-react";
import { PRICING_2026_06_30, type CoreCode } from "@mercurius/domain";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CorePackageSelect({ value, onChange }: { value: CoreCode; onChange: (code: CoreCode) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#263a2f]">Core package</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {PRICING_2026_06_30.cores.map((core) => {
          const selected = value === core.code;
          return (
            <label key={core.code} className={cn(
              "relative flex min-h-24 cursor-pointer flex-col rounded-xl border p-3.5 transition",
              selected ? "border-[#277457] bg-[#eff7f2] ring-1 ring-[#277457]" : "bg-white hover:border-[#9eb7aa]",
              core.customPricing && "cursor-not-allowed opacity-60",
            )}>
              <input className="sr-only" type="radio" name="core" value={core.code} checked={selected}
                disabled={core.customPricing} onChange={() => onChange(core.code)} />
              <span className="flex items-center justify-between gap-2 font-semibold">
                {core.name}
                {selected ? <Check className="size-4 text-[#176044]" /> : core.customPricing ? <LockKeyhole className="size-4" /> : null}
              </span>
              <span className="mt-auto pt-2 text-xs text-[#627168]">
                {core.customPricing ? "Manager-approved custom pricing" : `${money.format((core.setupCents ?? 0) / 100)} setup · ${money.format((core.monthlyCents ?? 0) / 100)}/mo`}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
