import { Check, Info, Megaphone, Wrench } from "lucide-react";
import { PRICING_2026_06_30, type EnhancementCode, type EnhancementProduct } from "@mercurius/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Group({ title, detail, icon, products, selected, toggle }: {
  title: string; detail: string; icon: React.ReactNode; products: EnhancementProduct[];
  selected: EnhancementCode[]; toggle: (code: EnhancementCode) => void;
}) {
  return <div className="rounded-xl border bg-[#fbfcfb] p-3.5">
    <div className="mb-3 flex items-start gap-2.5">
      <span className="mt-0.5 rounded-lg bg-white p-2 text-[#33634f] shadow-sm">{icon}</span>
      <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs leading-5 text-[#6a776f]">{detail}</p></div>
    </div>
    <div className="space-y-2">{products.map((product) => {
      const active = selected.includes(product.code);
      return <label key={product.code} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition", active ? "border-[#4a8e70] ring-1 ring-[#4a8e70]" : "hover:border-[#aac0b4]") }>
        <input className="sr-only" type="checkbox" checked={active} onChange={() => toggle(product.code)} />
        <span className={cn("grid size-5 shrink-0 place-items-center rounded border", active ? "border-[#176044] bg-[#176044] text-white" : "bg-white")}>
          {active && <Check className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium">{product.name}</span>
        <span className="text-xs font-semibold text-[#52645a]">{money.format(product.monthlyCents / 100)}/mo</span>
      </label>;
    })}</div>
  </div>;
}

export function EnhancementPicker({ selected, onChange }: { selected: EnhancementCode[]; onChange: (codes: EnhancementCode[]) => void }) {
  const products = [...PRICING_2026_06_30.enhancements];
  const toggle = (code: EnhancementCode) => onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code]);
  return <fieldset>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <legend className="text-sm font-semibold text-[#263a2f]">Enhancements</legend>
      <Badge>{selected.length} selected</Badge>
    </div>
    <div className="mb-3 flex gap-2 rounded-xl border border-[#d8e4dc] bg-[#f1f7f3] p-3 text-xs leading-5 text-[#3d5b4b]">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p><strong>Software</strong> receives the full core-tier discount plus bundle savings. <strong>Services</strong> use a protected discount cap and never receive bundle savings.</p>
    </div>
    <div className="grid gap-3 xl:grid-cols-2">
      <Group title="Software" detail="Tier + bundle discounts, up to the 38% line cap" icon={<Wrench className="size-4" />}
        products={products.filter((item) => item.classification === "software")} selected={selected} toggle={toggle} />
      <Group title="Services & media" detail="Service caps apply; Ads Command is discount-exempt" icon={<Megaphone className="size-4" />}
        products={products.filter((item) => item.classification !== "software")} selected={selected} toggle={toggle} />
    </div>
  </fieldset>;
}
