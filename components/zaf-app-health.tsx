"use client";

import { useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";

type Result={url:string;status?:number;ok?:boolean;reachable:boolean;responseTimeMs:number;https:boolean;redirect:boolean;error?:string;checkedAt:string};

export function ZafAppHealth({locale}:{locale:Locale}){
 const tr=(en:string,trText:string)=>locale==="tr"?trText:en;
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 const [loading,setLoading]=useState(false);
 async function check(){
   if(!url.trim()) return;
   setLoading(true); setResult(null);
   try{const r=await fetch("/api/apps/check?url="+encodeURIComponent(url.trim()),{cache:"no-store"}); setResult(await r.json());}
   catch{setResult({url:url.trim(),reachable:false,responseTimeMs:0,https:url.startsWith("https://"),redirect:false,checkedAt:new Date().toISOString(),error:"Request failed"});}
   finally{setLoading(false);}
 }
 return <section className="mt-5 sm:mt-7">
   <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("App Health", "Uygulama Sağlığı")}</h2><p className="text-[11px] text-muted-foreground">{tr("A lightweight server-side reachability and HTTPS check for public application URLs.", "Herkese açık uygulama URL'leri için temel sunucu tarafı erişilebilirlik ve HTTPS kontrolü.")}</p></div>
   <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex flex-col gap-2 sm:flex-row"><input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void check()}} placeholder="https://example.com" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"/><button type="button" onClick={()=>void check()} disabled={loading} className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50">{loading?tr("Checking…","Kontrol ediliyor…"):tr("Check URL","URL'yi kontrol et")}</button></div>
    {result?<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Reachability","Erişilebilirlik")}</div><div className="mt-1 text-sm font-semibold text-foreground">{result.reachable?tr("Online","Çevrimiçi"):tr("Offline","Çevrimdışı")}</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">HTTPS</div><div className="mt-1 text-sm font-semibold text-foreground">{result.https?"✓":"—"}</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{tr("Response","Yanıt")}</div><div className="mt-1 text-sm font-semibold text-foreground">{result.responseTimeMs} ms</div></div>
      <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">HTTP</div><div className="mt-1 text-sm font-semibold text-foreground">{result.status??"—"}</div></div>
    </div>:null}
    {result?.error?<div className="mt-3 text-[10px] text-muted-foreground">{result.error}</div>:null}
   </div>
 </section>
}
