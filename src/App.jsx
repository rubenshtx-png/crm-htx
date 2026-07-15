import { useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { Filter, Loader2, RefreshCw, Sun, Moon } from "lucide-react";
import { GOLD, BG, TEXT1, GOLD_HEX, EASE, THEME_CSS, ThemeCtx, getQualKeys, getAgendKeys, NAV, playBeep, GOLD_DIM, GOLD_BG, GOLD_BG2, BG2, BG3, BORDER, BORDER2, TEXT3 } from "./lib/constants";
import { useAuth, useLeads, useEventos, useEquipe, useConfig, useTemplates, useEtiquetas, useUnread, usePipelines, useAudioLibrary, useFunis, useAdsSpend } from "./lib/hooks";
import { CrmDialog, Toast, LoginPage, Spinner, Logo, LeadModal } from "./components/ui";
import { DashboardPage, CRMPage, AnalyticsPage, TrackingPage, TemplatesPage, HelpPage, AdminNovoCliente, ConfigPage } from "./pages/pages";

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
const toggleTheme=()=>{const next=theme==="dark"?"light":"dark";const apply=()=>{sTheme(next);try{localStorage.setItem("crm-theme",next);}catch{}};
document.documentElement.classList.add("theme-snap");const done=()=>setTimeout(()=>document.documentElement.classList.remove("theme-snap"),80);
if(document.startViewTransition){const vt=document.startViewTransition(()=>flushSync(apply));vt.finished.finally(done);}else{apply();done();}};
const today=new Date();const thirtyAgo=new Date(today.getFullYear(),today.getMonth(),today.getDate()-30);
const[dateFrom,sDateFrom]=useState(thirtyAgo.toISOString().split("T")[0]);const[dateTo,sDateTo]=useState(today.toISOString().split("T")[0]);const[showDates,sShowDates]=useState(false);
const{totals:adsTotals}=useAdsSpend(dateFrom,dateTo,cid);
const filteredLeads=useMemo(()=>{const from=new Date(dateFrom+"T00:00:00");const to=new Date(dateTo+"T23:59:59");return leads.filter(l=>{const d=new Date(l.created_at);return d>=from&&d<=to;});},[leads,dateFrom,dateTo]);
if(auth.loading||(!auth.profile&&auth.user))return<div data-theme="light" style={{minHeight:"100vh",background:"#F4F8F7",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{THEME_CSS}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><Loader2 size={28} style={{color:GOLD_HEX,animation:"spin 1s linear infinite"}}/></div>;
if(!auth.user)return<LoginPage onLogin={auth.login}/>;
const vendas=filteredLeads.filter(l=>l.stage==="fechado");
const presets=[{l:"7 dias",d:7},{l:"15 dias",d:15},{l:"30 dias",d:30},{l:"60 dias",d:60},{l:"90 dias",d:90}];
const setPreset=d=>{const t=new Date();const f=new Date(t.getFullYear(),t.getMonth(),t.getDate()-d);sDateFrom(f.toISOString().split("T")[0]);sDateTo(t.toISOString().split("T")[0]);};
return<ThemeCtx.Provider value={theme}><div data-theme={theme} className="flex" style={{minHeight:"100vh",background:BG,fontFamily:"'Inter',system-ui,sans-serif",color:TEXT1}}><style>{THEME_CSS}{`
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(13,148,136,0.15)}50%{box-shadow:0 0 20px rgba(13,148,136,0.3)}}
@keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
[data-theme] select,[data-theme] input{color-scheme:${theme};}
.card-hover{transition:all 250ms ${EASE};}.card-hover:hover{border-color:rgba(113,132,127,0.25);transform:translateY(-1px);}
.btn-primary{transition:all 200ms ${EASE};position:relative;overflow:hidden;}.btn-primary:hover{box-shadow:0 0 20px rgba(13,148,136,0.25);}.btn-primary:active{transform:scale(0.97);}
.btn-ghost{transition:all 200ms ${EASE};}.btn-ghost:hover{background:var(--bg-hover);color:var(--text1);}
.skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg-hover,var(--bg2)) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
.glass{background:var(--glass);backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);}
.fade-in{animation:fadeIn 300ms ${EASE} both;}
.slide-in{animation:slideIn 250ms ${EASE} both;}
*{scrollbar-width:thin;scrollbar-color:rgba(113,132,127,0.15) transparent;}
*::-webkit-scrollbar{width:6px;}*::-webkit-scrollbar-track{background:transparent;}*::-webkit-scrollbar-thumb{background:rgba(113,132,127,0.15);border-radius:3px;}*::-webkit-scrollbar-thumb:hover{background:rgba(113,132,127,0.25);}
.bottomnav{display:none;}
@media(max-width:767px){
.bottomnav{display:flex;}
.main-scroll{padding-bottom:92px!important;}
.kb-scroll{scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;}
.kb-col{width:86vw!important;min-width:86vw!important;scroll-snap-align:start;}
.modal-card{width:100vw!important;max-width:100vw!important;max-height:100dvh!important;height:100dvh;border-radius:0!important;}
}
`}</style>
<aside className="hidden md:flex" style={{width:200,flexShrink:0,borderRight:`1px solid ${BORDER}`,padding:14,flexDirection:"column",background:BG2}}><div style={{marginBottom:28,paddingLeft:6}}><Logo/><p style={{fontSize:8,color:TEXT3,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:3}}>CRM para Clínicas</p></div><nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>{NAV.filter(n=>!n.adminOnly||auth.profile?.is_admin).map(n=>{if(n.key==="crm")return<div key="crm"><button onClick={()=>{sPage("crm");sShowPipeMenu(p=>!p);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"none",fontSize:12,fontWeight:500,cursor:"pointer",textAlign:"left",width:"100%",background:page==="crm"?GOLD_BG2:"transparent",color:page==="crm"?GOLD:TEXT3}}><n.icon size={15}/>Pipeline{totalUnread>0&&<span style={{marginLeft:4,minWidth:17,height:17,borderRadius:9,background:"#22C55E",color:"#fff",fontSize:9,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{totalUnread}</span>}<span style={{marginLeft:"auto",fontSize:9,color:TEXT3}}>{showPipeMenu?"▼":"▶"}</span></button>{showPipeMenu&&<div style={{marginLeft:16,marginTop:2,display:"flex",flexDirection:"column",gap:1}}>{pipeHook.pipelines.map(p=><button key={p.id} onClick={()=>{sPage("crm");pipeHook.selectPipeline(p.id);}} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:5,border:"none",fontSize:10,cursor:"pointer",textAlign:"left",width:"100%",background:pipeHook.activePipelineId===p.id?"rgba(13,148,136,0.08)":"transparent",color:pipeHook.activePipelineId===p.id?GOLD:TEXT3}}><div style={{width:5,height:5,borderRadius:"50%",background:pipeHook.activePipelineId===p.id?GOLD_HEX:"transparent"}}/>{p.nome}</button>)}</div>}</div>;return<button key={n.key} onClick={()=>sPage(n.key)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"none",fontSize:12,fontWeight:500,cursor:"pointer",textAlign:"left",width:"100%",background:page===n.key?GOLD_BG2:"transparent",color:page===n.key?GOLD:TEXT3}}><n.icon size={15}/>{n.label}</button>;})}</nav><div style={{paddingTop:14,borderTop:`1px solid ${BORDER}`,marginTop:"auto"}}><div style={{fontSize:9,color:GOLD_DIM}}>{auth.profile?.crm_clientes?.nome||config?.nome_negocio||"CRM"}</div><div style={{fontSize:8,color:TEXT3,marginTop:2}}>{filteredLeads.length} leads • {vendas.length} fechamentos</div><button onClick={auth.logout} style={{marginTop:8,display:"flex",alignItems:"center",gap:4,padding:"5px 0",border:"none",background:"transparent",color:TEXT3,fontSize:9,cursor:"pointer"}}>Sair ↗</button></div></aside>
<main style={{flex:1,padding:"14px 18px",overflowY:"auto",maxHeight:"100vh"}}><div className="bottomnav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:80,background:BG2,borderTop:`1px solid ${BORDER2}`,justifyContent:"space-around",padding:"6px 2px calc(8px + env(safe-area-inset-bottom))",boxShadow:"0 -4px 16px rgba(0,0,0,0.08)"}}>{NAV.filter(n=>["dashboard","crm","analytics","config"].includes(n.key)).map(n=><button key={n.key} onClick={()=>sPage(n.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 10px",borderRadius:8,border:"none",background:"transparent",color:page===n.key?GOLD:TEXT3,fontSize:9,fontWeight:700,cursor:"pointer",position:"relative"}}><n.icon size={18}/>{n.label}{n.key==="crm"&&totalUnread>0&&<span style={{position:"absolute",top:-2,right:4,minWidth:16,height:16,borderRadius:8,background:"#22C55E",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{totalUnread}</span>}</button>)}</div>
<div className="flex items-center justify-between flex-wrap gap-2" style={{marginBottom:18}}><div><h2 style={{fontSize:16,fontWeight:600,color:TEXT1,margin:0}}>{NAV.find(n=>n.key===page)?.label}</h2><p style={{fontSize:10,color:TEXT3,margin:"3px 0 0"}}>{filteredLeads.length} leads ({dateFrom.split("-").reverse().slice(0,2).join("/")} — {dateTo.split("-").reverse().slice(0,2).join("/")})</p></div>
<div className="flex items-center gap-2 flex-wrap">
<div style={{position:"relative"}}><button onClick={()=>sShowDates(!showDates)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,border:`1px solid ${showDates?GOLD_DIM:BORDER}`,background:showDates?GOLD_BG:"transparent",color:showDates?GOLD:TEXT3,fontSize:10,cursor:"pointer"}}><Filter size={11}/>Período</button>
{showDates&&<div style={{position:"absolute",right:0,top:"100%",marginTop:6,background:BG2,border:`1px solid ${BORDER2}`,borderRadius:10,padding:12,zIndex:50,width:280}}>
<div className="flex gap-1 flex-wrap" style={{marginBottom:10}}>{presets.map(p=><button key={p.d} onClick={()=>setPreset(p.d)} style={{padding:"4px 10px",borderRadius:5,border:"none",background:GOLD_BG,color:GOLD,fontSize:9,fontWeight:500,cursor:"pointer"}}>{p.l}</button>)}</div>
<div className="flex gap-2" style={{marginBottom:8}}><div style={{flex:1}}><label style={{fontSize:8,color:TEXT3,display:"block",marginBottom:3}}>DE</label><input type="date" value={dateFrom} onChange={e=>sDateFrom(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${BORDER}`,background:BG3,color:TEXT1,fontSize:11,outline:"none"}}/></div><div style={{flex:1}}><label style={{fontSize:8,color:TEXT3,display:"block",marginBottom:3}}>ATÉ</label><input type="date" value={dateTo} onChange={e=>sDateTo(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${BORDER}`,background:BG3,color:TEXT1,fontSize:11,outline:"none"}}/></div></div>
<button onClick={()=>sShowDates(false)} style={{width:"100%",padding:"6px",borderRadius:6,border:"none",background:GOLD_BG2,color:GOLD,fontSize:10,fontWeight:500,cursor:"pointer"}}>Aplicar</button>
</div>}</div>
<button onClick={refetch} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,border:`1px solid ${BORDER}`,background:"transparent",color:TEXT3,fontSize:10,cursor:"pointer"}}><RefreshCw size={11}/>Atualizar</button>
<button onClick={toggleTheme} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:6,borderRadius:7,border:`1px solid ${BORDER}`,background:"transparent",color:TEXT3,cursor:"pointer"}}>{theme==="dark"?<Sun size={13}/>:<Moon size={13}/>}</button></div></div>
<div key={page} className="fade-in">
{page==="dashboard"&&(ll?<Spinner/>:<DashboardPage leads={filteredLeads} config={config} adsTotals={adsTotals} stages={STAGES} qualStages={QUAL_STAGES} agendStages={AGEND_STAGES}/>)}
{page==="crm"&&(ll?<Spinner/>:<CRMPage leads={filteredLeads} onLeadClick={sSel} onUpdate={updateLead} equipe={equipe} onAdd={addLead} stages={STAGES} pipelines={pipeHook.pipelines} activePipelineId={pipeHook.activePipelineId} onSelectPipeline={pipeHook.selectPipeline} pipeHook={pipeHook} showPrompt={showPrompt} showConfirm={showConfirm} showToast={showToast} config={config} qualStages={QUAL_STAGES} etiquetas={etiquetasHook.tags} isClinica={isClinica} unread={unread}/>)}
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
