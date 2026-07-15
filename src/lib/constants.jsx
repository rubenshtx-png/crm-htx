import { createContext, useContext } from "react";
import { UserCheck, LayoutDashboard, Kanban, BarChart3, Radio, Settings, MessageSquare, HelpCircle } from "lucide-react";


const GOLD="var(--gold)",GOLD_LIGHT="var(--gold-light)",GOLD_DIM="var(--gold-dim)",GOLD_BG="var(--gold-bg)",GOLD_BG2="var(--gold-bg2)";
const BG="var(--bg)",BG2="var(--bg2)",BG3="var(--bg3)",BORDER="var(--border)",BORDER2="var(--border2)";
const TEXT1="var(--text1)",TEXT2="var(--text2)",TEXT3="var(--text3)";
const GOLD_HEX="#14B8A6";
const EASE="cubic-bezier(0.16,1,0.3,1)";
const THEME_CSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
[data-theme="dark"]{--gold:#2DD4BF;--gold-light:#5EEAD4;--gold-dim:#14B8A6;--gold-bg:rgba(45,212,191,0.08);--gold-bg2:rgba(45,212,191,0.15);--gold-border:rgba(45,212,191,0.25);--bg:#0A1514;--bg2:#101F1D;--bg3:#0D1A18;--border:rgba(188,200,197,0.12);--border2:rgba(188,200,197,0.25);--text1:#EDF4F3;--text2:#BCC8C5;--text3:#8A9997;--overlay:rgba(10,21,20,0.85);--row-hover:rgba(45,212,191,0.04);--btn-text:#0A1514;--bg-hover:#16302C;--glass:rgba(16,31,29,0.7);}
html.theme-snap *,html.theme-snap *::before,html.theme-snap *::after{transition:none!important;}
::view-transition-old(root){animation:vtOut 360ms cubic-bezier(0.4,0,0.2,1) both;}
::view-transition-new(root){animation:vtIn 360ms cubic-bezier(0.4,0,0.2,1) both;}
@keyframes vtOut{from{opacity:1}to{opacity:0}}
@keyframes vtIn{from{opacity:0}to{opacity:1}}
[data-theme="light"]{--gold:#0D9488;--gold-light:#14B8A6;--gold-dim:#0F766E;--gold-bg:rgba(13,148,136,0.07);--gold-bg2:rgba(13,148,136,0.12);--gold-border:rgba(13,148,136,0.3);--bg:#E9EEED;--bg2:#FFFFFF;--bg3:#F0F4F3;--border:rgba(13,60,55,0.13);--border2:rgba(13,60,55,0.24);--text1:#10211F;--text2:#38504B;--text3:#61756F;--overlay:rgba(18,42,39,0.4);--row-hover:rgba(13,148,136,0.05);--btn-text:#FFFFFF;--bg-hover:#E2E9E7;--glass:rgba(255,255,255,0.8);}
`;
const ThemeCtx=createContext("light");
function useThemeMode(){return useContext(ThemeCtx);}
const TEAM_COLORS=["#14B8A6","#60A5FA","#34D399","#F472B6","#A78BFA","#FB923C","#22D3EE","#F87171","#84CC16","#E879F9"];

const BANT_ITEMS=[
  {key:"budget",label:"Budget",desc:"Tem condição de investir no tratamento?"},
  {key:"authority",label:"Authority",desc:"É quem decide pelo tratamento?"},
  {key:"need",label:"Need",desc:"Tem a queixa/necessidade real?"},
  {key:"timeline",label:"Timeline",desc:"Tem urgência para iniciar?"}
];

const DEFAULT_STAGES=[
  {key:"desqualificado",label:"Desqualificado",color:"#F87171"},
  {key:"novo",label:"Novo",color:GOLD},
  {key:"contato_iniciado",label:"Contato Iniciado",color:"#60A5FA"},
  {key:"conversando",label:"Conversando",color:"#38BDF8"},
  {key:"qualificado",label:"Qualificado",color:"#34D399"},
  {key:"reuniao_agendada",label:"Consulta Agendada",color:"#A78BFA"},
  {key:"reuniao_realizada",label:"Consulta Realizada",color:"#818CF8"},
  {key:"no_show",label:"No Show",color:"#FBBF24"},
  {key:"reagendamento",label:"Reagendamento",color:"#FB923C"},
  {key:"proposta_enviada",label:"Orçamento Enviado",color:"#22D3EE"},
  {key:"manter_contato",label:"Manter Contato",color:"#94A3B8"},
  {key:"fechado",label:"Fechado",color:"#4ADE80"}
];

const KANBAN_STAGES=DEFAULT_STAGES;
const getClosedKeys=stages=>stages.filter(s=>s.key==="fechado").map(s=>s.key);
const getQualKeys=stages=>{const qi=stages.findIndex(s=>s.key==="qualificado");return qi>=0?stages.slice(qi).map(s=>s.key):["qualificado","reuniao_agendada","reuniao_realizada","reagendamento","proposta_enviada","manter_contato","fechado"];};
const getAgendKeys=stages=>{const ai=stages.findIndex(s=>s.key==="reuniao_agendada");return ai>=0?stages.slice(ai).map(s=>s.key):["reuniao_agendada","reuniao_realizada","reagendamento","proposta_enviada","manter_contato","fechado"];};

const NAV=[
  {key:"dashboard",label:"Dashboard",icon:LayoutDashboard},
  {key:"crm",label:"Pipeline",icon:Kanban},
  {key:"analytics",label:"Analytics",icon:BarChart3},
  {key:"tracking",label:"Tracking",icon:Radio},
  {key:"templates",label:"Templates",icon:MessageSquare},
  {key:"config",label:"Config",icon:Settings},
  {key:"ajuda",label:"Ajuda",icon:HelpCircle},
  {key:"admin",label:"Novo Cliente",icon:UserCheck,adminOnly:true}
];

const fmt=v=>v!=null?v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0}):"R$ 0";
const pct=(a,b)=>b>0?Math.round((a/b)*100):0;
const timeAgo=d=>{if(!d)return"—";const ms=Date.now()-new Date(d).getTime(),h=Math.floor(ms/3600000),dy=Math.floor(h/24);return dy>0?`${dy}d`:h>0?`${h}h`:"agora";};
const isInactive=l=>l.stage==="novo"&&(Date.now()-new Date(l.created_at).getTime())/3600000>=2;
const playBeep=()=>{try{const c=new(window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(0.12,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.35);o.start();o.stop(c.currentTime+0.35);}catch{}};
const bantBadge=s=>s>=4?"bg-amber-400/10 text-amber-400":s>=3?"bg-emerald-400/10 text-emerald-400":s>=2?"bg-yellow-400/10 text-yellow-400":"bg-red-400/10 text-red-400";
const WA=<svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.624-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.586-5.932-1.608l-.425-.253-2.742.87.888-2.664-.278-.442A9.78 9.78 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z"/></svg>;



export { GOLD, BG, TEXT1, GOLD_HEX, EASE, THEME_CSS, ThemeCtx, useThemeMode, TEAM_COLORS, BANT_ITEMS, DEFAULT_STAGES, KANBAN_STAGES, getClosedKeys, getQualKeys, getAgendKeys, NAV, fmt, pct, timeAgo, isInactive, playBeep, bantBadge, WA, GOLD_LIGHT, GOLD_DIM, GOLD_BG, GOLD_BG2, BG2, BG3, BORDER, BORDER2, TEXT2, TEXT3 };
