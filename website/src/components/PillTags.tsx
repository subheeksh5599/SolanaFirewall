import { icons } from "./assets";
import { Pill, PillReveal } from "./shared";

export function PillTags() {
  return (
    <section className="bg-black pb-24">
      <div className="max-w-7xl mx-auto px-5 flex flex-col gap-3 lg:gap-5">
        <div className="flex flex-col lg:flex-row w-full gap-3 lg:gap-4">
          <PillReveal delay={0.3}>
            <Pill label="Developer & Validator" icon={icons.usersRound} bg="#D0C9B9" text="text-neutral-900" iconBg="bg-black/5" invertIcon />
          </PillReveal>
          <PillReveal delay={0.4}>
            <Pill label="SOL & SPL Tokens" icon={icons.imagePlus} bg="#131113" text="text-white" iconBg="bg-white/10" />
          </PillReveal>
          <PillReveal delay={0.5}>
            <Pill label="Anchor SDK" icon={icons.copy} bg="#F7C8FF" text="text-neutral-900" iconBg="bg-black/5" invertIcon />
          </PillReveal>
        </div>
        <div className="flex flex-col lg:flex-row w-full gap-3 lg:gap-4">
          <PillReveal delay={0.4}>
            <Pill label="Intent Registration" icon={icons.usersRound} bg="#131113" text="text-white" iconBg="bg-white/10" />
          </PillReveal>
          <PillReveal delay={0.5}>
            <Pill label="Open Source (MIT)" icon={icons.codeXml} bg="#131113" text="text-white" iconBg="bg-white/10" />
          </PillReveal>
          <PillReveal delay={0.6}>
            <Pill label="Audit Trail Events" icon={icons.webhook} bg="#81FFBD" text="text-neutral-900" iconBg="bg-black/5" invertIcon />
          </PillReveal>
        </div>
      </div>
    </section>
  );
}
