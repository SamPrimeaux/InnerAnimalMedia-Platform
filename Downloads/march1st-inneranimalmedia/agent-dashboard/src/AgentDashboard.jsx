import { useState, useEffect, useRef, useCallback } from "react";

const MOCK_AGENTS = [
  { id: "ai_sam_v1", name: "Agent Sam", role_name: "iam_agent_sam_security", status: "active", mode: "orchestrator", safety_level: "strict", total_runs: 0, total_cost_usd: 0 },
  { id: "ai_sam_claude_pro_opus46", name: "Sam - Claude Opus 4.6", role_name: "ai_sam_claude_pro_opus46", status: "active", mode: "subscription_registry", safety_level: "strict", total_runs: 0, total_cost_usd: 0 },
  { id: "ai_sam_chatgpt52", name: "Sam - GPT-5.2", role_name: "ai_sam_chatgpt52", status: "active", mode: "subscription_registry", safety_level: "strict", total_runs: 0, total_cost_usd: 0 },
  { id: "ai_sam_claude_sonnet", name: "Sam - Claude Sonnet 4.5", role_name: "ai_sam_claude_sonnet", status: "active", mode: "subscription_registry", safety_level: "balanced", total_runs: 0, total_cost_usd: 0 },
];

const MOCK_MODELS = [
  { id: "cursor:anthropic_claude_opus_4_6", provider: "anthropic", model_key: "claude_opus_4_6", display_name: "Claude Opus 4.6", supports_tools: 1, supports_vision: 1, supports_web_search: 1, input_rate_per_mtok: 15, output_rate_per_mtok: 75 },
  { id: "cursor:anthropic_claude_sonnet_4_5", provider: "anthropic", model_key: "claude_sonnet_4_5", display_name: "Claude Sonnet 4.5", supports_tools: 1, supports_vision: 1, supports_web_search: 1, input_rate_per_mtok: 3, output_rate_per_mtok: 15 },
  { id: "cursor:anthropic_claude_haiku_4_5", provider: "anthropic", model_key: "claude_haiku_4_5", display_name: "Claude Haiku 4.5", supports_tools: 1, supports_vision: 1, supports_web_search: 0, input_rate_per_mtok: 0.25, output_rate_per_mtok: 1.25 },
  { id: "cursor:openai_gpt_5_2", provider: "openai", model_key: "openai_gpt_5_2", display_name: "GPT-5.2", supports_tools: 1, supports_vision: 0, supports_web_search: 0, input_rate_per_mtok: 10, output_rate_per_mtok: 30 },
  { id: "workers_ai:text_generation", provider: "cloudflare_workers_ai", model_key: "workers_ai_text_generation", display_name: "Workers AI Text", supports_tools: 1, supports_vision: 0, supports_web_search: 0, input_rate_per_mtok: 0, output_rate_per_mtok: 0 },
];

const MOCK_MCP = [
  { id: "mcp_ecosystem", service_name: "IAM SaaS Ecosystem MCP", endpoint_url: "https://mcp.inneranimalmedia.com/", is_active: 1, health_status: "healthy" },
  { id: "mcp_inneranimal", service_name: "InnerAnimal Media MCP", endpoint_url: "https://inneranimalmedia-mcp.meauxbility.workers.dev", is_active: 1, health_status: "healthy" },
];

const MOCK_CIDI = [
  { workflow_id: "wf-001", workflow_name: "IAM Dashboard CMS Audit", workflow_type: "audit", implementation_status: "in_progress", priority: "high", client_name: "Inner Animal Media" },
  { workflow_id: "wf-002", workflow_name: "Swamp Blood Shopify Migration", workflow_type: "migration", implementation_status: "pending", priority: "urgent", client_name: "Swamp Blood Gator Guides" },
  { workflow_id: "wf-003", workflow_name: "Agent Sam CI/CD Pipeline", workflow_type: "deployment", implementation_status: "testing", priority: "high", client_name: "IAM Platform" },
];

const PROVIDER_COLORS = {
  anthropic: "#d97706",
  openai: "#10b981",
  google: "#3b82f6",
  cloudflare_workers_ai: "#f97316",
};

