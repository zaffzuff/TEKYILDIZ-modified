"use client";

import { APP_NAME, CONFIDENCE, STATUS } from "@/lib/tekyildiz/data";
import { Card, ConfidenceBadge, StatusBadge } from "./ui";
import { IconEye, IconInfo, IconLock, IconShield, IconSource, Logo } from "./icons";

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-ty-gold">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground text-pretty">
        {children}
      </div>
    </Card>
  );
}

export function AboutScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-6">
      <header className="pt-5">
        <div className="flex items-center gap-2">
          <IconInfo className="text-ty-gold" width={22} height={22} />
          <h1 className="text-xl font-bold text-foreground">About</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Transparency about what TEKYILDIZ is, how it works, and what it never does.
        </p>
      </header>

      <div className="ty-hero-grad mt-4 flex items-center gap-3 rounded-xl border border-border p-4">
        <Logo width={40} height={40} />
        <div>
          <h2 className="text-lg font-bold ty-brand-text">{APP_NAME}</h2>
          <p className="text-[11px] text-muted-foreground">
            A neutral, read-only Pi ecosystem activity tracker.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Block icon={<IconInfo width={17} height={17} />} title="What TEKYILDIZ is — and is not">
          <p>
            {APP_NAME} is a global, mobile-first monitoring surface for discovering and tracking Pi
            ecosystem apps, projects, updates and activity trends.
          </p>
          <p>
            It is <span className="font-medium text-foreground">not</span> an official Pi Core Team
            product, and it presents no hype, promotional language, or price speculation.
          </p>
        </Block>

        <Block icon={<IconSource width={17} height={17} />} title="How data is collected">
          <p>
            The interface consumes data through a single, clean data layer. Today that layer serves
            bundled sample data; it is built so trusted external sources can be plugged in later
            without changing the interface.
          </p>
          <p>
            No real-time or official data is ever invented. Sample and partial data are always
            labelled honestly.
          </p>
        </Block>

        <Block icon={<IconShield width={17} height={17} />} title="Two independent labels">
          <p>
            Every item carries two separate labels. They use different shapes and colors so they can
            never be confused.
          </p>
          <div className="mt-2 space-y-2.5">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
                Data confidence — certainty about the information
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CONFIDENCE.map((c) => (
                  <ConfidenceBadge key={c.id} confidence={c.id} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
                Functional status — the state of the app or project
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS.map((s) => (
                  <StatusBadge key={s.id} status={s.id} />
                ))}
              </div>
            </div>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {CONFIDENCE.map((c) => (
              <li key={c.id}>
                <span className="font-medium text-foreground">{c.label}:</span> {c.blurb}
              </li>
            ))}
          </ul>
        </Block>

        <Block icon={<IconInfo width={17} height={17} />} title="Network signals policy">
          <p>
            Network signals are shown only when a documented, trusted source actually reports them.
            TEKYILDIZ never infers, extrapolates, or fabricates network activity.
          </p>
          <p>
            When a measurement is missing, it is shown as{" "}
            <span className="font-medium text-foreground">Unavailable</span> — never guessed.
          </p>
        </Block>

        <Block icon={<IconEye width={17} height={17} />} title="Read-only by design">
          <p>
            You can browse, filter, sort and view details. You cannot submit, edit, comment on, or
            otherwise modify tracked data. Nothing you do here changes ecosystem records.
          </p>
        </Block>

        <Block icon={<IconLock width={17} height={17} />} title="Privacy">
          <p>
            TEKYILDIZ never requests wallet data, private keys, or any sensitive information. Your
            saved view preferences are the only thing kept with your account.
          </p>
        </Block>

        <Block icon={<IconSource width={17} height={17} />} title="Looking ahead">
          <p>
            The data layer is ready for the future integration of trusted external data sources, and
            all text is structured so more languages can be added without rework.
          </p>
        </Block>
      </div>

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        {APP_NAME} · English · Read-only reference
      </p>
    </div>
  );
}
