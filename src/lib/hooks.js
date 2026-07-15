import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase";
import { DEFAULT_STAGES, pct } from "./constants";

// ===== HOOKS =====
function useAuth(){
const[user,setUser]=useState(null);const[profile,setProfile]=useState(null);const[loading,setLoading]=useState(true);
useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);if(session?.user)loadProfile(session.user.id);else setLoading(false);});
const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null);if(session?.user){setLoading(true);loadProfile(session.user.id);}else{setProfile(null);setLoading(false);}});
return()=>subscription.unsubscribe();},[]);
const loadProfile=async(uid)=>{const{data}=await supabase.from("crm_usuarios").select("*,crm_clientes(nome,slug,dominio,tipo)").eq("user_id",uid).limit(1).single();setProfile(data);setLoading(false);};
const login=async(email,pw)=>{const{error}=await supabase.auth.signInWithPassword({email,password:pw});return error;};
const logout=async()=>{await supabase.auth.signOut();setUser(null);setProfile(null);};
return{user,profile,loading,login,logout,clienteId:profile?.cliente_id};}

function useLeads(cid,onNew){const[ld,setLd]=useState([]);const[lo,setLo]=useState(true);const f=useCallback(async(silent=false)=>{if(!cid)return;if(!silent)setLo(true);const{data}=await supabase.from("crm_leads").select("*").order("created_at",{ascending:false});if(data)setLd(data);setLo(false);},[cid]);useEffect(()=>{f();},[f]);
useEffect(()=>{if(!cid)return;const ch=supabase.channel("leads-rt").on("postgres_changes",{event:"INSERT",schema:"public",table:"crm_leads"},p=>{setLd(prev=>{if(prev.find(l=>l.id===p.new.id))return prev;onNew&&onNew(p.new);return[p.new,...prev];});}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"crm_leads"},p=>{setLd(prev=>prev.map(l=>l.id===p.new.id?{...l,...p.new}:l));}).subscribe();return()=>{supabase.removeChannel(ch);};},[cid]);
const up=async(id,u)=>{const{error}=await supabase.from("crm_leads").update(u).eq("id",id);if(!error)setLd(p=>p.map(l=>l.id===id?{...l,...u}:l));return!error;};
const add=async l=>{const{data,error}=await supabase.from("crm_leads").insert({...l,cliente_id:cid}).select();if(!error&&data){setLd(p=>[data[0],...p]);return{lead:data[0],error:null};}return{lead:null,error:error?.message||"Erro ao salvar lead"};};
const del=async id=>{await supabase.from("crm_leads").delete().eq("id",id);setLd(p=>p.filter(l=>l.id!==id));};
return{leads:ld,loading:lo,refetch:f,updateLead:up,addLead:add,deleteLead:del};}

