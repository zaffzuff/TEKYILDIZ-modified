"use client";

import { useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";

export function ZafDeveloperTools({locale}:{locale:Locale}){
 const tr=(en:string,trText:string)=>locale==="tr"?trText:en;
 const [address,setAddress]=useState("");
 const [tx,setTx]=useState("");
 const [txResult,setTxResult]=useState<Record<string,unknown>|null>(null);
 const [loading,setLoading]=useState(false);
 const valid=/^G[A-Z2-7]{55}$/.test(address.trim().toUpperCase());
 async function lookup(){
   if(!tx.trim())return;
   setLoading(true);setTxResult(null);
   try{const r=await fetch("/api/tools/transaction?id="+encodeURIComponent(tx.trim()),{cache:"no-store"});setTxResult(await r.json());}
   catch{setTxResult({error:"Request failed"});}finally{setLoading(false);}
 }
 return <section className="mt-5 sm:mt-7">
  <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("Developer Tools","Geliştirici Araçları")}</h2><p className="text-[11px] text-muted-foreground">{tr("Small, free utilities built around observable Pi data. More tools will be added incrementally.","Gözlemlenebilir Pi verileri etrafında oluşturulan küçük, ücretsiz araçlar. Yeni araçlar kademeli olarak eklenecek.")}</p></div>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
   <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-semibold text-foreground">{tr("Pi Address Inspector","Pi Adres İnceleyici")}</div><div className="mt-1 text-[10px] text-muted-foreground">{tr("Local format validation only; no wallet access.","Yalnızca yerel format doğrulaması; cüzdan erişimi yok.")}</div><input value={address} onChange={e=>setAddress(e.target.value.toUpperCase())} placeholder="G..." className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-ring"/><div className="mt-2 text-[10px] text-muted-foreground">{address?valid?tr("Format valid","Format geçerli"):tr("Format invalid","Format geçersiz"):tr("Enter a public Pi address","Herkese açık Pi adresi girin")}</div></div>
   <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-semibold text-foreground">{tr("Transaction Lookup","İşlem Sorgulama")}</div><div className="mt-1 text-[10px] text-muted-foreground">{tr("Queries Pi Mainnet Horizon for a transaction hash.","Pi Mainnet Horizon üzerinden transaction hash sorgular.")}</div><input value={tx} onChange={e=>setTx(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void lookup()}} placeholder={tr("Transaction hash","Transaction hash")} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-ring"/><button type="button" onClick={()=>void lookup()} disabled={loading} className="mt-2 rounded-lg border border-border px-3 py-2 text-[10px] font-medium text-foreground disabled:opacity-50">{loading?tr("Looking up…","Sorgulanıyor…"):tr("Lookup","Sorgula")}</button>{txResult?<pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-background p-2 text-[9px] text-muted-foreground">{JSON.stringify(txResult,null,2)}</pre>:null}</div>
  </div>
 </section>
}
