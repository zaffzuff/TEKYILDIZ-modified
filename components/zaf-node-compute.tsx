"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import type { ZafSnapshot } from "@/lib/zaf/types";
import { ZafNodeIntelligence } from "@/components/zaf-node-intelligence";
import { ZafNodeHistory } from "@/components/zaf-node-history";

function spanishCopy(value:string){
  if(value.length<70)return value;
  const tokens:string[]=[];
  const protectedValue=value.replace(/ZAF TECH|Pi Network|Pi Browser|Pi Desktop|Pi Node|Pi2Day|OpenClaw|Atlassian MCP Server|SoloHost|Docker|WSL|CPU|RAM|HTTPS|HTTP|URL|Node/g,token=>{const i=tokens.length;tokens.push(token);return `@@${i}@@`;});
  const sentence=protectedValue.toLocaleLowerCase("es-ES").replace(/^./,char=>char.toLocaleUpperCase("es-ES"));
  return sentence.replace(/@@(\\d+)@@/g,(_,i)=>tokens[Number(i)]);
}

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
 const tr=locale==="tr"; const es=locale==="es"; const zh=locale==="zh";
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">SoloHost</h2><p className="text-[11px] text-muted-foreground">{tr?"Pi Desktop üzerindeki self-hosted uygulama katmanının resmi durumunu ve doğrulanmış kullanım alanlarını gösterir.":zh?"Pi Desktop 上自托管应用层的官方状态和已验证使用场景。":es?spanishCopy("Muestra El Estado Oficial Y Los Casos De Uso Verificados De La Capa De Aplicaciones Self-Hosted En Pi Desktop."):"Official status and documented use cases of the self-hosted application layer in Pi Desktop."}</p></div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Card title={tr?"Platform Durumu":zh?"平台状态":es?spanishCopy("Estado De La Plataforma"):"Platform Status"} value="Beta" detail={tr?"SoloHost, Pi2Day 2026 ile açık ve permissionless bir framework olarak tanıtıldı.":zh?"SoloHost 在 Pi2Day 2026 上作为开放、无需许可的框架推出。":es?spanishCopy("SoloHost Se Presentó En Pi2Day 2026 Como Un Framework Abierto Y Sin Permisos."):"SoloHost was introduced at Pi2Day 2026 as an open, permissionless framework."}/>
 <Card title="Pi Desktop" value="0.6.3" detail={tr?"9 Eylül 2026 güncellemesi keşif, güvenilirlik ve geliştirici araçlarını geliştirdi.":zh?"2026 年 9 月 9 日的更新改进了发现、可靠性和开发者工具。":es?spanishCopy("The September 9, 2026 update improved discovery, reliability, and developer tooling."):"The September 9, 2026 update improved discovery, reliability, and developer tooling."}/>
 <Card title={tr?"Çalıştırma Modeli":zh?"运行模式":es?spanishCopy("Modelo De Ejecución"):"Execution Model"} value={tr?"Yerel":zh?"本地":es?spanishCopy("Local"):"Local"} detail={tr?"Uygulamalar kullanıcının kendi bilgisayarında çalışır; mobil erişim Pi Browser üzerinden desteklenir.":zh?"应用在用户自己的电脑上运行，并通过 Pi Browser 支持移动访问。":es?spanishCopy("Apps run on the user's own computer, with mobile access through Pi Browser."):"Apps run on the user's own computer, with mobile access through Pi Browser."}/>
 <Card title={tr?"Keşif Sinyali":zh?"发现信号":es?spanishCopy("Señal De Descubrimiento"):"Discovery Signal"} value="Running Counts" detail={tr?"0.6.3 ile uygulamalar mevcut çalıştırılma sayılarına göre sıralanabiliyor.":zh?"0.6.3 版本引入了按当前运行数量排序的功能。":es?spanishCopy("Version 0.6.3 introduced ranking by current running counts."):"Version 0.6.3 introduced ranking by current running counts."}/>
 </div>
 <div className="mt-3 rounded-xl border border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">{tr?"Son resmi gelişmeler":zh?"最新官方进展":es?spanishCopy("Últimos Desarrollos Oficiales"):"Latest Official Developments"}</div><p className="mt-1">{tr?"14 Ağustos 2026'da beş gönüllü Node runner ile ilk dağıtık hesaplama testi tamamlandı. 27 Ağustos'ta OpenClaw ve Atlassian MCP Server öne çıkan SoloHost uygulamalarına eklendi.":zh?"2026 年 8 月 14 日，五名志愿 Node 运行者完成了首次分布式计算测试。8 月 27 日，OpenClaw 和 Atlassian MCP Server 被列为重点 SoloHost 应用。":es?spanishCopy("On August 14, 2026, an initial distributed-computing test was completed with five volunteer Node runners. On August 27, OpenClaw and Atlassian MCP Server were featured."):"On August 14, 2026, an initial distributed-computing test was completed with five volunteer Node runners. On August 27, OpenClaw and Atlassian MCP Server were featured."}</p><div className="mt-2 flex flex-wrap gap-3"><Source href="https://minepi.com/blog/solohost-pi-desktop-0-6-3/">Pi Desktop 0.6.3</Source><Source href="https://minepi.com/blog/pi-node-0-6-2/">Node 0.6.2 / Compute Test</Source><Source href="https://minepi.com/blog/new-solohost-apps/">SoloHost Apps</Source></div></div>
 </section>;
}

