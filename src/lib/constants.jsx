import { createContext, useContext } from "react";
import { UserCheck, LayoutDashboard, Kanban, BarChart3, Radio, Settings, MessageSquare, HelpCircle } from "lucide-react";


const GOLD="var(--gold)",GOLD_LIGHT="var(--gold-light)",GOLD_DIM="var(--gold-dim)",GOLD_BG="var(--gold-bg)",GOLD_BG2="var(--gold-bg2)";
const BG="var(--bg)",BG2="var(--bg2)",BG3="var(--bg3)",BORDER="var(--border)",BORDER2="var(--border2)";
const TEXT1="var(--text1)",TEXT2="var(--text2)",TEXT3="var(--text3)";
// Latão médio: legível como traço/ponto de gráfico nos dois temas (texto usa GOLD, que muda por tema)
const GOLD_HEX="#B8914A";
const EASE="cubic-bezier(0.16,1,0.3,1)";
// Identidade "tinta e latão": neutros quentes + um único acento (ação e dinheiro).
// Contraste: texto/acento >= 4.5:1 sobre bg e bg2 nos dois temas.
const THEME_CSS=`
:root{--font-ui:'Geist',system-ui,-apple-system,'Segoe UI',sans-serif;--font-display:'Instrument Serif',Georgia,'Times New Roman',serif;--font-mono:'Geist Mono',ui-monospace,'SFMono-Regular',monospace;--radius:12px;}
[data-theme="light"]{--gold:#8C5E14;--gold-light:#B07A22;--gold-dim:#6E4A10;--gold-bg:rgba(140,94,20,0.07);--gold-bg2:rgba(140,94,20,0.12);--gold-border:rgba(140,94,20,0.32);--accent-rgb:140,94,20;--neutral-rgb:111,103,94;--ink-rgb:31,27,22;--bg:#F4F2EE;--bg2:#FFFFFF;--bg3:#FAF9F6;--sidebar:#FBFAF8;--border:rgba(31,27,22,0.09);--border2:rgba(31,27,22,0.17);--text1:#1A1714;--text2:#4A443D;--text3:#6F675E;--overlay:rgba(26,23,20,0.42);--row-hover:rgba(140,94,20,0.045);--btn-text:#FFFFFF;--bg-hover:#EFECE6;--glass:rgba(255,255,255,0.86);--shadow-sm:0 1px 2px rgba(20,17,14,0.05),0 1px 1px rgba(20,17,14,0.03);--shadow-md:0 12px 32px rgba(20,17,14,0.12),0 2px 6px rgba(20,17,14,0.05);}
[data-theme="dark"]{--gold:#D9B26A;--gold-light:#E8CB8F;--gold-dim:#B8914A;--gold-bg:rgba(217,178,106,0.08);--gold-bg2:rgba(217,178,106,0.15);--gold-border:rgba(217,178,106,0.30);--accent-rgb:217,178,106;--neutral-rgb:189,181,169;--ink-rgb:237,230,218;--bg:#0E0D0B;--bg2:#171512;--bg3:#12110F;--sidebar:#12110F;--border:rgba(237,230,218,0.08);--border2:rgba(237,230,218,0.16);--text1:#EDE8E0;--text2:#BDB5A9;--text3:#8F877C;--overlay:rgba(8,7,6,0.78);--row-hover:rgba(217,178,106,0.05);--btn-text:#14120F;--bg-hover:#221F1A;--glass:rgba(23,21,18,0.78);--shadow-sm:0 1px 2px rgba(0,0,0,0.45);--shadow-md:0 16px 40px rgba(0,0,0,0.55),0 2px 6px rgba(0,0,0,0.3);}
html.theme-snap *,html.theme-snap *::before,html.theme-snap *::after{transition:none!important;}
::view-transition-old(root){animation:vtOut 360ms cubic-bezier(0.4,0,0.2,1) both;}
::view-transition-new(root){animation:vtIn 360ms cubic-bezier(0.4,0,0.2,1) both;}
@keyframes vtOut{from{opacity:1}to{opacity:0}}
@keyframes vtIn{from{opacity:0}to{opacity:1}}
`;
const ThemeCtx=createContext("light");
function useThemeMode(){return useContext(ThemeCtx);}
const TEAM_COLORS=["#B8914A","#60A5FA","#34D399","#F472B6","#A78BFA","#FB923C","#22D3EE","#F87171","#84CC16","#E879F9"];

