import { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { Loader2, RefreshCw, Sun, Moon, ChevronDown, LogOut, CalendarDays } from "lucide-react";
import { GOLD, BG, TEXT1, EASE, THEME_CSS, ThemeCtx, getQualKeys, getAgendKeys, NAV, playBeep } from "./lib/constants";
import { useAuth, useLeads, useEventos, useEquipe, useConfig, useTemplates, useEtiquetas, useUnread, usePipelines, useAudioLibrary, useFunis, useAdsSpend } from "./lib/hooks";
import { CrmDialog, Toast, LoginPage, Spinner, Logo, LeadModal } from "./components/ui";
import { DashboardPage, CRMPage, AnalyticsPage, TrackingPage, TemplatesPage, HelpPage, AdminNovoCliente, ConfigPage } from "./pages/pages";

// Data local em YYYY-MM-DD (toISOString usa UTC e vira o dia depois das 21h no Brasil)
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const daysBetween=(a,b)=>Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
const brDate=s=>s.split("-").reverse().slice(0,2).join("/");
const PRESETS=[{l:"7 dias",d:7},{l:"15 dias",d:15},{l:"30 dias",d:30},{l:"60 dias",d:60},{l:"90 dias",d:90}];

// Estilos do shell: classes (hover, foco, mobile) que estilo inline não resolve.
const SHELL_CSS=`
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),0.0)}50%{box-shadow:0 0 0 4px rgba(var(--accent-rgb),0.14)}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.app-root{font-family:var(--font-ui);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
.app-root button,.app-root input,.app-root select,.app-root textarea{font-family:inherit;}
.app-root input:focus,.app-root textarea:focus,.app-root select:focus{border-color:var(--gold)!important;box-shadow:0 0 0 3px var(--gold-bg2);}
.app-root button:focus-visible,.app-root a:focus-visible,.app-root [role=button]:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.card-hover{transition:border-color 200ms ${EASE},box-shadow 200ms ${EASE};}.card-hover:hover{border-color:var(--border2);}
.btn-primary{transition:filter 160ms ${EASE},transform 120ms ${EASE};position:relative;overflow:hidden;}.btn-primary:hover{filter:brightness(1.07);}.btn-primary:active{transform:scale(0.98);}
.btn-ghost{transition:background 160ms ${EASE},color 160ms ${EASE};}.btn-ghost:hover{background:var(--bg-hover);color:var(--text1);}
.skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg-hover,var(--bg2)) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
.glass{background:var(--glass);backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);}
.fade-in{animation:fadeIn 280ms ${EASE} both;}
.slide-in{animation:slideIn 250ms ${EASE} both;}
*{scrollbar-width:thin;scrollbar-color:rgba(var(--neutral-rgb),0.3) transparent;}
*::-webkit-scrollbar{width:8px;height:8px;}*::-webkit-scrollbar-track{background:transparent;}
*::-webkit-scrollbar-thumb{background:rgba(var(--neutral-rgb),0.28);border-radius:8px;border:2px solid transparent;background-clip:content-box;}
*::-webkit-scrollbar-thumb:hover{background:rgba(var(--neutral-rgb),0.5);background-clip:content-box;}
.kb-proxy{scrollbar-width:auto;scrollbar-color:rgba(var(--accent-rgb),0.5) var(--bg3);}
.kb-proxy::-webkit-scrollbar{height:12px;}
.kb-proxy::-webkit-scrollbar-track{background:var(--bg3);border-radius:6px;}
.kb-proxy::-webkit-scrollbar-thumb{background:rgba(var(--accent-rgb),0.5);border-radius:6px;border:none;}
.kb-proxy::-webkit-scrollbar-thumb:hover{background:rgba(var(--accent-rgb),0.8);}

.sb{width:240px;flex-shrink:0;flex-direction:column;border-right:1px solid var(--border);padding:22px 12px 12px;background:var(--sidebar);position:sticky;top:0;height:100vh;}
.sb-brand{padding:0 10px;margin-bottom:28px;}
.sb-eyebrow{margin:9px 0 0;font-size:10.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--text3);}
.sb-label{margin:0 0 6px;padding:0 10px;font-size:10.5px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--text3);}
.nav-item{display:flex;align-items:center;gap:10px;width:100%;height:36px;padding:0 10px;border:none;border-radius:8px;background:transparent;color:var(--text2);font-size:13.5px;font-weight:500;text-align:left;cursor:pointer;position:relative;transition:background 140ms ${EASE},color 140ms ${EASE};}
.nav-item svg{color:var(--text3);flex-shrink:0;transition:color 140ms ${EASE};}
.nav-item:hover{background:var(--bg-hover);color:var(--text1);}
.nav-item[data-active="true"]{background:var(--gold-bg2);color:var(--text1);font-weight:600;}
.nav-item[data-active="true"] svg{color:var(--gold);}
.nav-item[data-active="true"]::before{content:"";position:absolute;left:-12px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--gold);}
.subnav{display:flex;flex-direction:column;gap:1px;margin:2px 0 6px 20px;padding-left:10px;border-left:1px solid var(--border2);}
.subnav-item{display:flex;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:none;border-radius:6px;background:transparent;color:var(--text3);font-size:13px;text-align:left;cursor:pointer;transition:background 140ms ${EASE},color 140ms ${EASE};}
.subnav-item:hover{background:var(--bg-hover);color:var(--text1);}
.subnav-item[data-active="true"]{color:var(--gold);font-weight:600;}
.badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#16A34A;color:#fff;font-size:10.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1;}
.avatar{width:32px;height:32px;border-radius:8px;background:var(--gold-bg2);color:var(--gold);font-size:12.5px;font-weight:700;letter-spacing:0.02em;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text2);cursor:pointer;transition:background 140ms ${EASE},color 140ms ${EASE},border-color 140ms ${EASE};}
.icon-btn:hover{background:var(--bg-hover);color:var(--text1);border-color:var(--border2);}
.icon-btn.ghost{border-color:transparent;background:transparent;}
.ctrl{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text2);font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer;box-shadow:var(--shadow-sm);transition:border-color 140ms ${EASE},color 140ms ${EASE},background 140ms ${EASE};}
.ctrl svg{color:var(--text3);}
.ctrl:hover{border-color:var(--border2);color:var(--text1);}
.ctrl[data-open="true"]{border-color:var(--gold-border);background:var(--gold-bg);color:var(--text1);}
.popover{position:absolute;right:0;top:calc(100% + 8px);width:300px;max-width:calc(100vw - 32px);padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--bg2);box-shadow:var(--shadow-md);z-index:50;animation:fadeIn 160ms ${EASE};}
.chip{height:30px;padding:0 12px;border-radius:15px;border:1px solid var(--border);background:var(--bg2);color:var(--text2);font-size:12.5px;font-weight:500;cursor:pointer;transition:all 140ms ${EASE};}
.chip:hover{border-color:var(--border2);color:var(--text1);}
.chip[data-active="true"]{background:var(--gold);border-color:var(--gold);color:var(--btn-text);}
.field-label{display:block;margin-bottom:5px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);}
.field{width:100%;height:36px;padding:0 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text1);font-size:13px;outline:none;}
.main-scroll{flex:1;min-width:0;padding:16px;overflow-y:auto;max-height:100vh;}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:22px;}
.page-eyebrow{margin:0 0 6px;font-size:11.5px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text3);}
.page-title{margin:0;font-family:var(--font-display);font-weight:400;font-size:28px;line-height:1.05;letter-spacing:-0.015em;color:var(--text1);}
.page-sub{margin:6px 0 0;font-size:13px;color:var(--text3);}
.bottomnav{display:none;}
.bn-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:64px;min-height:48px;padding:4px 8px;border:none;border-radius:10px;background:transparent;color:var(--text3);font-size:11px;font-weight:600;cursor:pointer;position:relative;}
.bn-item[data-active="true"]{color:var(--gold);}
.mobile-only{display:block;}
@media(min-width:768px){
.main-scroll{padding:26px 32px;}
.page-title{font-size:34px;}
.mobile-only{display:none;}
}
@media(max-width:767px){
.bottomnav{display:flex;}
.main-scroll{padding-bottom:96px!important;}
.toast-stack{bottom:92px!important;right:12px!important;left:12px;}
.app-root input,.app-root select,.app-root textarea{font-size:16px!important;}
.kb-scroll{scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;}
.kb-col{width:86vw!important;min-width:86vw!important;scroll-snap-align:start;}
.modal-card{width:100vw!important;max-width:100vw!important;max-height:100dvh!important;height:100dvh;border-radius:0!important;}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important;scroll-behavior:auto!important;}}
`;

// ===== APP =====
export default function App(){
const auth=useAuth();
const[page,sPage]=useState("dashboard");const[sel,sSel]=useState(null);const[showPipeMenu,sShowPipeMenu]=useState(true);
const[dialog,setDialog]=useState(null);const[toasts,setToasts]=useState([]);
const showPrompt=(title,defaultVal)=>new Promise(r=>{setDialog({type:"prompt",title,value:defaultVal||"",onOk:v=>{setDialog(null);r(v);},onCancel:()=>{setDialog(null);r(null);}});});
const showConfirm=(title,message,danger)=>new Promise(r=>{setDialog({type:"confirm",title,message,danger,okLabel:danger?"Excluir":"Confirmar",onOk:()=>{setDialog(null);r(true);},onCancel:()=>{setDialog(null);r(false);}});});
const showToast=(message,type="info",action=null)=>{const id=Date.now();setToasts(p=>[...p,{id,message,type,action}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),action?6000:3000);};
const cid=auth.clienteId;
const onNewLead=l=>{showToast(`🔥 Novo lead: ${l.nome||l.telefone||""}`,"success");playBeep();};
const{leads,loading:ll,refetch,updateLead,addLead,deleteLead}=useLeads(cid,onNewLead);
const{unread,markRead}=useUnread(cid);
const totalUnread=Object.values(unread).reduce((s,v)=>s+(v||0),0);const{eventos,loading:el}=useEventos(cid);const{equipe,loading:eql,addMember,removeMember,toggleActive,updateDist}=useEquipe(cid);const{templates,loading:tl,addTemplate,removeTemplate}=useTemplates(cid);const config=useConfig(cid);
const pipeHook=usePipelines(cid);const etiquetasHook=useEtiquetas(cid);const isClinica=auth.profile?.crm_clientes?.tipo==="clinica";const STAGES=pipeHook.stages;const QUAL_STAGES=getQualKeys(STAGES);const AGEND_STAGES=getAgendKeys(STAGES);
const audioLib=useAudioLibrary(cid);
const funisHook=useFunis(cid);
const[theme,sTheme]=useState(()=>{try{return localStorage.getItem("crm-theme")||"light";}catch{return"light";}});
useEffect(()=>{try{document.documentElement.setAttribute("data-theme",theme);}catch{}},[theme]);
const toggleTheme=()=>{const next=theme==="dark"?"light":"dark";const apply=()=>{sTheme(next);try{localStorage.setItem("crm-theme",next);}catch{}};
document.documentElement.classList.add("theme-snap");const done=()=>setTimeout(()=>document.documentElement.classList.remove("theme-snap"),80);
if(document.startViewTransition){const vt=document.startViewTransition(()=>flushSync(apply));vt.finished.finally(done);}else{apply();done();}};
const today=new Date();const thirtyAgo=new Date(today.getFullYear(),today.getMonth(),today.getDate()-30);
const[dateFrom,sDateFrom]=useState(ymd(thirtyAgo));const[dateTo,sDateTo]=useState(ymd(today));const[showDates,sShowDates]=useState(false);
const{totals:adsTotals}=useAdsSpend(dateFrom,dateTo,cid);
const filteredLeads=useMemo(()=>{const from=new Date(dateFrom+"T00:00:00");const to=new Date(dateTo+"T23:59:59");return leads.filter(l=>{const d=new Date(l.created_at);return d>=from&&d<=to;});},[leads,dateFrom,dateTo]);
if(auth.loading||(!auth.profile&&auth.user))return<div data-theme={theme} style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",gap:18,alignItems:"center",justifyContent:"center",fontFamily:"var(--font-ui)"}}><style>{THEME_CSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><Logo size={26}/><Loader2 size={22} style={{color:GOLD,animation:"spin 1s linear infinite"}}/></div>;
if(!auth.user)return<LoginPage onLogin={auth.login}/>;
const vendas=filteredLeads.filter(l=>l.stage==="fechado");
const setPreset=d=>{const t=new Date();const f=new Date(t.getFullYear(),t.getMonth(),t.getDate()-d);sDateFrom(ymd(f));sDateTo(ymd(t));};
const activePreset=dateTo===ymd(new Date())?PRESETS.find(p=>p.d===daysBetween(dateFrom,dateTo)):null;
const periodLabel=activePreset?`Últimos ${activePreset.d} dias`:`${brDate(dateFrom)} a ${brDate(dateTo)}`;
const clienteNome=auth.profile?.crm_clientes?.nome||config?.nome_negocio||"CRM";
const initials=clienteNome.split(/\s+/).filter(w=>/^[A-Za-zÀ-ÿ]/.test(w)).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"C";
const activePipe=pipeHook.pipelines.find(p=>p.id===pipeHook.activePipelineId);
const title=page==="crm"&&activePipe?activePipe.nome:NAV.find(n=>n.key===page)?.label;
const eyebrow=page==="crm"?`${clienteNome} · Pipeline`:clienteNome;
const goPipeline=()=>{if(page!=="crm"){sPage("crm");sShowPipeMenu(true);}else sShowPipeMenu(p=>!p);};
const refresh=async()=>{await refetch(true);showToast("Dados atualizados","success");};
const nav=NAV.filter(n=>!n.adminOnly||auth.profile?.is_admin);
return<ThemeCtx.Provider value={theme}><div data-theme={theme} className="flex app-root" style={{minHeight:"100vh",background:BG,color:TEXT1}}><style>{THEME_CSS}{SHELL_CSS}{`[data-theme] select,[data-theme] input{color-scheme:${theme};}`}</style>
<aside className="hidden md:flex sb">
<div className="sb-brand"><Logo size={22}/><p className="sb-eyebrow">CRM High Ticket</p></div>
<p className="sb-label">Menu</p>
<nav aria-label="Principal" style={{flex:1,display:"flex",flexDirection:"column",gap:2,overflowY:"auto",paddingLeft:0}}>{nav.map(n=>{
if(n.key==="crm")return<div key="crm"><button className="nav-item" data-active={page==="crm"} aria-expanded={showPipeMenu} onClick={goPipeline}><n.icon size={16}/><span>Pipeline</span>{totalUnread>0&&<span className="badge" aria-label={`${totalUnread} mensagens não lidas`}>{totalUnread}</span>}<ChevronDown size={14} style={{marginLeft:"auto",transform:showPipeMenu?"none":"rotate(-90deg)",transition:`transform 160ms ${EASE}`}}/></button>
{showPipeMenu&&pipeHook.pipelines.length>0&&<div className="subnav">{pipeHook.pipelines.map(p=><button key={p.id} className="subnav-item" data-active={page==="crm"&&pipeHook.activePipelineId===p.id} onClick={()=>{sPage("crm");pipeHook.selectPipeline(p.id);}}>{p.nome}</button>)}</div>}</div>;
return<button key={n.key} className="nav-item" data-active={page===n.key} onClick={()=>sPage(n.key)}><n.icon size={16}/><span>{n.label}</span></button>;})}</nav>
<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)"}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 6px"}}><div className="avatar" aria-hidden="true">{initials}</div><div style={{minWidth:0,flex:1}}><div style={{fontSize:13,fontWeight:600,color:"var(--text1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={clienteNome}>{clienteNome}</div><div style={{fontSize:11.5,color:"var(--text3)",marginTop:1}}>{filteredLeads.length.toLocaleString("pt-BR")} leads · {vendas.length} {vendas.length===1?"venda":"vendas"}</div></div><button className="icon-btn ghost" onClick={auth.logout} title="Sair" aria-label="Sair"><LogOut size={15}/></button></div></div>
</aside>
<main className="main-scroll">
<nav className="bottomnav" aria-label="Principal" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:80,background:"var(--glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid var(--border2)",justifyContent:"space-around",padding:"6px 4px calc(6px + env(safe-area-inset-bottom))"}}>{NAV.filter(n=>["dashboard","crm","analytics","config"].includes(n.key)).map(n=><button key={n.key} className="bn-item" data-active={page===n.key} onClick={()=>sPage(n.key)}><n.icon size={19}/>{n.label}{n.key==="crm"&&totalUnread>0&&<span className="badge" style={{position:"absolute",top:2,right:10}}>{totalUnread}</span>}</button>)}</nav>
<div className="mobile-only" style={{marginBottom:16}}><Logo size={20}/></div>
<header className="page-head"><div style={{minWidth:0}}><p className="page-eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-sub">{filteredLeads.length.toLocaleString("pt-BR")} leads no período · {brDate(dateFrom)} a {brDate(dateTo)}</p></div>
<div className="flex items-center gap-2 flex-wrap">
<div style={{position:"relative"}}><button className="ctrl" data-open={showDates} aria-expanded={showDates} aria-haspopup="dialog" onClick={()=>sShowDates(!showDates)}><CalendarDays size={14}/>{periodLabel}<ChevronDown size={14}/></button>
{showDates&&<><div style={{position:"fixed",inset:0,zIndex:45}} onClick={()=>sShowDates(false)}/><div className="popover" role="dialog" aria-label="Período">
<span className="field-label" style={{marginBottom:8}}>Atalhos</span>
<div className="flex gap-1.5 flex-wrap" style={{marginBottom:14}}>{PRESETS.map(p=><button key={p.d} className="chip" data-active={activePreset?.d===p.d} onClick={()=>{setPreset(p.d);sShowDates(false);}}>{p.l}</button>)}</div>
<div className="flex gap-2" style={{marginBottom:12}}><div style={{flex:1}}><label className="field-label" htmlFor="dt-de">De</label><input id="dt-de" className="field" type="date" value={dateFrom} max={dateTo} onChange={e=>sDateFrom(e.target.value)}/></div><div style={{flex:1}}><label className="field-label" htmlFor="dt-ate">Até</label><input id="dt-ate" className="field" type="date" value={dateTo} min={dateFrom} onChange={e=>sDateTo(e.target.value)}/></div></div>
<button className="btn-primary" onClick={()=>sShowDates(false)} style={{width:"100%",height:36,borderRadius:8,border:"none",background:"var(--gold)",color:"var(--btn-text)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Aplicar</button>
</div></>}</div>
<button className="ctrl" onClick={refresh}><RefreshCw size={14}/>Atualizar</button>
<button className="icon-btn" onClick={toggleTheme} aria-label={theme==="dark"?"Usar tema claro":"Usar tema escuro"} title={theme==="dark"?"Tema claro":"Tema escuro"}>{theme==="dark"?<Sun size={15}/>:<Moon size={15}/>}</button></div></header>
<div key={page} className="fade-in">
{page==="dashboard"&&(ll?<Spinner/>:<DashboardPage leads={filteredLeads} config={config} adsTotals={adsTotals} stages={STAGES} qualStages={QUAL_STAGES} agendStages={AGEND_STAGES}/>)}
{page==="crm"&&(ll?<Spinner/>:<CRMPage clienteId={cid} leads={filteredLeads} onLeadClick={sSel} onUpdate={updateLead} equipe={equipe} onAdd={addLead} stages={STAGES} pipelines={pipeHook.pipelines} activePipelineId={pipeHook.activePipelineId} onSelectPipeline={pipeHook.selectPipeline} pipeHook={pipeHook} showPrompt={showPrompt} showConfirm={showConfirm} showToast={showToast} config={config} qualStages={QUAL_STAGES} etiquetas={etiquetasHook.tags} isClinica={isClinica} unread={unread}/>)}
{page==="analytics"&&(ll?<Spinner/>:<AnalyticsPage leads={filteredLeads} config={config} adsTotals={adsTotals} stages={STAGES} qualStages={QUAL_STAGES} agendStages={AGEND_STAGES}/>)}
{page==="tracking"&&(el?<Spinner/>:<TrackingPage eventos={eventos}/>)}
{page==="templates"&&<TemplatesPage templates={templates} loading={tl} addTemplate={addTemplate} removeTemplate={removeTemplate}/>}
{page==="ajuda"&&<HelpPage isClinica={isClinica}/>}
{page==="admin"&&auth.profile?.is_admin&&<AdminNovoCliente showToast={showToast}/>}
{page==="config"&&<ConfigPage equipe={equipe} eqLoading={eql} addMember={addMember} removeMember={removeMember} toggleActive={toggleActive} updateDist={updateDist} config={config} theme={theme} toggleTheme={toggleTheme} pipeHook={pipeHook} etiquetasHook={etiquetasHook} isClinica={isClinica} showConfirm={showConfirm} showToast={showToast} isAdmin={!!auth.profile?.is_admin}/>}
</div>
</main>
{sel&&<LeadModal lead={sel} onClose={()=>{sSel(null);refetch(true);}} onUpdate={updateLead} onDelete={deleteLead} equipe={equipe} templates={templates} clienteId={cid} stages={STAGES} showConfirm={showConfirm} showToast={showToast} audioLib={audioLib} funisHook={funisHook} etiquetas={etiquetasHook.tags} isClinica={isClinica} markRead={markRead}/>}
<CrmDialog dialog={dialog} setDialog={setDialog}/><Toast toasts={toasts}/></div></ThemeCtx.Provider>;}
