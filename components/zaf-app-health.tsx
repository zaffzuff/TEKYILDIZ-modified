"use client";

import { useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";

type Result = {
  url: string;
  status?: number | null;
  ok?: boolean;
  reachable: boolean;
  responseTimeMs: number;
  https: boolean;
  redirect: boolean;
  error?: string | null;
  checkedAt: string;
};

type BatchResult = {
  generatedAt: string;
  checked: number;
  limit: number;
  summary: { reachable: number; online: number; offline: number };
  results: Array<{ name: string; url: string; check: Result }>;
};

export function ZafAppHealth({locale}:{locale:Locale}){
 const tr=(en:string,trText:string)=>locale==="tr"?trText:en;
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 const [batch,setBatch]=useState<BatchResult|null>(null);
 const [loading,setLoading]=useState(false);
 const [batchLoading,setBatchLoading]=useState(false);

 async function check(){
   if(!url.trim()) return;
   setLoading(true); setResult(null);
   try{const r=await fetch("/api/apps/check?url="+encodeURIComponent(url.trim()),{cache:"no-store"}); setResult(await r.json());}
   catch{setResult({url:url.trim(),reachable:false,responseTimeMs:0,https:url.startsWith("https://"),redirect:false,checkedAt:new Date().toISOString(),error:"Request failed"});}
   finally{setLoading(false);}
 }

 async function checkEcosystem(){
   setBatchLoading(true); setBatch(null);
   try{
     const r=await fetch("/api/apps/health",{cache:"no-store"});
     if(!r.ok) throw new Error("Batch health check failed");
     setBatch(await r.json());
   }catch{
     setBatch(null);
   }finally{
     setBatchLoading(false);
   }
 }

 return <section className="mt-5 sm:mt-7">
   <div className="mb-3">
     <h2 className="text-sm font-semibold text-foreground">{tr("App Health","Uygulama Sağlığı")}</h2>
     <p className="text-[11px] text-muted-foreground">{tr("Server-side reachability and HTTPS checks for public application URLs.","Herkese açık uygulama URL'leri için sunucu tarafı erişilebilirlik ve HTTPS kontrolleri.")}</p>
   </div>
   <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex flex-col gap-2 sm:flex-row">
      <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void check()}} placeholder="https://example.com" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"/>
      <button type="button" onClick={()=>void check()} disabled={loading} className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50">{loading?tr("Checking…","Kontrol Ediliyor…"):tr("Check URL","URL'yi Kontrol Et")}</button>
    </div>
    {result?<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Reachability","Erişilebilirlik")}</div><div className="mt-1 text-sm font-semibold text-foreground">{result.reachable?tr("Online","Çevrimiçi"):tr("Offline","Çevrimdışı")}</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">HTTPS</div><div className="mt-1 text-sm font-semibold text-foreground">{result.https?"✓":"—"}</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Response","Yanıt")}</div><div className="mt-1 text-sm font-semibold text-foreground">{result.responseTimeMs} ms</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">HTTP</div><div className="mt-1 text-sm font-semibold text-foreground">{result.status??"—"}</div></div>
    </div>:null}
    {result?.error?<div className="mt-3 text-[10px] text-muted-foreground">{result.error}</div>:null}

    <div className="mt-5 border-t border-border pt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-foreground">{tr("Ecosystem Health Check","Ekosistem Sağlık Kontrolü")}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">{tr("Run a batch check against up to 20 applications currently exposed by the public ecosystem source.","Herkese açık ekosistem kaynağında şu anda açığa çıkan en fazla 20 uygulama için toplu kontrol çalıştırır.")}</p>
        </div>
        <button type="button" onClick={()=>void checkEcosystem()} disabled={batchLoading} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">{batchLoading?tr("Running Checks…","Kontroller Çalıştırılıyor…"):tr("Run Ecosystem Check","Ekosistem Kontrolünü Çalıştır")}</button>
      </div>
      {batch?<div className="mt-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Checked","Kontrol Edilen")}</div><div className="mt-1 text-sm font-semibold text-foreground">{batch.checked}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Online","Çevrimiçi")}</div><div className="mt-1 text-sm font-semibold text-foreground">{batch.summary.online}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Offline","Çevrimdışı")}</div><div className="mt-1 text-sm font-semibold text-foreground">{batch.summary.offline}</div></div>
        </div>
        <div className="mt-3 space-y-1.5">
          {batch.results.slice(0,8).map(item=><div key={item.url} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-[10px]">
            <span className="min-w-0 truncate text-foreground">{item.name}</span>
            <span className="shrink-0 text-muted-foreground">{item.check.reachable?tr("Reachable","Erişilebilir"):tr("Offline","Çevrimdışı")} · {item.check.responseTimeMs} ms</span>
          </div>)}
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground">{tr("Current batch is an observable snapshot. Historical storage and scheduled checks will be added in the Data phase.","Mevcut toplu kontrol gözlemlenebilir bir anlık örnektir. Geçmiş veri saklama ve zamanlanmış kontroller Data aşamasında eklenecektir.")}</div>
      </div>:null}
    </div>
   </div>
 </section>
}