function Compute({locale}:{locale:Locale}){
 const tr=locale==="tr"; const es=locale==="es"; const zh=locale==="zh";
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Compute</h2><p className="text-[11px] text-muted-foreground">{tr?"Pi Node kaynaklarının blockchain dışında hesaplama amacıyla kullanımına ilişkin resmi durum.":zh?"Pi Node 资源用于区块链基础设施之外计算的官方状态。":es?spanishCopy("Estado Oficial Del Uso De Recursos De Pi Node Para Cómputo Más Allá De La Infraestructura Blockchain."):"Official status of using Pi Node resources for computing beyond blockchain infrastructure."}</p></div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Card title={tr?"Kullanım Durumu":zh?"使用状态":es?spanishCopy("Estado De Uso"):"Use-Case Status"} value={tr?"Test edildi":zh?"已测试":es?spanishCopy("Probado"):"Tested"} detail={tr?"SoloHost üzerinden gerçek cihazlarla uçtan uca dağıtık hesaplama testi yapıldı.":zh?"通过 SoloHost 完成了一次端到端分布式计算测试。":es?spanishCopy("An end-to-end distributed-computing test was completed through SoloHost."):"An end-to-end distributed-computing test was completed through SoloHost."}/>
 <Card title={tr?"Test Katılımcıları":zh?"测试参与者":es?spanishCopy("Participantes De La Prueba"):"Test Participants"} value="5" detail={tr?"14 Ağustos 2026 resmi duyurusundaki ilk test.":zh?"2026 年 8 月 14 日官方更新中介绍的首次测试。":es?spanishCopy("The initial test described in the August 14, 2026 official update."):"The initial test described in the August 14, 2026 official update."}/>
 <Card title={tr?"Kaynak Modeli":zh?"资源模式":es?spanishCopy("Modelo De Recursos"):"Resource Model"} value="Opt-in" detail={tr?"Node operatörleri kullanılabilir hesaplama kapasitesini üçüncü taraf iş yüklerine açmayı seçebilir.":zh?"Node 运营者可以选择将可用计算容量提供给第三方工作负载。":es?spanishCopy("Node operators can opt in to make available computing capacity usable by third-party workloads."):"Node operators can opt in to make available computing capacity usable by third-party workloads."}/>
 <Card title={tr?"Ücretlendirme Modeli":zh?"补偿模式":es?spanishCopy("Modelo De Compensación"):"Compensation Model"} value={tr?"Üçüncü taraf":zh?"第三方":es?spanishCopy("Terceros"):"Third-party"} detail={tr?"Resmi açıklama uygun iş yüklerinde Pi ile telafi modelini tanımlıyor.":zh?"官方更新说明，符合条件的工作负载可由第三方客户使用 Pi 进行补偿。":es?spanishCopy("The official update describes Pi compensation by third-party clients for suitable workloads."):"The official update describes Pi compensation by third-party clients for suitable workloads."}/>
 </div>
 <div className="mt-3 rounded-xl border border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">{tr?"ZAF TECH Sınırı":zh?"ZAF TECH 边界":es?spanishCopy("Límite De ZAF TECH"):"ZAF TECH Boundary"}</div><p className="mt-1">{tr?"Küresel compute kapasitesi, aktif iş yükleri veya gerçek zamanlı compute kazançları için doğrulanmış bir veri akışı yok; bu nedenle ZAF TECH bunları uydurmuyor.":zh?"目前没有经过验证的全球计算容量、活跃工作负载或实时计算收益数据流，因此 ZAF TECH 不会虚构这些数据。":es?spanishCopy("There is no verified live feed for global compute capacity, active workloads, or real-time compute earnings, so ZAF TECH does not fabricate them."):"There is no verified live feed for global compute capacity, active workloads, or real-time compute earnings, so ZAF TECH does not fabricate them."}</p><div className="mt-2"><Source href="https://minepi.com/blog/openmind-case-study/">Pi Node Decentralized Computing Case Study</Source></div></div>
 </section>;
}

