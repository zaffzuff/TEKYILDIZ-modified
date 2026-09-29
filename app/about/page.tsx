"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-xs underline underline-offset-2">← Back to ZAF TECH</Link>
        <h1 className="mt-6 text-2xl font-bold">About ZAF TECH</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pi Ecosystem Intelligence</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground">What it is</h2>
            <p className="mt-2">ZAF TECH is an independent, read-only technology layer for discovering, checking and observing public Pi Network ecosystem data.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Current scope</h2>
            <p className="mt-2">The v0.1.0 scope includes the ecosystem dashboard, App Directory, App Details, App URL Checker, Mainnet Network view and Developer Tools, with English and Turkish interface support.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Verification principle</h2>
            <p className="mt-2">ZAF TECH separates observed facts from unverified claims. Pi-specific capabilities are not marked as verified unless an observable check supports them.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Future direction</h2>
            <p className="mt-2">Future phases may add Pi SDK integration, authentication, richer data collection, historical monitoring, APIs and AI analysis. These are not required for the initial release.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