function useEventos(cid){const[e,se]=useState([]);const[l,sl]=useState(true);useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.from("crm_eventos").select("*").order("created_at",{ascending:false}).limit(50);if(data)se(data);sl(false);})();},[cid]);return{eventos:e,loading:l};}
function useEquipe(cid){const[eq,se]=useState([]);const[l,sl]=useState(true);const f=useCallback(async()=>{if(!cid)return;sl(true);const{data}=await supabase.from("crm_equipe").select("*").order("created_at");if(data)se(data);sl(false);},[cid]);useEffect(()=>{f();},[f]);const add=async m=>{const{data,error}=await supabase.from("crm_equipe").insert({...m,cliente_id:cid}).select();if(!error&&data)se(p=>[...p,data[0]]);};const rm=async id=>{await supabase.from("crm_equipe").delete().eq("id",id);se(p=>p.filter(m=>m.id!==id));};const tog=async(id,a)=>{await supabase.from("crm_equipe").update({ativo:!a}).eq("id",id);se(p=>p.map(m=>m.id===id?{...m,ativo:!a}:m));};const updateDist=async(id,pct)=>{await supabase.from("crm_equipe").update({distribuicao_pct:pct}).eq("id",id);se(p=>p.map(m=>m.id===id?{...m,distribuicao_pct:pct}:m));};return{equipe:eq,loading:l,addMember:add,removeMember:rm,toggleActive:tog,updateDist};}
function useConfig(cid){const[c,sc]=useState(null);useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.from("crm_config").select("*").eq("ativo",true).limit(1).single();if(data)sc(data);})();},[cid]);return c;}
function useTemplates(cid){const[t,st]=useState([]);const[l,sl]=useState(true);useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.from("crm_templates").select("*").eq("ativo",true).order("created_at");if(data)st(data);sl(false);})();},[cid]);const add=async m=>{const{data,error}=await supabase.from("crm_templates").insert({...m,cliente_id:cid}).select();if(!error&&data)st(p=>[...p,data[0]]);};const rm=async id=>{await supabase.from("crm_templates").delete().eq("id",id);st(p=>p.filter(x=>x.id!==id));};return{templates:t,loading:l,addTemplate:add,removeTemplate:rm};}
function useEtiquetas(cid){const[tags,setTags]=useState([]);const f=useCallback(async()=>{if(!cid)return;const{data}=await supabase.from("crm_etiquetas").select("*").eq("ativo",true).order("ordem").order("created_at");if(data)setTags(data);},[cid]);useEffect(()=>{f();},[f]);
const add=async(nome,cor)=>{const{data,error}=await supabase.from("crm_etiquetas").insert({nome,cor,cliente_id:cid}).select();if(!error&&data){setTags(p=>[...p,data[0]]);return data[0];}return null;};
const rm=async id=>{await supabase.from("crm_etiquetas").update({ativo:false}).eq("id",id);setTags(p=>p.filter(t=>t.id!==id));};
return{tags,addTag:add,removeTag:rm};}
function useUnread(cid){const[map,setMap]=useState({});
useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.rpc("get_unread_counts");if(data){const m={};data.forEach(r=>{m[r.lead_id]=Number(r.unread);});setMap(m);}})();
const ch=supabase.channel("msgs-unread").on("postgres_changes",{event:"INSERT",schema:"public",table:"crm_mensagens"},p=>{if(p.new&&p.new.direction==="inbound"&&p.new.lead_id)setMap(prev=>({...prev,[p.new.lead_id]:(prev[p.new.lead_id]||0)+1}));}).subscribe();
return()=>{supabase.removeChannel(ch);};},[cid]);
const markRead=useCallback(async(leadId)=>{setMap(p=>p[leadId]?{...p,[leadId]:0}:p);await supabase.from("crm_leads").update({chat_lido_at:new Date().toISOString()}).eq("id",leadId);},[]);
return{unread:map,markRead};}
function useAtividades(id,cid){const[a,sa]=useState([]);useEffect(()=>{if(!id)return;(async()=>{const{data}=await supabase.from("crm_atividades").select("*").eq("lead_id",id).order("created_at",{ascending:false}).limit(20);if(data)sa(data);})();},[id]);const add=async(lid,tipo,desc)=>{const{data,error}=await supabase.from("crm_atividades").insert({lead_id:lid,tipo,descricao:desc,cliente_id:cid}).select();if(!error&&data)sa(p=>[data[0],...p]);};return{atividades:a,addAtividade:add};}