function Infrastructure({locale}:{locale:Locale}){
 const tr=locale==="tr"; const es=locale==="es"; const zh=locale==="zh";const[health,setHealth]=useState<Health|null>(null);const[r,setR]=useState<Resources|null>(null);const[online,setOnline]=useState<boolean|null>(null);
 useEffect(()=>{const load=async()=>{try{const[h,x]=await Promise.all([fetch("http://127.0.0.1:39100/health",{cache:"no-store"}),fetch("http://127.0.0.1:39100/resources",{cache:"no-store"})]);if(!h.ok)throw new Error();setHealth(await h.json());setR(x.ok?await x.json():null);setOnline(true);}catch{setHealth(null);setR(null);setOnline(false);}};void load();const id=window.setInterval(()=>void load(),15000);return()=>window.clearInterval(id);},[]);
 const dist=r?.wsl?.distributions?.filter(d=>d.state==="running").length??0;
 return <section className="mt-7"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Infrastructure</h2><p className="text-[11px] text-muted-foreground">{tr?"Yerel Connector, Docker ve WSL kaynak gözlemleri.":zh?"本地 Connector、Docker 和 WSL 资源观测。":es?spanishCopy("Observaciones De Recursos Del Connector Local, Docker Y WSL."):"Local Connector, Docker, and WSL resource observations."}</p></div>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
 <Card title="Connector" value={online?(tr?"Bağlı":zh?"已连接":es?spanishCopy("Conectado"):"Connected"):(tr?"Çevrimdışı":zh?"离线":es?spanishCopy("Fuera De Línea"):"Offline")} detail={health?.version?(tr?"Sürüm ":zh?"版本 ":es?spanishCopy("Versión "):"Version ")+health.version:"127.0.0.1:39100"}/>
 <Card title="CPU" value={pct(r?.host?.cpuPercent)} detail={tr?"Host CPU Kullanımı":zh?"主机 CPU 使用率":es?spanishCopy("Uso De CPU Del Host"):"Host CPU usage"}/>
 <Card title={tr?"Bellek":zh?"内存":es?spanishCopy("Memoria"):"Memory"} value={pct(r?.host?.memory?.usedPercent)} detail={r?.host?.memory?bytes(r.host.memory.usedBytes)+" / "+bytes(r.host.memory.totalBytes):"—"}/>
 <Card title="Disk" value={pct(r?.host?.disk?.usedPercent)} detail={r?.host?.disk?.drive??"C:"}/>
 <Card title="Docker" value={pct(r?.docker?.cpuPercent)} detail={r?.docker?.memory?bytes(r.docker.memory.usedBytes)+" / "+bytes(r.docker.memory.limitBytes):(tr?"Container Kaynak Kullanımı":zh?"容器资源使用率":es?spanishCopy("Uso De Recursos Del Contenedor"):"Container Resource Usage")}/>
 <Card title="WSL" value={r?.wsl?.available?String(dist):"—"} detail={tr?"Çalışan Dağıtımlar":zh?"正在运行的发行版":es?spanishCopy("Distribuciones En Ejecución"):"Running Distributions"}/>
 </div>
 <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-card p-4 text-[11px]"><div className="font-medium text-foreground">{tr?"Connector protokol desteği":zh?"Connector 协议支持":es?spanishCopy("Compatibilidad Del Protocolo Del Connector"):"Connector Protocol Support"}</div><div className="mt-1 text-muted-foreground">{health?.supportedProtocols?.length?health.supportedProtocols.map(p=>"v"+p).join(" · "):"—"}</div><div className="mt-2 text-muted-foreground">{tr?"Connector salt-okunur çalışır ve Docker'ı uzaktan açmaz.":zh?"Connector 以只读模式运行，不会远程暴露 Docker。":es?spanishCopy("El Connector Funciona En Modo De Solo Lectura Y No Expone Docker De Forma Remota."):"The Connector is read-only and does not expose Docker remotely."}</div></div><div className="rounded-xl border border-border bg-card p-4 text-[11px]"><div className="font-medium text-foreground">{tr?"Ağ Ve Container I/O":zh?"网络与容器 I/O":es?spanishCopy("E/S De Red Y Contenedor"):"Network And Container I/O"}</div><div className="mt-1 text-muted-foreground">Host: {bytes(r?.host?.network?.receivedBytes)} ↓ · {bytes(r?.host?.network?.sentBytes)} ↑</div><div className="mt-1 text-muted-foreground">Docker: {bytes(r?.docker?.network?.receivedBytes)} ↓ · {bytes(r?.docker?.network?.sentBytes)} ↑</div><div className="mt-1 text-muted-foreground">Block I/O: {bytes(r?.docker?.blockIO?.readBytes)} ↓ · {bytes(r?.docker?.blockIO?.writeBytes)} ↑</div></div></div>
 </section>;
}

export function ZafNodeCompute({locale,data,subtab}:{locale:Locale;data:ZafSnapshot|null;subtab:string}){if(subtab==="Node History")return <ZafNodeHistory locale={locale}/>;if(subtab==="SoloHost")return <SoloHost locale={locale}/>;if(subtab==="Compute")return <Compute locale={locale}/>;if(subtab==="Infrastructure")return <Infrastructure locale={locale}/>;return <ZafNodeIntelligence locale={locale} data={data}/>;}
