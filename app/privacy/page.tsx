"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-xs underline underline-offset-2">← Back to ZAF TECH</Link>
        <h1 className="mt-6 text-2xl font-bold">Privacy</h1>
        <p className="mt-2 text-xs text-muted-foreground">ZAF TECH Pi Intelligence v0.1.0</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground">Data scope</h2>
            <p className="mt-2">ZAF TECH is designed as a read-only technology project. It reads public Pi ecosystem and Mainnet sources and may run public URL checks requested by the user.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">No wallet access</h2>
            <p className="mt-2">The Developer Tools address inspector performs local format validation only. It does not access private keys, wallets, seed phrases or sign blockchain transactions.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Local preferences</h2>
            <p className="mt-2">Language and theme preferences may be stored locally in the browser. They are used to preserve the user's interface settings.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Public sources</h2>
            <p className="mt-2">Network and ecosystem information is derived from public sources. ZAF TECH does not claim that its observations represent the entire Pi Network.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Important boundary</h2>
            <p className="mt-2">ZAF TECH is an independent community-developed project and is not an official Pi Core Team product.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