const STATUS_COLORS = {
  active: "#22c55e", paused: "#eab308", inactive: "#6b7280",
  healthy: "#22c55e", degraded: "#f59e0b", down: "#ef4444",
  in_progress: "#3b82f6", pending: "#6b7280", testing: "#a855f7",
  completed: "#22c55e", cancelled: "#6b7280", blocked: "#ef4444",
};

const WORKFLOW_TABS = ["Ask", "Agent", "Plan", "Debug"];
const COMPANY_ICON = "https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/ac515729-af6b-4ea5-8b10-e581a4d02100/thumbnail";
const LOADING_SAYINGS = [
  "Checking the D1 connection...",
  "Asking the models nicely...",
  "Counting tokens so you don't have to...",
  "Warming up the hamster wheel...",
  "Polishing the response...",
  "Almost there (we promise)...",
  "Consulting the rubber duck...",
  "Running it through the good-taste filter...",
];
const WELCOME_COMMANDS = [
  { label: "New Agent", desc: "Start a new conversation", cmd: "new" },
  { label: "Search", desc: "Find files and content", cmd: "search" },
  { label: "Branch", desc: "View changes and commit", cmd: "branch" },
  { label: "Terminal", desc: "Run bash and zsh", cmd: "terminal" },
  { label: "Extensions", desc: "Access/configure AI/MCP", cmd: "extensions" },
  { label: "Preview", desc: "Live browser and builds", cmd: "preview" },
];