function useMessages(leadId,session){const[msgs,setMsgs]=useState([]);const[loading,setLoading]=useState(true);
useEffect(()=>{if(!leadId)return;setLoading(true);
(async()=>{let q=supabase.from("crm_mensagens").select("*").eq("lead_id",leadId);if(session)q=q.eq("waha_session",session);const{data}=await q.order("created_at",{ascending:true}).limit(100);if(data)setMsgs(data);setLoading(false);})();
const channel=supabase.channel(`msgs-${leadId}-${session||"all"}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"crm_mensagens",filter:`lead_id=eq.${leadId}`},(payload)=>{if(session&&payload.new.waha_session!==session)return;setMsgs(p=>{if(p.find(m=>m.id===payload.new.id))return p;return[...p,payload.new];});}).subscribe();
return()=>{supabase.removeChannel(channel);};},[leadId,session]);
const send=async(phone,content,clienteId,session,wahaJid,contentType,mediaUrl)=>{try{await fetch("https://n8n-production-2afe.up.railway.app/webhook/waha-enviar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,content:content||"",content_type:contentType||"text",media_url:mediaUrl||"",lead_id:leadId,cliente_id:clienteId,session,waha_jid:wahaJid||""})});return true;}catch{return false;}};
const uploadMedia=async(file)=>{const ext=file.name.split(".").pop();const path=`chat/${leadId}/${Date.now()}.${ext}`;const{data,error}=await supabase.storage.from("chat-media").upload(path,file,{contentType:file.type});if(error)return null;const{data:pub}=supabase.storage.from("chat-media").getPublicUrl(path);return pub?.publicUrl||null;};
return{msgs,loading,send,uploadMedia};}

function usePipelines(cid){const[pipelines,setPipelines]=useState([]);const[stages,setStages]=useState(DEFAULT_STAGES);const[activePipelineId,setActivePipelineId]=useState(null);const[loading,setLoading]=useState(true);
useEffect(()=>{if(!cid)return;(async()=>{const{data:pips}=await supabase.from("crm_pipelines").select("*").eq("ativo",true).order("created_at");if(pips&&pips.length>0){setPipelines(pips);const first=pips[0];setActivePipelineId(first.id);const{data:stgs}=await supabase.from("crm_pipeline_stages").select("*").eq("pipeline_id",first.id).order("ordem");if(stgs&&stgs.length>0)setStages(stgs);}setLoading(false);})();},[cid]);
const selectPipeline=async(pipelineId)=>{setActivePipelineId(pipelineId);const{data:stgs}=await supabase.from("crm_pipeline_stages").select("*").eq("pipeline_id",pipelineId).order("ordem");if(stgs&&stgs.length>0)setStages(stgs);else setStages(DEFAULT_STAGES);};
const addPipeline=async(nome)=>{const{data,error}=await supabase.from("crm_pipelines").insert({nome,cliente_id:cid}).select();if(!error&&data){setPipelines(p=>[...p,data[0]]);return data[0];}return null;};
const deletePipeline=async(id)=>{await supabase.from("crm_pipelines").delete().eq("id",id);setPipelines(p=>p.filter(x=>x.id!==id));if(activePipelineId===id&&pipelines.length>1){const next=pipelines.find(x=>x.id!==id);if(next)selectPipeline(next.id);}};
const renamePipeline=async(id,nome)=>{await supabase.from("crm_pipelines").update({nome}).eq("id",id);setPipelines(p=>p.map(x=>x.id===id?{...x,nome}:x));};
const duplicatePipeline=async(sourceId,newName)=>{const pip=await addPipeline(newName);if(!pip)return;const{data:srcStages}=await supabase.from("crm_pipeline_stages").select("*").eq("pipeline_id",sourceId).order("ordem");if(srcStages){const inserts=srcStages.map(s=>({pipeline_id:pip.id,key:s.key,label:s.label,color:s.color,ordem:s.ordem}));await supabase.from("crm_pipeline_stages").insert(inserts);}return pip;};
const addStage=async(pipelineId,label,color)=>{const key=label.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");const maxOrdem=stages.reduce((m,s)=>Math.max(m,s.ordem||0),0);const{data,error}=await supabase.from("crm_pipeline_stages").insert({pipeline_id:pipelineId,key,label,color,ordem:maxOrdem+1}).select();if(!error&&data)setStages(p=>[...p,data[0]]);};
const updateStage=async(id,updates)=>{await supabase.from("crm_pipeline_stages").update(updates).eq("id",id);setStages(p=>p.map(s=>s.id===id?{...s,...updates}:s));};
const deleteStage=async(id)=>{await supabase.from("crm_pipeline_stages").delete().eq("id",id);setStages(p=>p.filter(s=>s.id!==id));};
const reorderStages=async(fromIdx,toIdx)=>{const arr=[...stages];const[moved]=arr.splice(fromIdx,1);arr.splice(toIdx,0,moved);const updated=arr.map((s,i)=>({...s,ordem:i}));setStages(updated);for(const s of updated){await supabase.from("crm_pipeline_stages").update({ordem:s.ordem}).eq("id",s.id);}};
return{pipelines,stages,activePipelineId,loading,selectPipeline,addPipeline,deletePipeline,renamePipeline,duplicatePipeline,addStage,updateStage,deleteStage,reorderStages};}

function useAudioLibrary(cid){const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.from("crm_audio_library").select("*").eq("ativo",true).order("categoria").order("ordem");if(data)setItems(data);setLoading(false);})();},[cid]);
const addItem=async(item)=>{const{data,error}=await supabase.from("crm_audio_library").insert({...item,cliente_id:cid}).select();if(!error&&data){setItems(p=>[...p,data[0]]);return data[0];}return null;};
const removeItem=async(id)=>{await supabase.from("crm_audio_library").update({ativo:false}).eq("id",id);setItems(p=>p.filter(x=>x.id!==id));};
const categories=[...new Set(items.map(i=>i.categoria))];
return{items,loading,addItem,removeItem,categories};}

function useFunis(cid){const[funis,setFunis]=useState([]);const[loading,setLoading]=useState(true);
useEffect(()=>{if(!cid)return;(async()=>{const{data}=await supabase.from("crm_funis").select("*,crm_funil_etapas(*)").eq("ativo",true).order("created_at");if(data){const sorted=data.map(f=>({...f,crm_funil_etapas:(f.crm_funil_etapas||[]).sort((a,b)=>a.ordem-b.ordem)}));setFunis(sorted);}setLoading(false);})();},[cid]);
const addFunil=async(nome,categoria)=>{const{data,error}=await supabase.from("crm_funis").insert({nome,categoria:categoria||"geral",cliente_id:cid}).select();if(!error&&data){const f={...data[0],crm_funil_etapas:[]};setFunis(p=>[...p,f]);return f;}return null;};
const removeFunil=async(id)=>{await supabase.from("crm_funis").update({ativo:false}).eq("id",id);setFunis(p=>p.filter(x=>x.id!==id));};
const renameFunil=async(id,nome)=>{await supabase.from("crm_funis").update({nome}).eq("id",id);setFunis(p=>p.map(f=>f.id===id?{...f,nome}:f));};
const addEtapa=async(funilId,etapa)=>{const funil=funis.find(f=>f.id===funilId);const maxOrdem=funil?.crm_funil_etapas?.reduce((m,e)=>Math.max(m,e.ordem||0),0)||0;const{data,error}=await supabase.from("crm_funil_etapas").insert({funil_id:funilId,ordem:maxOrdem+1,...etapa}).select();if(!error&&data){setFunis(p=>p.map(f=>f.id===funilId?{...f,crm_funil_etapas:[...f.crm_funil_etapas,data[0]]}:f));return data[0];}return null;};
const removeEtapa=async(funilId,etapaId)=>{await supabase.from("crm_funil_etapas").delete().eq("id",etapaId);setFunis(p=>p.map(f=>f.id===funilId?{...f,crm_funil_etapas:f.crm_funil_etapas.filter(e=>e.id!==etapaId)}:f));};
const updateEtapa=async(funilId,etapaId,updates)=>{await supabase.from("crm_funil_etapas").update(updates).eq("id",etapaId);setFunis(p=>p.map(f=>f.id===funilId?{...f,crm_funil_etapas:f.crm_funil_etapas.map(e=>e.id===etapaId?{...e,...updates}:e)}:f));};
return{funis,loading,addFunil,removeFunil,renameFunil,addEtapa,removeEtapa,updateEtapa};}

function useAdsSpend(dateFrom,dateTo,cid){const[d,sd]=useState([]);const[l,sl]=useState(true);useEffect(()=>{if(!dateFrom||!dateTo||!cid)return;(async()=>{sl(true);let all=[],from=0;const page=1000;while(true){const{data,error}=await supabase.from("crm_ads_spend").select("*").gte("data",dateFrom).lte("data",dateTo).order("data").range(from,from+page-1);if(error||!data)break;all=all.concat(data);if(data.length<page)break;from+=page;}sd(all);sl(false);})();},[dateFrom,dateTo,cid]);const totals=useMemo(()=>{const spend=d.reduce((s,r)=>s+(r.spend||0),0);const impressions=d.reduce((s,r)=>s+(r.impressions||0),0);const clicks=d.reduce((s,r)=>s+(r.clicks||0),0);const leadsMeta=d.reduce((s,r)=>s+(r.leads_meta||0),0);const byCampaign={};const byAdset={};const byAd={};d.forEach(r=>{const ck=r.campaign_name||"—";if(!byCampaign[ck])byCampaign[ck]={spend:0,impressions:0,clicks:0,leads_meta:0};byCampaign[ck].spend+=r.spend||0;byCampaign[ck].impressions+=r.impressions||0;byCampaign[ck].clicks+=r.clicks||0;byCampaign[ck].leads_meta+=r.leads_meta||0;const ak=r.adset_name||"—";if(!byAdset[ak])byAdset[ak]={spend:0,impressions:0,clicks:0,leads_meta:0};byAdset[ak].spend+=r.spend||0;byAdset[ak].impressions+=r.impressions||0;byAdset[ak].clicks+=r.clicks||0;byAdset[ak].leads_meta+=r.leads_meta||0;const dk=r.ad_name||"—";if(!byAd[dk])byAd[dk]={spend:0,impressions:0,clicks:0,leads_meta:0};byAd[dk].spend+=r.spend||0;byAd[dk].impressions+=r.impressions||0;byAd[dk].clicks+=r.clicks||0;byAd[dk].leads_meta+=r.leads_meta||0;});return{spend,impressions,clicks,leadsMeta,byCampaign,byAdset,byAd,raw:d};},[d]);return{adsSpend:d,loading:l,totals};}



export { useAuth, useLeads, useEventos, useEquipe, useConfig, useTemplates, useEtiquetas, useUnread, useAtividades, useMessages, usePipelines, useAudioLibrary, useFunis, useAdsSpend };
