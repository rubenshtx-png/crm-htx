import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Target, Phone, Filter, LayoutDashboard, Kanban, BarChart3, Radio, Settings, X, Check, AlertTriangle, Zap, Plus, Trash2, Eye, EyeOff, Award, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "./lib/supabase";

// ============ DESIGN TOKENS ============
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E2C97E";
const GOLD_DIM = "#8B7535";
const GOLD_BG = "rgba(201,168,76,0.08)";
const GOLD_BG2 = "rgba(201,168,76,0.15)";
const BG = "#09090B";
const BG2 = "#0F0F12";
const BG3 = "#16161A";
const BORDER = "rgba(201,168,76,0.08)";
const BORDER2 = "rgba(201,168,76,0.15)";
const TEXT1 = "#FAFAF9";
const TEXT2 = "rgba(250,250,249,0.55)";
const TEXT3 = "rgba(250,250,249,0.3)";

const STAGES = [
  { key: "novo", label: "Novo", color: GOLD },
  { key: "em_contato", label: "Em Contato", color: "#60A5FA" },
  { key: "qualificado", label: "Qualificado", color: "#34D399" },
  { key: "desqualificado", label: "Desqualificado", color: "#F87171" },
  { key: "agendado", label: "Agendado", color: "#A78BFA" },
  { key: "no_show", label: "No Show", color: "#FBBF24" },
  { key: "em_negociacao", label: "Em Negociação", color: "#22D3EE" },
  { key: "venda", label: "Venda", color: "#4ADE80" },
  { key: "perdido", label: "Perdido", color: "#6B7280" },
];

const KANBAN_STAGES = STAGES.filter(s => !["desqualificado", "no_show", "perdido"].includes(s.key));
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "crm", label: "Pipeline", icon: Kanban },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "tracking", label: "Tracking", icon: Radio },
  { key: "config", label: "Configurações", icon: Settings },
];

const fmt = (v) => v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }) : "R$ 0";
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

// ============ SUPABASE HOOKS ============
function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateLead = async (id, updates) => {
    const { error } = await supabase.from("crm_leads").update(updates).eq("id", id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }
    return !error;
  };

  return { leads, loading, refetch: fetch, updateLead };
}

function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("crm_eventos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setEventos(data);
      setLoading(false);
    })();
  }, []);

  return { eventos, loading };
}

function useEquipe() {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_equipe")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setEquipe(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addMember = async (member) => {
    const { data, error } = await supabase.from("crm_equipe").insert(member).select();
    if (!error && data) setEquipe(prev => [...prev, data[0]]);
    return !error;
  };

  const removeMember = async (id) => {
    const { error } = await supabase.from("crm_equipe").delete().eq("id", id);
    if (!error) setEquipe(prev => prev.filter(m => m.id !== id));
  };

  const toggleActive = async (id, ativo) => {
    const { error } = await supabase.from("crm_equipe").update({ ativo: !ativo }).eq("id", id);
    if (!error) setEquipe(prev => prev.map(m => m.id === id ? { ...m, ativo: !ativo } : m));
  };

  return { equipe, loading, addMember, removeMember, toggleActive, refetch: fetch };
}

function useConfig() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("crm_config").select("*").eq("ativo", true).limit(1).single();
      if (data) setConfig(data);
    })();
  }, []);
  return config;
}

// ============ COMPONENTS ============
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, userSelect: "none" }}>
      <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: TEXT1 }}>HT</span>
      <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DIM})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span>
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return <div className={className} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, ...style }}>{children}</div>;
}

function Spinner() {
  return <div className="flex items-center justify-center p-12"><Loader2 size={24} style={{ color: GOLD, animation: "spin 1s linear infinite" }} /></div>;
}

function MetricCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <Card style={{ padding: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: accent ? GOLD_BG2 : "rgba(255,255,255,0.04)" }}>
          <Icon size={15} style={{ color: accent ? GOLD : TEXT2 }} />
        </div>
        <span style={{ fontSize: 11, color: TEXT3, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: accent ? GOLD_LIGHT : TEXT1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function FunnelBar({ label, value, maxVal, color, rate }) {
  const w = maxVal > 0 ? (value / maxVal) * 100 : 0;
  return (
    <div className="flex items-center gap-3" style={{ padding: "5px 0" }}>
      <div style={{ width: 100, textAlign: "right", flexShrink: 0, fontSize: 12, color: TEXT2 }}>{label}</div>
      <div className="flex-1 overflow-hidden" style={{ height: 26, borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center" style={{ height: "100%", width: `${Math.max(w, 4)}%`, borderRadius: 6, background: color, opacity: 0.85, paddingLeft: 8, transition: "width 0.8s ease" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{value}</span>
        </div>
      </div>
      <div style={{ width: 42, textAlign: "right", flexShrink: 0, fontSize: 11, color: TEXT3 }}>{rate}%</div>
    </div>
  );
}

function LeadCard({ lead, onClick }) {
  return (
    <div onClick={() => onClick?.(lead)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = GOLD_DIM}
      onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: TEXT1 }}>{lead.nome}</span>
        {lead.tags?.includes("vip") && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: GOLD_BG2, color: GOLD, fontWeight: 600 }}>VIP</span>}
      </div>
      <div className="flex items-center gap-1" style={{ fontSize: 11, color: TEXT3 }}>
        <Phone size={10} /> {lead.telefone || "-"}
      </div>
      {lead.quali_score > 0 && (
        <div className="flex gap-1" style={{ marginTop: 8 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= lead.quali_score ? GOLD : "rgba(255,255,255,0.06)" }} />)}
        </div>
      )}
      {lead.valor_venda && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{fmt(lead.valor_venda)}</div>}
      <div style={{ marginTop: 6, fontSize: 9, color: TEXT3 }}>{lead.utm_campaign || "—"}</div>
    </div>
  );
}