export default function AgentDashboard() {
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [models, setModels] = useState(MOCK_MODELS);
  const [mcpServices, setMcpServices] = useState(MOCK_MCP);
  const [cidi, setCidi] = useState(MOCK_CIDI);
  const [activeAgent, setActiveAgent] = useState(agents[0]);
  const [activeModel, setActiveModel] = useState(models[0]);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([
    { id: "m1", role: "assistant", content: "Agent Sam online. D1 database connected. Select a mode to begin.", provider: "system", created_at: Date.now() - 60000 }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPanelView, setPreviewPanelView] = useState("preview");
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [telemetry, setTelemetry] = useState({ total_tokens: 0, total_cost: 0, cache_hit_rate: 0 });
  const [cliHistory, setCliHistory] = useState([]);
  const [cliInput, setCliInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [workflowTab, setWorkflowTab] = useState("Ask");
  const [autoModel, setAutoModel] = useState(true);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [loadingSaying] = useState(() => LOADING_SAYINGS[Math.floor(Math.random() * LOADING_SAYINGS.length)]);
  const [editorContent, setEditorContent] = useState(`-- agent_dashboard.sql
SELECT id, name, role_name, status, mode FROM agent_ai_sam WHERE status='active';
SELECT id, session_type, status, started_at FROM agent_sessions WHERE status='active';`);
  const [dragging, setDragging] = useState(false);
  const [splitPos, setSplitPos] = useState(58);
  const dragRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const modelPickerRef = useRef(null);
  const agentPickerRef = useRef(null);
  const imageInputRef = useRef(null);
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const hasPreviewContent = previewUrl || editorContent.trim().length > 10;

  const canSend = input.trim() || attachedImages.length > 0 || attachedFiles.length > 0;

  useEffect(() => {
    if (!modelPickerOpen && !agentPickerOpen) return;
    const onDocClick = (e) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target)) setModelPickerOpen(false);
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) setAgentPickerOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { setModelPickerOpen(false); setAgentPickerOpen(false); }
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [modelPickerOpen, agentPickerOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    if (sessionFromUrl) setCurrentSessionId(sessionFromUrl);
  }, []);

  useEffect(() => {
    fetch("/api/agent/boot", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.agents?.length) {
          setAgents(data.agents);
          setActiveAgent(data.agents[0]);
        }
        if (data.models?.length) {
          setModels(data.models);
          setActiveModel(data.models[0]);
        }
        if (data.mcp_services?.length) setMcpServices(data.mcp_services);
        if (data.cidi?.length) setCidi(data.cidi);
        if (data.sessions?.length) setSessions(data.sessions);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentSessionId || messages.length > 1) return;
    fetch(`/api/agent/sessions/${currentSessionId}/messages`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const msgs = list.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content || "",
            provider: m.provider || null,
            created_at: m.created_at ? m.created_at * 1000 : Date.now(),
          }));
          setMessages(msgs);
        }
      })
      .catch(() => {});
  }, [currentSessionId]);

  useEffect(() => {
    setActiveAgent((prev) => agents.find((a) => a.id === prev?.id) || agents[0]);
    setActiveModel((prev) => models.find((m) => m.id === prev?.id) || models[0]);
  }, [agents, models]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.agentDashboardControls = {
        activeAgent,
        setActiveAgent,
        activeModel,
        setActiveModel,
        mode,
        setMode,
        telemetry,
        agents,
        models,
      };
    }
  }, [activeAgent, activeModel, mode, telemetry, agents, models]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onDragStart = useCallback(() => setDragging(true), []);
  useEffect(() => {
    if (!dragging) return;
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const container = dragRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.min(Math.max(pct, 25), 80));
    };
    const onUp = () => {
      setDragging(false);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging]);

  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .slice(-20)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  const sendMessage = async () => {
    if (!canSend) return;
    const text = input.trim() || (attachedImages.length ? "(image attached)" : "(files attached)");
    const imagesToSend = attachedImages.length ? [...attachedImages] : undefined;
    const filesToSend = attachedFiles.length ? attachedFiles.map((f) => ({ name: f.name, content: f.content })) : undefined;
    const userMsg = { id: `m${Date.now()}`, role: "user", content: text, provider: null, created_at: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedImages([]);
    setAttachedFiles([]);
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          model_id: activeModel.id,
          agent_id: activeAgent?.id,
          session_id: currentSessionId,
          messages: [...conversationMessages, { role: "user", content: text }],
          images: imagesToSend,
          attached_files: filesToSend,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessages((prev) => [...prev, { id: `m${Date.now()}`, role: "assistant", content: data.error || "Request failed", provider: "error", created_at: Date.now() }]);
        return;
      }
      const content = data.content?.[0]?.text ?? data.choices?.[0]?.message?.content ?? data.candidates?.[0]?.content?.parts?.[0]?.text ?? (typeof data.message === "string" ? data.message : "No response");
      const inputTok = data.usage?.input_tokens ?? data.usage?.prompt_tokens ?? 0;
      const outputTok = data.usage?.output_tokens ?? data.usage?.completion_tokens ?? 0;
      setTelemetry((prev) => ({
        total_tokens: prev.total_tokens + inputTok + outputTok,
        total_cost: prev.total_cost,
        cache_hit_rate: prev.cache_hit_rate,
      }));
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now()}`, role: "assistant", content, provider: activeModel?.provider ?? "system", created_at: Date.now(), tokens: inputTok + outputTok },
      ]);
      if (data.conversation_id) setCurrentSessionId(data.conversation_id);
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now()}`, role: "assistant", content: `Error: ${err.message}`, provider: "error", created_at: Date.now() },
      ]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const onImageSelect = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/")).slice(0, 3);
    if (!files.length) {
      e.target.value = "";
      return;
    }
    let done = 0;
    const next = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        next.push({ name: f.name, dataUrl: reader.result });
        done++;
        if (done === files.length) setAttachedImages((prev) => [...prev, ...next].slice(-3));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.size < 1024 * 512);
    if (!files.length) return;
    let done = 0;
    const next = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        next.push({ name: f.name, content: reader.result });
        done++;
        if (done === files.length) setAttachedFiles((prev) => [...prev, ...next].slice(-5));
      };
      reader.readAsText(f, "UTF-8");
    });
  };
  const onDragOverFiles = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  const runCli = (cmd) => {
    const responses = {
      help: "Commands: ls-agents | ls-models | ls-mcp | ls-tables | telemetry | boot",
      "ls-agents": agents.map((a) => `${a.id} | ${a.name} | ${a.status} | ${a.mode}`).join("\n"),
      "ls-models": models.map((m) => `${m.provider}/${m.display_name} | tools:${m.supports_tools} vision:${m.supports_vision || 0}`).join("\n"),
      "ls-mcp": mcpServices.map((m) => `${m.id} | ${m.service_name} | ${m.health_status}`).join("\n"),
      "ls-tables": "agent_ai_sam, agent_sessions, agent_messages, mcp_services, ai_models, agent_telemetry, cidi, playwright_jobs",
      telemetry: `tokens: ${telemetry.total_tokens} | cost: $${telemetry.total_cost.toFixed(6)} | cache: ${telemetry.cache_hit_rate}%`,
      boot: "Boot data loaded from /api/agent/boot.",
    };
    const out = responses[cmd.trim().toLowerCase()] || `Unknown command: ${cmd}. Type 'help' for commands.`;
    setCliHistory((prev) => [...prev, { cmd, out }]);
    setCliInput("");
  };

  const contextUsedK = Math.round((telemetry.total_tokens || 0) / 1000);
  const contextLimitK = 128;
  const contextPct = Math.min(100, (contextUsedK / contextLimitK) * 100);
  const spendDisplay = telemetry.total_cost != null ? telemetry.total_cost.toFixed(2) : "0.00";
  const spendPct = Math.min(100, (Number(telemetry.total_cost) || 0) / 100);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0c0f", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "13px", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ width: previewOpen ? `${splitPos}%` : "100%", display: "flex", flexDirection: "column", overflow: "hidden", transition: dragging ? "none" : "width 0.15s" }}>
          {/* Cursor-style icon bar: file, search, branch, extensions */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0d1117", borderBottom: "1px solid #1e2530", flexShrink: 0 }}>
            <button type="button" onClick={() => setMode("chat")} style={{ background: "transparent", border: "none", color: mode === "chat" ? "#d97706" : "#64748b", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Chat / Files">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            </button>
            <button type="button" onClick={() => setMode("chat")} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button type="button" onClick={() => setMode("cli")} style={{ background: "transparent", border: "none", color: mode === "cli" ? "#d97706" : "#64748b", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Branch / changes">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            </button>
            <button type="button" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Extensions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>
            </button>
          </div>
            {mode === "chat" && (
              <>
                {/* Workflow tabs: Ask, Agent, Plan, Debug */}
                <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "6px 12px", borderBottom: "1px solid #1e2530", background: "#161b22", flexShrink: 0 }}>
                  {WORKFLOW_TABS.map((t) => (
                    <button key={t} type="button" onClick={() => setWorkflowTab(t)} style={{ padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "11px", fontFamily: "inherit", background: workflowTab === t ? "#d97706" : "transparent", color: workflowTab === t ? "#0a0c0f" : "#64748b", fontWeight: workflowTab === t ? "600" : "400" }}>{t}</button>
                  ))}
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 0 }}>
                  {messages.length <= 1 && messages[0]?.role === "assistant" ? (
                    /* Welcome: 6 commands + company icon (Cursor-style) */
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "24px", maxWidth: "480px" }}>
                      <img src={COMPANY_ICON} alt="Inner Animal Media" style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "contain" }} />
                      <div style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>Agent Sam. D1 connected. Pick a workflow or type below.</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", width: "100%" }}>
                        {WELCOME_COMMANDS.map((c) => (
                          <button key={c.cmd} type="button" onClick={() => setInput(c.label + " ")} style={{ padding: "12px 14px", background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                            <div style={{ fontWeight: "600", marginBottom: "2px" }}>{c.label}</div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>{c.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div key={msg.id} style={{ display: "flex", gap: "10px", flexDirection: msg.role === "user" ? "row-reverse" : "row", width: "100%", maxWidth: "720px", alignSelf: "center" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.role === "user" ? "#d97706" : "#16213e", border: `1px solid ${msg.role === "user" ? "#d97706" : "#1e2530"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: msg.role === "user" ? "#0a0c0f" : "#64748b", flexShrink: 0, fontWeight: "700" }}>
                            {msg.role === "user" ? "S" : "AI"}
                          </div>
                          <div style={{ maxWidth: "70%", background: msg.role === "user" ? "#1a2030" : "#0f1923", border: `1px solid ${msg.role === "user" ? "#1e3050" : "#1e2530"}`, borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding: "10px 14px" }}>
                            <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{msg.content}</div>
                            {msg.tokens && <div style={{ marginTop: "5px", fontSize: "10px", color: "#374151" }}>{msg.tokens} tokens</div>}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%", maxWidth: "720px", alignSelf: "center" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0f1923", border: "1px solid #1e2530", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#64748b", flexShrink: 0 }}>AI</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{loadingSaying}</div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {[0, 1, 2].map((i) => (
                                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {/* Input row: left = Agent popup + Auto/model; center = textarea; right = gauges + icons (Cursor-style) */}
                <div style={{ borderTop: "1px solid #1e2530", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "flex-end", background: "#0d1117", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} ref={agentPickerRef}>
                    <button type="button" onClick={() => setAgentPickerOpen(!agentPickerOpen)} aria-expanded={agentPickerOpen} aria-haspopup="listbox" aria-label="Select agent" style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #30363d", background: "#161b22", color: "#e2e8f0", fontSize: "11px", fontFamily: "inherit", cursor: "pointer" }}>{activeAgent?.name || "Agent"}</button>
                    {agentPickerOpen && (
                      <div role="listbox" style={{ position: "absolute", bottom: "100%", left: 12, marginBottom: "4px", maxHeight: "200px", overflowY: "auto", background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", zIndex: 50, minWidth: "160px" }}>
                        {agents.map((a) => (
                          <button key={a.id} role="option" type="button" onClick={() => { setActiveAgent(a); setAgentPickerOpen(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "transparent", color: "#e2e8f0", fontSize: "12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", borderBottom: "1px solid #1e2530" }}>{a.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} ref={modelPickerRef}>
                    <button type="button" onClick={() => setAutoModel(!autoModel)} aria-label="Auto model selection" style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #30363d", background: autoModel ? "#d97706" : "#161b22", color: autoModel ? "#0a0c0f" : "#9ca3af", fontSize: "11px", fontFamily: "inherit", cursor: "pointer", fontWeight: "600" }}>Auto</button>
                    {!autoModel && (
                      <>
                        <button type="button" onClick={() => setModelPickerOpen(!modelPickerOpen)} aria-expanded={modelPickerOpen} aria-haspopup="listbox" aria-label="Select model" style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #30363d", background: "#161b22", color: "#e2e8f0", fontSize: "11px", fontFamily: "inherit", cursor: "pointer" }}>{activeModel?.display_name || "Model"}</button>
                        {modelPickerOpen && (
                          <div role="listbox" style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "4px", maxHeight: "200px", overflowY: "auto", background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", zIndex: 50, minWidth: "180px" }}>
                            {models.map((m) => (
                              <button key={m.id} role="option" type="button" onClick={() => { setActiveModel(m); setModelPickerOpen(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "transparent", color: "#e2e8f0", fontSize: "12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", borderBottom: "1px solid #1e2530" }}>{m.display_name}</button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {attachedImages.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                      {attachedImages.map((img, i) => (
                        <span key={i} style={{ fontSize: "10px", color: "#64748b", background: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>{img.name}</span>
                      ))}
                      <button type="button" onClick={() => setAttachedImages([])} aria-label="Remove attached images" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px", fontSize: "12px" }}>×</button>
                    </div>
                  )}
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                      {attachedFiles.map((f, i) => (
                        <span key={i} style={{ fontSize: "10px", color: "#94a3b8", background: "#1e2530", padding: "2px 6px", borderRadius: "4px" }} title={f.content?.slice(0, 80)}>{f.name}</span>
                      ))}
                      <button type="button" onClick={() => setAttachedFiles([])} aria-label="Remove attached files" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px", fontSize: "12px" }}>×</button>
                    </div>
                  )}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    onDrop={onDropFiles}
                    onDragOver={onDragOverFiles}
                    placeholder="Ask Agent Sam… or drop HTML/code files"
                    style={{ flex: 1, background: "#161b22", border: "1px solid #30363d", color: "#e2e8f0", padding: "10px 12px", borderRadius: "6px", fontFamily: "inherit", fontSize: "12px", resize: "none", rows: 2, minHeight: "40px", maxHeight: "120px", outline: "none", lineHeight: "1.5" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <input type="file" ref={imageInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={onImageSelect} />
                    <div style={{ position: "relative", width: "28px", height: "28px", flexShrink: 0 }} title={`Context ${contextUsedK}k / ${contextLimitK}k`} role="img" aria-label={`Context ${contextUsedK}k of ${contextLimitK}k`}>
                      <svg viewBox="0 0 36 36" style={{ width: "28px", height: "28px", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1e2530" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#d97706" strokeWidth="3" strokeDasharray={`${contextPct * 0.88} 88`} strokeLinecap="round"/>
                      </svg>
                      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#64748b", fontWeight: "600" }}>{(contextUsedK)}k</span>
                    </div>
                    <div style={{ position: "relative", width: "28px", height: "28px", flexShrink: 0 }} title={`Spend $${spendDisplay}`} role="img" aria-label={`Spend $${spendDisplay}`}>
                      <svg viewBox="0 0 36 36" style={{ width: "28px", height: "28px", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1e2530" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${Math.min(100, spendPct) * 0.88} 88`} strokeLinecap="round"/>
                      </svg>
                      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#64748b", fontWeight: "600" }}>$</span>
                    </div>
                    <button type="button" aria-label="Add image to message" onClick={() => imageInputRef.current?.click()} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    </button>
                    <button type="button" onClick={() => { setPreviewOpen(true); setPreviewUrl(""); }} aria-label="Open preview or browser" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </button>
                    <button type="button" onClick={isLoading ? stopGeneration : sendMessage} disabled={!isLoading && !canSend} aria-label={isLoading ? "Stop generation" : "Send message"} style={{ background: isLoading ? "#374151" : "#d97706", border: "none", color: "#0a0c0f", padding: "8px", borderRadius: "6px", cursor: isLoading ? "pointer" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: !isLoading && !canSend ? 0.5 : 1 }}>
                      {isLoading ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === "ide" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e2530", display: "flex", gap: "8px", alignItems: "center", background: "#0d1117" }}>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>EDITOR</span>
                  <span style={{ fontSize: "10px", color: "#374151" }}>agent_dashboard.sql</span>
                  <div style={{ flex: 1 }} />
                  <button style={{ background: "#d97706", border: "none", color: "#0a0c0f", padding: "3px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit", fontWeight: "700" }}>RUN QUERY</button>
                </div>
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  style={{ flex: 1, background: "#0a0c0f", color: "#e2e8f0", fontFamily: "inherit", fontSize: "12px", border: "none", padding: "16px", resize: "none", outline: "none", lineHeight: "1.7", tabSize: 2 }}
                />
                <div style={{ borderTop: "1px solid #1e2530", padding: "6px 12px", background: "#0d1117", fontSize: "10px", color: "#374151", display: "flex", gap: "16px" }}>
                  <span>D1: inneranimalmedia-business</span>
                  <span style={{ color: "#22c55e" }}>Connection: OK</span>
                </div>
              </div>
            )}

            {mode === "cli" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#050709" }}>
                <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e2530", fontSize: "10px", color: "#64748b", background: "#0d1117", letterSpacing: "0.1em" }}>
                  AGENT SAM CLI - inneranimalmedia-business
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: "12px 16px", fontFamily: "inherit" }}>
                  <div style={{ color: "#22c55e", marginBottom: "8px", fontSize: "11px" }}>Agent Sam CLI v1.0 - type 'help' for commands</div>
                  {cliHistory.map((h, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                      <div style={{ color: "#d97706" }}>$ {h.cmd}</div>
                      <div style={{ color: "#94a3b8", whiteSpace: "pre-wrap", marginLeft: "2px" }}>{h.out}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #1e2530", padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center", background: "#0d1117" }}>
                  <span style={{ color: "#d97706" }}>$</span>
                  <input
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") runCli(cliInput); }}
                    placeholder="help | ls-agents | ls-models | ls-mcp | ls-tables | boot"
                    style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontFamily: "inherit", fontSize: "12px", outline: "none" }}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {mode === "cidi" && (
              <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                <div style={{ marginBottom: "12px", fontSize: "10px", color: "#64748b", letterSpacing: "0.1em" }}>CIDI WORKFLOWS - CI/CD & IMPLEMENTATION</div>
                {cidi.map((c) => (
                  <div key={c.workflow_id || c.id} style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: "6px", padding: "12px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: "#e2e8f0", marginBottom: "2px" }}>{c.workflow_name || c.name}</div>
                        <div style={{ fontSize: "10px", color: "#4b5563" }}>{c.workflow_id || c.id} | {c.client_name || ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ fontSize: "9px", background: `${STATUS_COLORS[c.implementation_status] || "#6b7280"}20`, color: STATUS_COLORS[c.implementation_status] || "#6b7280", padding: "2px 7px", borderRadius: "3px", letterSpacing: "0.06em" }}>{(c.implementation_status || "pending").toUpperCase()}</span>
                        <span style={{ fontSize: "9px", background: "#161b22", color: "#9ca3af", padding: "2px 7px", borderRadius: "3px" }}>{c.workflow_type || ""}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit" }}>VIEW LOG</button>
                      <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit" }}>RUN</button>
                      <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit" }}>EDIT</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === "preview" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e2530", display: "flex", gap: "8px", alignItems: "center", background: "#0d1117" }}>
                  <input
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    style={{ flex: 1, background: "#161b22", border: "1px solid #30363d", color: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontFamily: "inherit", fontSize: "11px", outline: "none" }}
                  />
                  <button style={{ background: "#d97706", border: "none", color: "#0a0c0f", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit", fontWeight: "700" }}>LOAD</button>
                  <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit" }}>SCREENSHOT</button>
                </div>
                <iframe src={previewUrl} style={{ flex: 1, border: "none", background: "#fff" }} title="preview" />
              </div>
            )}
          </div>

          {previewOpen && mode !== "preview" && (
            <div
              ref={dragRef}
              onMouseDown={onDragStart}
              style={{
                width: "12px",
                minWidth: "12px",
                background: dragging ? "#d97706" : "transparent",
                cursor: "col-resize",
                flexShrink: 0,
                transition: "background 0.15s",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                userSelect: dragging ? "none" : "auto",
                padding: "0 4px",
              }}
              title="Drag to resize"
            >
              <div style={{ width: "2px", minHeight: "100%", background: dragging ? "#f59e0b" : "#1e2530", borderRadius: "1px", flexShrink: 0 }} />
            </div>
          )}

          {previewOpen && mode !== "preview" && (
            <div style={{ width: `${100 - splitPos}%`, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid #1e2530" }}>
              <div style={{ padding: "6px 10px", borderBottom: "1px solid #1e2530", display: "flex", gap: "8px", alignItems: "center", background: "#0d1117", height: "36px", flexShrink: 0 }}>
                <span style={{ fontSize: "9px", color: "#64748b", letterSpacing: "0.1em" }}>PREVIEW</span>
                {hasPreviewContent && (
                  <>
                    <button type="button" onClick={() => setPreviewPanelView("preview")} aria-label="Preview rendered" style={{ background: previewPanelView === "preview" ? "#1e2530" : "transparent", border: "none", color: previewPanelView === "preview" ? "#e2e8f0" : "#64748b", cursor: "pointer", padding: "4px 6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Preview">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button type="button" onClick={() => setPreviewPanelView("code")} aria-label="View code" style={{ background: previewPanelView === "code" ? "#1e2530" : "transparent", border: "none", color: previewPanelView === "code" ? "#e2e8f0" : "#64748b", cursor: "pointer", padding: "4px 6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Code">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </button>
                  </>
                )}
                <input
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="URL or leave empty"
                  style={{ flex: 1, minWidth: 0, background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "4px 8px", borderRadius: "4px", fontFamily: "inherit", fontSize: "10px", outline: "none" }}
                />
                <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview" style={{ background: "transparent", border: "none", color: "#374151", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "2px 4px" }}>×</button>
              </div>
              <div style={{ flex: 1, overflow: "auto", background: "#0a0c0f", display: "flex", flexDirection: "column" }}>
                {!hasPreviewContent ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "12px", padding: "24px", textAlign: "center" }}>
                    Preview, code, or browse when you need it. Load a URL above or run a build to see output here.
                  </div>
                ) : previewPanelView === "code" ? (
                  <pre style={{ margin: 0, padding: "12px 16px", background: "#0a0c0f", color: "#94a3b8", fontSize: "11px", lineHeight: "1.6", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1 }}>{editorContent}</pre>
                ) : previewUrl ? (
                  <iframe src={previewUrl} style={{ flex: 1, border: "none", background: "#fff", minHeight: "200px" }} title="preview-panel" />
                ) : (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "12px", padding: "24px", textAlign: "center" }}>
                    Enter a URL above to view, or switch to Code to see the editor content.
                  </div>
                )}
              </div>
            </div>
          )}

          {!previewOpen && mode !== "preview" && (
            <button
              onClick={() => setPreviewOpen(true)}
              style={{ position: "absolute", right: "12px", top: "12px", background: "#161b22", border: "1px solid #30363d", color: "#9ca3af", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit", letterSpacing: "0.05em" }}
            >
              + PREVIEW
            </button>
          )}
        </div>
      </div>
  );
}
