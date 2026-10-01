"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import type { ZafSnapshot } from "@/lib/zaf/types";
import { ZafNodeIntelligence } from "@/components/zaf-node-intelligence";
import { ZafNodeHistory } from "@/components/zaf-node-history";

type Resources = {
  host?: { cpuPercent?: number|null; memory?: { usedBytes?: number|null; totalBytes?: number|null; usedPercent?: number|null }; disk?: { drive?: string; usedPercent?: number|null }; network?: { receivedBytes?: number|null; sentBytes?: number|null } }|null;
  docker?: { cpuPercent?: number|null; memory?: { usedBytes?: number|null; limitBytes?: number|null }; network?: { receivedBytes?: number|null; sentBytes?: number|null }; blockIO?: { readBytes?: number|null; writeBytes?: number|null } }|null;
  wsl?: { available?: boolean; distributions?: Array<{ state?: string }> }|null;
};
type Health = { version?: string; supportedProtocols?: number[] };

function bytes(v:number|null|undefined){if(v==null||!Number.isFinite(v))return "—";const u=["B","KB","MB","GB","TB"];let n=v,i=0;while(n>=1024&&i<4){n/=1024;i++;}return n.toFixed(n>=10||i===0?0:1)+" "+u[i];}
function pct(v:number|null|undefined){return v==null||!Number.isFinite(v)?"—":v.toFixed(1)+"%";}
function Card({title,value,detail}:{title:string;value:string;detail:string}){return <div className="rounded-xl border border-border bg-card p-3 sm:p-4"><div className="text-xl font-bold ty-nums text-foreground">{value}</div><div className="mt-1 text-xs font-medium text-foreground">{title}</div><div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</div></div>;}
function Source({href,children}:{href:string;children:ReactNode}){return <a href={href} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">{children}</a>;}

function SoloHost({locale}:{locale:Locale}){
 const tr=locale==="tr";
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">SoloHost</h2><p className="text-[11px] text-muted-foreground">{tr?"Pi Desktop üzerindeki self-hosted uygulama katmanının resmi durumunu ve doğrulanmış kullanım alanlarını gösterir.":"Official status and documented use cases of the self-hosted application layer in Pi Desktop."}</p></div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Card title={tr?"Platform Durumu":"Platform Status"} value="Beta" detail={tr?"SoloHost, Pi2Day 2026 ile açık ve permissionless bir framework olarak tanıtıldı.":"SoloHost was introduced at Pi2Day 2026 as an open, permissionless framework."}/>
 <Card title="Pi Desktop" value="0.6.3" detail={tr?"9 Eylül 2026 güncellemesi keşif, güvenilirlik ve geliştirici araçlarını geliştirdi.":"The September 9, 2026 update improved discovery, reliability, and developer tooling."}/>
 <Card title={tr?"Çalıştırma Modeli":"Execution Model"} value={tr?"Yerel":"Local"} detail={tr?"Uygulamalar kullanıcının kendi bilgisayarında çalışır; mobil erişim Pi Browser üzerinden desteklenir.":"Apps run on the user's own computer, with mobile access through Pi Browser."}/>
 <Card title={tr?"Keşif Sinyali":"Discovery Signal"} value="Running counts" detail={tr?"0.6.3 ile uygulamalar mevcut çalıştırılma sayılarına göre sıralanabiliyor.":"Version 0.6.3 introduced ranking by current running counts."}/>
 </div>
 <div className="mt-3 rounded-xl border border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">{tr?"Son resmi gelişmeler":"Latest Official Developments"}</div><p className="mt-1">{tr?"14 Ağustos 2026'da beş gönüllü Node runner ile ilk dağıtık hesaplama testi tamamlandı. 27 Ağustos'ta OpenClaw ve Atlassian MCP Server öne çıkan SoloHost uygulamalarına eklendi.":"On August 14, 2026, an initial distributed-computing test was completed with five volunteer Node runners. On August 27, OpenClaw and Atlassian MCP Server were featured."}</p><div className="mt-2 flex flex-wrap gap-3"><Source href="https://minepi.com/blog/solohost-pi-desktop-0-6-3/">Pi Desktop 0.6.3</Source><Source href="https://minepi.com/blog/pi-node-0-6-2/">Node 0.6.2 / Compute Test</Source><Source href="https://minepi.com/blog/new-solohost-apps/">SoloHost Apps</Source></div></div>
 </section>;
}

function Compute({locale}:{locale:Locale}){
 const tr=locale==="tr";
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Compute</h2><p className="text-[11px] text-muted-foreground">{tr?"Pi Node kaynaklarının blockchain dışında hesaplama amacıyla kullanımına ilişkin resmi durum.":"Official status of using Pi Node resources for computing beyond blockchain infrastructure."}</p></div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Card title={tr?"Kullanım Durumu":"Use-Case Status"} value={tr?"Test edildi":"Tested"} detail={tr?"SoloHost üzerinden gerçek cihazlarla uçtan uca dağıtık hesaplama testi yapıldı.":"An end-to-end distributed-computing test was completed through SoloHost."}/>
 <Card title={tr?"Test Katılımcıları":"Test Participants"} value="5" detail={tr?"14 Ağustos 2026 resmi duyurusundaki ilk test.":"The initial test described in the August 14, 2026 official update."}/>
 <Card title={tr?"Kaynak Modeli":"Resource Model"} value="Opt-in" detail={tr?"Node operatörleri kullanılabilir hesaplama kapasitesini üçüncü taraf iş yüklerine açmayı seçebilir.":"Node operators can opt in to make available computing capacity usable by third-party workloads."}/>
 <Card title={tr?"Ücretlendirme Modeli":"Compensation Model"} value={tr?"Üçüncü taraf":"Third-party"} detail={tr?"Resmi açıklama uygun iş yüklerinde Pi ile telafi modelini tanımlıyor.":"The official update describes Pi compensation by third-party clients for suitable workloads."}/>
 </div>
 <div className="mt-3 rounded-xl border border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">{tr?"ZAF TECH Sınırı":"ZAF TECH Boundary"}</div><p className="mt-1">{tr?"Küresel compute kapasitesi, aktif iş yükleri veya gerçek zamanlı compute kazançları için doğrulanmış bir veri akışı yok; bu nedenle ZAF TECH bunları uydurmuyor.":"There is no verified live feed for global compute capacity, active workloads, or real-time compute earnings, so ZAF TECH does not fabricate them."}</p><div className="mt-2"><Source href="https://minepi.com/blog/openmind-case-study/">Pi Node Decentralized Computing Case Study</Source></div></div>
 </section>;
}

function Infrastructure({locale}:{locale:Locale}){
 const tr=locale==="tr";const[health,setHealth]=useState<Health|null>(null);const[r,setR]=useState<Resources|null>(null);const[online,setOnline]=useState<boolean|null>(null);
 useEffect(()=>{const load=async()=>{try{const[h,x]=await Promise.all([fetch("http://127.0.0.1:39100/health",{cache:"no-store"}),fetch("http://127.0.0.1:39100/resources",{cache:"no-store"})]);if(!h.ok)throw new Error();setHealth(await h.json());setR(x.ok?await x.json():null);setOnline(true);}catch{setHealth(null);setR(null);setOnline(false);}};void load();const id=window.setInterval(()=>void load(),15000);return()=>window.clearInterval(id);},[]);
 const dist=r?.wsl?.distributions?.filter(d=>d.state==="running").length??0;
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Infrastructure</h2><p className="text-[11px] text-muted-foreground">{tr?"Yerel Connector, Docker ve WSL kaynak gözlemleri.":"Local Connector, Docker, and WSL resource observations."}</p></div>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
 <Card title="Connector" value={online?(tr?"Bağlı":"Connected"):(tr?"Çevrimdışı":"Offline")} detail={health?.version?(tr?"Sürüm ":"Version ")+health.version:"127.0.0.1:39100"}/>
 <Card title="CPU" value={pct(r?.host?.cpuPercent)} detail={tr?"Host CPU Kullanımı":"Host CPU usage"}/>
 <Card title={tr?"Bellek":"Memory"} value={pct(r?.host?.memory?.usedPercent)} detail={r?.host?.memory?bytes(r.host.memory.usedBytes)+" / "+bytes(r.host.memory.totalBytes):"—"}/>
 <Card title="Disk" value={pct(r?.host?.disk?.usedPercent)} detail={r?.host?.disk?.drive??"C:"}/>
 <Card title="Docker" value={pct(r?.docker?.cpuPercent)} detail={r?.docker?.memory?bytes(r.docker.memory.usedBytes)+" / "+bytes(r.docker.memory.limitBytes):(tr?"Container Kaynak Kullanımı":"Container Resource Usage")}/>
 <Card title="WSL" value={r?.wsl?.available?String(dist):"—"} detail={tr?"Çalışan Dağıtımlar":"Running Distributions"}/>
 </div>
 <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-card p-4 text-[11px]"><div className="font-medium text-foreground">{tr?"Connector protokol desteği":"Connector Protocol Support"}</div><div className="mt-1 text-muted-foreground">{health?.supportedProtocols?.length?health.supportedProtocols.map(p=>"v"+p).join(" · "):"—"}</div><div className="mt-2 text-muted-foreground">{tr?"Connector salt-okunur çalışır ve Docker'ı uzaktan açmaz.":"The Connector is read-only and does not expose Docker remotely."}</div></div><div className="rounded-xl border border-border bg-card p-4 text-[11px]"><div className="font-medium text-foreground">{tr?"Ağ Ve Container I/O":"Network And Container I/O"}</div><div className="mt-1 text-muted-foreground">Host: {bytes(r?.host?.network?.receivedBytes)} ↓ · {bytes(r?.host?.network?.sentBytes)} ↑</div><div className="mt-1 text-muted-foreground">Docker: {bytes(r?.docker?.network?.receivedBytes)} ↓ · {bytes(r?.docker?.network?.sentBytes)} ↑</div><div className="mt-1 text-muted-foreground">Block I/O: {bytes(r?.docker?.blockIO?.readBytes)} ↓ · {bytes(r?.docker?.blockIO?.writeBytes)} ↑</div></div></div>
 </section>;
}

export function ZafNodeCompute({locale,data,subtab}:{locale:Locale;data:ZafSnapshot|null;subtab:string}){if(subtab==="Node History")return <ZafNodeHistory locale={locale}/>;if(subtab==="SoloHost")return <SoloHost locale={locale}/>;if(subtab==="Compute")return <Compute locale={locale}/>;if(subtab==="Infrastructure")return <Infrastructure locale={locale}/>;return <ZafNodeIntelligence locale={locale} data={data}/>;}