function LeadModal({ lead, onClose, onUpdate, equipe }) {
  const [stage, setStage] = useState(lead.stage);
  const [qualiScore, setQualiScore] = useState(lead.quali_score || 0);
  const [valorVenda, setValorVenda] = useState(lead.valor_venda || "");
  const [sdrNome, setSdrNome] = useState(lead.sdr_nome || "");
  const [closerNome, setCloserNome] = useState(lead.closer_nome || "");
  const [saving, setSaving] = useState(false);
  const stageInfo = STAGES.find(s => s.key === lead.stage);
  const sdrs = equipe.filter(m => m.papel === "sdr" && m.ativo);
  const closers = equipe.filter(m => m.papel === "closer" && m.ativo);

  const save = async () => {
    setSaving(true);
    const updates = {
      stage,
      quali_score: qualiScore,
      valor_venda: valorVenda ? parseFloat(valorVenda) : null,
      sdr_nome: sdrNome || null,
      closer_nome: closerNome || null,
    };
    if (stage === "qualificado" && lead.stage !== "qualificado") updates.qualificado_at = new Date().toISOString();
    if (stage === "agendado" && lead.stage !== "agendado") updates.agendado_at = new Date().toISOString();
    if (stage === "venda" && lead.stage !== "venda") updates.venda_at = new Date().toISOString();
    if (stage === "em_contato" && !lead.contatado_at) updates.contatado_at = new Date().toISOString();
    await onUpdate(lead.id, updates);
    setSaving(false);
    onClose();
  };

  const selectStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: BG3, color: TEXT1, fontSize: 13, outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
      <div style={{ width: "100%", maxWidth: 560, background: BG2, border: `1px solid ${BORDER2}`, borderRadius: 16, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT1, margin: 0 }}>{lead.nome}</h3>
            <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${stageInfo?.color}18`, color: stageInfo?.color, fontWeight: 500 }}>{stageInfo?.label}</span>
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: TEXT2 }}><X size={16} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Email", value: lead.email || "—" },
            { label: "Telefone", value: lead.telefone || "—" },
            { label: "Campanha", value: lead.utm_campaign || "—" },
            { label: "Conjunto", value: lead.utm_term || "—" },
            { label: "Criativo", value: lead.utm_content || "—" },
            { label: "Fonte", value: lead.utm_source || "—" },
          ].map(f => (
            <div key={f.label} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: TEXT1 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Estágio</label>
            <select value={stage} onChange={e => setStage(e.target.value)} style={selectStyle}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Score BANT (0-4)</label>
            <select value={qualiScore} onChange={e => setQualiScore(parseInt(e.target.value))} style={selectStyle}>
              {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>SDR</label>
            <select value={sdrNome} onChange={e => setSdrNome(e.target.value)} style={selectStyle}>
              <option value="">Selecionar...</option>
              {sdrs.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Closer</label>
            <select value={closerNome} onChange={e => setCloserNome(e.target.value)} style={selectStyle}>
              <option value="">Selecionar...</option>
              {closers.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        {(stage === "venda" || stage === "em_negociacao") && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Valor da venda (R$)</label>
            <input type="number" value={valorVenda} onChange={e => setValorVenda(e.target.value)} placeholder="50000" style={{ ...selectStyle, MozAppearance: "textfield" }} />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: TEXT2, marginBottom: 10 }}>Qualificação BANT</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(i => (
              <button key={i} onClick={() => setQualiScore(qualiScore === i ? i - 1 : i)}
                style={{ width: 40, height: 20, borderRadius: 4, border: "none", cursor: "pointer", background: i <= qualiScore ? GOLD : "rgba(255,255,255,0.06)", transition: "background 0.2s" }} />
            ))}
            <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginLeft: 8 }}>{qualiScore}/4</span>
          </div>
        </div>

        <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Atribuição</div>
          <div className="flex gap-4" style={{ fontSize: 11, color: TEXT2 }}>
            <span>fbclid: {lead.fbc ? <span style={{ color: GOLD }}>✓</span> : <span style={{ color: "#F87171" }}>✗</span>}</span>
            <span>Origem: {lead.origem || "—"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            style={{ flex: 1, padding: "10px 20px", borderRadius: 8, border: "none", background: GOLD, color: BG, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT3, fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ PAGES ============
function DashboardPage({ leads }) {
  const total = leads.length;
  const qualificados = leads.filter(l => ["qualificado", "agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)).length;
  const agendados = leads.filter(l => ["agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)).length;
  const compareceram = leads.filter(l => ["em_negociacao", "venda"].includes(l.stage)).length;
  const vendas = leads.filter(l => l.stage === "venda");
  const receita = vendas.reduce((s, l) => s + (l.valor_venda || 0), 0);
  const ticketMedio = vendas.length > 0 ? Math.round(receita / vendas.length) : 0;
  const maiorVenda = vendas.length > 0 ? Math.max(...vendas.map(l => l.valor_venda || 0)) : 0;

  const funnelData = [
    { label: "Leads", value: total, color: GOLD, rate: 100 },
    { label: "Qualificados", value: qualificados, color: "#34D399", rate: pct(qualificados, total) },
    { label: "Agendados", value: agendados, color: "#A78BFA", rate: pct(agendados, total) },
    { label: "Compareceram", value: compareceram, color: "#22D3EE", rate: pct(compareceram, total) },
    { label: "Vendas", value: vendas.length, color: "#4ADE80", rate: pct(vendas.length, total) },
  ];

  const dailyData = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const d = new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!map[d]) map[d] = { dia: d, leads: 0, vendas: 0 };
      map[d].leads++;
      if (l.stage === "venda") map[d].vendas++;
    });
    return Object.values(map).slice(-14);
  }, [leads]);

  const lossReasons = useMemo(() => {
    const map = {};
    leads.filter(l => l.motivo_perda_categoria).forEach(l => {
      map[l.motivo_perda_categoria] = (map[l.motivo_perda_categoria] || 0) + 1;
    });
    const colors = { sem_budget: "#F87171", nao_respondeu: "#6B7280", sem_interesse: "#FBBF24", escolheu_concorrente: "#A78BFA", timing_ruim: "#22D3EE", nao_qualificado: "#FB923C", outro: "#94A3B8" };
    const labels = { sem_budget: "Sem budget", nao_respondeu: "Não respondeu", sem_interesse: "Sem interesse", escolheu_concorrente: "Concorrente", timing_ruim: "Timing", nao_qualificado: "Não qualificado", outro: "Outro" };
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v, color: colors[k] || "#6B7280" }));
  }, [leads]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard icon={Users} label="Total leads" value={total} accent />
        <MetricCard icon={UserCheck} label="Qualificados" value={qualificados} sub={`${pct(qualificados, total)}% taxa`} />
        <MetricCard icon={Calendar} label="Agendados" value={agendados} sub={`${pct(agendados, qualificados)}% dos qualificados`} />
        <MetricCard icon={DollarSign} label="Vendas" value={vendas.length} sub={`${pct(vendas.length, total)}% geral`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard icon={DollarSign} label="Receita" value={fmt(receita)} accent />
        <MetricCard icon={Target} label="Ticket médio" value={fmt(ticketMedio)} />
        <MetricCard icon={Zap} label="Maior venda" value={fmt(maiorVenda)} />
        <MetricCard icon={TrendingUp} label="Leads / venda" value={vendas.length > 0 ? Math.round(total / vendas.length) : "—"} sub="leads necessários" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 12 }}>Funil de conversão</h3>
          {funnelData.map(f => <FunnelBar key={f.label} {...f} maxVal={total} />)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            {[
              { v: vendas.length > 0 ? Math.round(total / vendas.length) : "—", l: "Leads / venda" },
              { v: vendas.length > 0 ? Math.round(qualificados / vendas.length) : "—", l: "Qualif. / venda" },
              { v: vendas.length > 0 ? Math.round(agendados / vendas.length) : "—", l: "Agend. / venda" },
            ].map(m => (
              <div key={m.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: GOLD_LIGHT }}>{m.v}</div>
                <div style={{ fontSize: 9, color: TEXT3, marginTop: 2 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 12 }}>Motivos de perda</h3>
          {lossReasons.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <PieChart width={160} height={160}>
                  <Pie data={lossReasons} cx={80} cy={80} innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                    {lossReasons.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </div>
              {lossReasons.map(r => (
                <div key={r.name} className="flex items-center justify-between" style={{ padding: "4px 0" }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                    <span style={{ fontSize: 11, color: TEXT2 }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: TEXT1 }}>{r.value}</span>
                </div>
              ))}
            </>
          ) : <div style={{ fontSize: 12, color: TEXT3, textAlign: "center", padding: 40 }}>Sem dados de perda ainda</div>}
        </Card>
      </div>

      {dailyData.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 12 }}>Leads por dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GOLD} stopOpacity={0.25} /><stop offset="95%" stopColor={GOLD} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="dia" tick={{ fill: TEXT3, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TEXT3, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: BG3, border: `1px solid ${BORDER2}`, borderRadius: 8, color: TEXT1, fontSize: 11 }} />
              <Area type="monotone" dataKey="leads" stroke={GOLD} fill="url(#gL)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function CRMPage({ leads, onLeadClick }) {
  const grouped = useMemo(() => {
    const g = {};
    KANBAN_STAGES.forEach(s => { g[s.key] = []; });
    leads.forEach(l => { if (g[l.stage]) g[l.stage].push(l); });
    return g;
  }, [leads]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
      {KANBAN_STAGES.map(stage => (
        <div key={stage.key} style={{ width: 230, flexShrink: 0, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12, padding: "0 4px" }}>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: TEXT2 }}>{stage.label}</span>
            </div>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: TEXT3 }}>{grouped[stage.key]?.length || 0}</span>
          </div>
          {grouped[stage.key]?.map(lead => <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />)}
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage({ leads }) {
  const [tab, setTab] = useState("campanha");

  function aggregate(field) {
    const map = {};
    leads.forEach(l => {
      const key = l[field] || "não definido";
      if (!map[key]) map[key] = { name: key, leads: 0, qualificados: 0, agendados: 0, vendas: 0, receita: 0 };
      map[key].leads++;
      if (["qualificado", "agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)) map[key].qualificados++;
      if (["agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)) map[key].agendados++;
      if (l.stage === "venda") { map[key].vendas++; map[key].receita += l.valor_venda || 0; }
    });
    return Object.values(map).sort((a, b) => b.receita - a.receita);
  }

  const fieldMap = { campanha: "utm_campaign", conjunto: "utm_term", criativo: "utm_content" };
  const activeData = useMemo(() => aggregate(fieldMap[tab]), [leads, tab]);

  const closers = useMemo(() => {
    const map = {};
    leads.filter(l => l.closer_nome).forEach(l => {
      if (!map[l.closer_nome]) map[l.closer_nome] = { name: l.closer_nome, reunioes: 0, vendas: 0, receita: 0 };
      if (["em_negociacao", "venda", "perdido"].includes(l.stage)) map[l.closer_nome].reunioes++;
      if (l.stage === "venda") { map[l.closer_nome].vendas++; map[l.closer_nome].receita += l.valor_venda || 0; }
    });
    return Object.values(map).sort((a, b) => b.receita - a.receita);
  }, [leads]);

  const sdrs = useMemo(() => {
    const map = {};
    leads.filter(l => l.sdr_nome).forEach(l => {
      if (!map[l.sdr_nome]) map[l.sdr_nome] = { name: l.sdr_nome, leads: 0, qualificados: 0, agendados: 0 };
      map[l.sdr_nome].leads++;
      if (["qualificado", "agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)) map[l.sdr_nome].qualificados++;
      if (["agendado", "no_show", "em_negociacao", "venda"].includes(l.stage)) map[l.sdr_nome].agendados++;
    });
    return Object.values(map);
  }, [leads]);

  const cols = [
    { key: "name", label: tab.charAt(0).toUpperCase() + tab.slice(1) },
    { key: "leads", label: "Leads" },
    { key: "qualificados", label: "Qualif." },
    { key: "agendados", label: "Agend." },
    { key: "vendas", label: "Vendas" },
    { key: "receita", label: "Receita" },
    { key: "taxa_q", label: "% Qual." },
    { key: "taxa_v", label: "% Venda" },
    { key: "lpv", label: "Leads/Venda" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, margin: 0 }}>Performance de ads</h3>
          <div className="flex gap-1" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}>
            {["campanha", "conjunto", "criativo"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer", background: tab === t ? GOLD_BG2 : "transparent", color: tab === t ? GOLD : TEXT3 }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {cols.map(c => <th key={c.key} style={{ textAlign: "left", padding: 8, fontWeight: 500, color: TEXT3, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeData.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "10px 8px", color: TEXT1, fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{row.leads}</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{row.qualificados}</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{row.agendados}</td>
                  <td style={{ padding: "10px 8px", color: "#4ADE80", fontWeight: 500 }}>{row.vendas}</td>
                  <td style={{ padding: "10px 8px", color: "#4ADE80" }}>{fmt(row.receita)}</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{pct(row.qualificados, row.leads)}%</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{pct(row.vendas, row.leads)}%</td>
                  <td style={{ padding: "10px 8px", color: TEXT2 }}>{row.vendas > 0 ? Math.round(row.leads / row.vendas) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 16 }}>Receita por {tab}</h3>
        <ResponsiveContainer width="100%" height={Math.max(activeData.length * 40 + 40, 140)}>
          <BarChart data={activeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" tick={{ fill: TEXT3, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${Math.round(v / 1000)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fill: TEXT2, fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
            <Tooltip contentStyle={{ background: BG3, border: `1px solid ${BORDER2}`, borderRadius: 8, color: TEXT1, fontSize: 11 }} formatter={v => fmt(v)} />
            <Bar dataKey="receita" fill={GOLD} radius={[0, 4, 4, 0]} barSize={18} name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 16 }}>SDRs</h3>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["SDR", "Leads", "Qualif.", "Agend.", "% Qual."].map(h => <th key={h} style={{ textAlign: "left", padding: 8, fontWeight: 500, color: TEXT3, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>{sdrs.map(s => (
              <tr key={s.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "10px 8px", color: TEXT1, fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: "10px 8px", color: TEXT2 }}>{s.leads}</td>
                <td style={{ padding: "10px 8px", color: TEXT2 }}>{s.qualificados}</td>
                <td style={{ padding: "10px 8px", color: TEXT2 }}>{s.agendados}</td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: pct(s.qualificados, s.leads) >= 35 ? "rgba(74,222,128,0.1)" : GOLD_BG, color: pct(s.qualificados, s.leads) >= 35 ? "#4ADE80" : GOLD }}>
                    {pct(s.qualificados, s.leads)}%
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 16 }}>Closers</h3>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Closer", "Reuniões", "Vendas", "Receita", "Fecham."].map(h => <th key={h} style={{ textAlign: "left", padding: 8, fontWeight: 500, color: TEXT3, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>{closers.map(c => (
              <tr key={c.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "10px 8px", color: TEXT1, fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: "10px 8px", color: TEXT2 }}>{c.reunioes}</td>
                <td style={{ padding: "10px 8px", color: "#4ADE80", fontWeight: 500 }}>{c.vendas}</td>
                <td style={{ padding: "10px 8px", color: "#4ADE80" }}>{fmt(c.receita)}</td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: pct(c.vendas, c.reunioes) >= 30 ? "rgba(74,222,128,0.1)" : GOLD_BG, color: pct(c.vendas, c.reunioes) >= 30 ? "#4ADE80" : GOLD }}>
                    {pct(c.vendas, c.reunioes)}%
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function TrackingPage({ eventos }) {
  const total = eventos.length;
  const sucesso = eventos.filter(e => e.sucesso).length;
  const erros = eventos.filter(e => !e.sucesso).length;
  const byType = useMemo(() => {
    const map = {};
    eventos.forEach(e => { map[e.evento] = (map[e.evento] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, [eventos]);
  const colors = { Lead: GOLD, QualifiedLead: "#34D399", Schedule: "#A78BFA", Purchase: "#4ADE80" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <MetricCard icon={Zap} label="Eventos enviados" value={total} accent />
        <MetricCard icon={Check} label="Taxa de sucesso" value={`${pct(sucesso, total)}%`} sub={`${sucesso} eventos`} />
        <MetricCard icon={AlertTriangle} label="Erros" value={erros} />
      </div>
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 16 }}>Eventos por tipo</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byType}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" tick={{ fill: TEXT2, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: TEXT3, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: BG3, border: `1px solid ${BORDER2}`, borderRadius: 8, color: TEXT1, fontSize: 11 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>{byType.map((e, i) => <Cell key={i} fill={colors[e.name] || GOLD} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 16 }}>Log de eventos</h3>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {["Evento", "Plataforma", "Status", "Data"].map(h => <th key={h} style={{ textAlign: "left", padding: 8, fontWeight: 500, color: TEXT3, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>{eventos.map(e => (
            <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
              <td style={{ padding: "10px 8px" }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: `${colors[e.evento] || GOLD}15`, color: colors[e.evento] || GOLD }}>{e.evento}</span></td>
              <td style={{ padding: "10px 8px", color: TEXT2, textTransform: "capitalize" }}>{e.plataforma}</td>
              <td style={{ padding: "10px 8px" }}>{e.sucesso ? <span className="flex items-center gap-1" style={{ color: "#4ADE80" }}><Check size={12} /> Sucesso</span> : <span className="flex items-center gap-1" style={{ color: "#F87171" }}><X size={12} /> {e.erro}</span>}</td>
              <td style={{ padding: "10px 8px", color: TEXT3 }}>{new Date(e.created_at).toLocaleString("pt-BR")}</td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function ConfigPage({ equipe, eqLoading, addMember, removeMember, toggleActive, config }) {
  const [showForm, setShowForm] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formPapel, setFormPapel] = useState("sdr");
  const [formTel, setFormTel] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const handleAdd = async () => {
    if (!formNome.trim()) return;
    await addMember({ nome: formNome, papel: formPapel, telefone: formTel, email: formEmail, ativo: true });
    setFormNome(""); setFormTel(""); setFormEmail(""); setShowForm(false);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: BG3, color: TEXT1, fontSize: 13, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginBottom: 20 }}>Configurações do Pixel</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 600 }}>
          {[
            { label: "Pixel ID", value: config?.meta_pixel_id || "—" },
            { label: "Access Token", value: config?.meta_access_token ? "••••••••••••" : "—" },
            { label: "Test Event Code", value: config?.meta_test_event_code || "Produção" },
            { label: "Domínio", value: config?.dominio || "—" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{f.label}</label>
              <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: BG3, fontSize: 12, color: TEXT2 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT2, margin: 0 }}>Equipe</h3>
            <p style={{ fontSize: 11, color: TEXT3, margin: "4px 0 0" }}>SDRs e Closers</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: GOLD_BG2, color: GOLD, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {showForm && (
          <div style={{ background: BG3, border: `1px solid ${BORDER2}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Nome</label>
                <input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Nome completo" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Papel</label>
                <select value={formPapel} onChange={e => setFormPapel(e.target.value)} style={inputStyle}>
                  <option value="sdr">SDR</option>
                  <option value="closer">Closer</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Telefone</label>
                <input value={formTel} onChange={e => setFormTel(e.target.value)} placeholder="5511999..." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email</label>
                <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@..." style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GOLD, color: BG, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT3, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}

        {eqLoading ? <Spinner /> : ["sdr", "closer"].map(papel => {
          const members = equipe.filter(m => m.papel === papel);
          return (
            <div key={papel} style={{ marginBottom: 20 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                {papel === "sdr" ? <Phone size={14} style={{ color: GOLD }} /> : <Award size={14} style={{ color: GOLD }} />}
                <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, textTransform: "uppercase", letterSpacing: "0.05em" }}>{papel === "sdr" ? "SDRs" : "Closers"}</span>
                <span style={{ fontSize: 10, color: TEXT3 }}>({members.length})</span>
              </div>
              {members.length === 0 && <div style={{ fontSize: 12, color: TEXT3, padding: "10px 0" }}>Nenhum {papel} cadastrado</div>}
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between"
                  style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 6, opacity: m.ativo ? 1 : 0.5 }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD_BG2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: GOLD }}>
                      {m.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: TEXT1 }}>{m.nome}</div>
                      <div style={{ fontSize: 10, color: TEXT3 }}>{m.telefone || ""} {m.email ? `• ${m.email}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(m.id, m.ativo)} style={{ padding: 6, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: m.ativo ? "#4ADE80" : TEXT3 }}>
                      {m.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => removeMember(m.id)} style={{ padding: 6, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: "#F87171" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ============ APP ============
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState(null);
  const { leads, loading: leadsLoading, refetch, updateLead } = useLeads();
  const { eventos, loading: eventosLoading } = useEventos();
  const { equipe, loading: eqLoading, addMember, removeMember, toggleActive } = useEquipe();
  const config = useConfig();

  const vendas = leads.filter(l => l.stage === "venda");

  return (
    <div className="flex" style={{ minHeight: "100vh", background: BG }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <aside style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: 16, display: "flex", flexDirection: "column", background: BG2 }}>
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <Logo />
          <p style={{ fontSize: 9, color: TEXT3, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>CRM High Ticket</p>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", width: "100%",
                background: page === n.key ? GOLD_BG2 : "transparent",
                color: page === n.key ? GOLD : TEXT3 }}>
              <n.icon size={16} />
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ paddingTop: 16, borderTop: `1px solid ${BORDER}`, marginTop: "auto" }}>
          <div style={{ fontSize: 10, color: GOLD_DIM }}>{config?.nome_negocio || "CRM"}</div>
          <div style={{ fontSize: 9, color: TEXT3, marginTop: 2 }}>{leads.length} leads • {vendas.length} vendas</div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24, overflowY: "auto", maxHeight: "100vh" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT1, margin: 0 }}>{NAV.find(n => n.key === page)?.label}</h2>
            <p style={{ fontSize: 11, color: TEXT3, margin: "4px 0 0" }}>{leads.length} leads no total</p>
          </div>
          <button onClick={refetch} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT3, fontSize: 11, cursor: "pointer" }}>
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>

        {page === "dashboard" && (leadsLoading ? <Spinner /> : <DashboardPage leads={leads} />)}
        {page === "crm" && (leadsLoading ? <Spinner /> : <CRMPage leads={leads} onLeadClick={setSelectedLead} />)}
        {page === "analytics" && (leadsLoading ? <Spinner /> : <AnalyticsPage leads={leads} />)}
        {page === "tracking" && (eventosLoading ? <Spinner /> : <TrackingPage eventos={eventos} />)}
        {page === "config" && <ConfigPage equipe={equipe} eqLoading={eqLoading} addMember={addMember} removeMember={removeMember} toggleActive={toggleActive} config={config} />}
      </main>

      {selectedLead && <LeadModal lead={selectedLead} onClose={() => { setSelectedLead(null); refetch(); }} onUpdate={updateLead} equipe={equipe} />}
    </div>
  );
}