const BANT_ITEMS=[
  {key:"budget",label:"Budget",desc:"Tem condição de investir?"},
  {key:"authority",label:"Authority",desc:"É quem decide a compra?"},
  {key:"need",label:"Need",desc:"Tem a dor ou necessidade real?"},
  {key:"timeline",label:"Timeline",desc:"Tem urgência para começar?"}
];

const DEFAULT_STAGES=[
  {key:"desqualificado",label:"Desqualificado",color:"#F87171"},
  {key:"novo",label:"Novo",color:GOLD},
  {key:"contato_iniciado",label:"Contato Iniciado",color:"#60A5FA"},
  {key:"conversando",label:"Conversando",color:"#38BDF8"},
  {key:"qualificado",label:"Qualificado",color:"#34D399"},
  {key:"reuniao_agendada",label:"Reunião Agendada",color:"#A78BFA"},
  {key:"reuniao_realizada",label:"Reunião Realizada",color:"#818CF8"},
  {key:"no_show",label:"No Show",color:"#FBBF24"},
  {key:"reagendamento",label:"Reagendamento",color:"#FB923C"},
  {key:"proposta_enviada",label:"Proposta Enviada",color:"#22D3EE"},
  {key:"manter_contato",label:"Manter Contato",color:"#94A3B8"},
  {key:"fechado",label:"Fechado",color:"#4ADE80"}
];

const KANBAN_STAGES=DEFAULT_STAGES;
const getClosedKeys=stages=>stages.filter(s=>s.key==="fechado").map(s=>s.key);
const getQualKeys=stages=>{const qi=stages.findIndex(s=>s.key==="qualificado");return qi>=0?stages.slice(qi).map(s=>s.key):["qualificado","reuniao_agendada","reuniao_realizada","reagendamento","proposta_enviada","manter_contato","fechado"];};
const getAgendKeys=stages=>{const ai=stages.findIndex(s=>s.key==="reuniao_agendada");return ai>=0?stages.slice(ai).map(s=>s.key):["reuniao_agendada","reuniao_realizada","reagendamento","proposta_enviada","manter_contato","fechado"];};
// Reunião/consulta que de fato aconteceu (inclui quem já avançou depois dela) vs. quem faltou
const REALIZADA_KEYS=["reuniao_realizada","proposta_enviada","manter_contato","fechado"];
const NOSHOW_KEYS=["no_show"];
// Etapas criadas pelo usuário: nomes de realizada/no-show caem nas keys fixas que o dashboard conta
const stageKeyFromLabel=label=>{const n=label.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();if(/no.?show|faltou|nao compareceu/.test(n))return"no_show";if(/realizad/.test(n)&&/reuniao|consulta|call|sessao|avaliacao/.test(n))return"reuniao_realizada";return n.replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");};

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



export { GOLD, BG, TEXT1, GOLD_HEX, EASE, THEME_CSS, ThemeCtx, useThemeMode, TEAM_COLORS, BANT_ITEMS, DEFAULT_STAGES, KANBAN_STAGES, getClosedKeys, getQualKeys, getAgendKeys, REALIZADA_KEYS, NOSHOW_KEYS, stageKeyFromLabel, NAV, fmt, pct, timeAgo, isInactive, playBeep, bantBadge, WA, GOLD_LIGHT, GOLD_DIM, GOLD_BG, GOLD_BG2, BG2, BG3, BORDER, BORDER2, TEXT2, TEXT3 };
