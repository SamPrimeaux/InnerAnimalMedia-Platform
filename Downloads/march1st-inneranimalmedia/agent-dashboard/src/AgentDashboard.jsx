import { useState, useEffect, useRef, useCallback } from "react";
import FloatingPreviewPanel from "./FloatingPreviewPanel";
import AnimatedStatusText from "./AnimatedStatusText";
import ExecutionPlanCard from "./ExecutionPlanCard";
import QueueIndicator from "./QueueIndicator";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const WELCOME_COMMANDS = [
  {
    label: "Daily Briefing",
    subtitle: "Where things stand today",
    prompt:
      "Pull my roadmap_steps where plan_id='plan_iam_dashboard_v1' and status IN ('in_progress','not_started') ordered by order_index. Summarize what's in progress and recommend the single highest-value task to focus on right now.",
  },
  {
    label: "Recipes",
    subtitle: "Pre-built prompt chains",
    prompt:
      "List all rows from agent_recipe_prompts. Show name, description, category. Suggest the most relevant one for active development today.",
  },
  {
    label: "Commands",
    subtitle: "77 saved commands",
    prompt:
      "List all rows from agent_commands grouped by category. Show name and description. Highlight any I haven't run recently.",
  },
  {
    label: "Memory",
    subtitle: "What Agent Sam knows",
    prompt:
      "Query agent_memory_index and show all current memory entries. Identify any gaps or outdated information.",
  },
  {
    label: "Workspaces",
    subtitle: "21 active workspaces",
    prompt:
      "List all rows from the workspaces table. Group by status if column exists. Flag any client workspaces needing attention.",
  },
  {
    label: "Tools",
    subtitle: "30 agent tools available",
    prompt:
      "List all rows from agent_tools. Show name and description. Highlight tools I haven't used that could accelerate current build work.",
  },
];

const LOADING_SAYINGS = [
  "Checking the D1 connection...",
  "Asking the models nicely...",
  "Counting tokens so you don't have to...",
  "Warming up the hamster wheel...",
  "Polishing the response...",
  "Almost there...",
  "Consulting the rubber duck...",
  "Running it through the filter...",
];

const COMPANY_ICON =
  "https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/ac515729-af6b-4ea5-8b10-e581a4d02100/thumbnail";

const MODEL_LABELS = {
  "claude-haiku-4-5-20251001": "Haiku 4.5",
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-6": "Opus 4.6",
  "gemini-2.5-flash": "Gemini 2.5",
  "gpt-4o": "GPT-4o",
};

const AGENT_STATES = {
  IDLE: "IDLE",
  THINKING: "THINKING",
  PLANNING: "PLANNING",
  EXECUTING: "EXECUTING",
  TOOL_CALL: "TOOL_CALL",
  CODE_GEN: "CODE_GEN",
  WAITING_APPROVAL: "WAITING_APPROVAL",
  QUEUED: "QUEUED",
};

const STATE_CONFIG = {
  IDLE: { label: "", messages: [], color: "transparent" },
  THINKING: {
    label: "[THINK]",
    messages: ["Analyzing request...", "Processing context...", "Formulating approach..."],
    color: "var(--mode-color)",
  },
  PLANNING: {
    label: "[PLAN]",
    messages: ["Creating execution plan...", "Breaking down steps...", "Estimating complexity..."],
    color: "var(--mode-plan)",
  },
  EXECUTING: {
    label: "[EXEC]",
    messages: ["Running step {current} of {total}...", "Executing action...", "Applying changes..."],
    color: "var(--mode-agent)",
  },
  TOOL_CALL: {
    label: "[TOOL]",
    messages: ["Calling {tool}...", "Fetching data...", "Processing result..."],
    color: "var(--state-tool)",
  },
  CODE_GEN: {
    label: "[CODE]",
    messages: ["Generating code...", "Writing {file}...", "Building solution..."],
    color: "var(--state-code)",
  },
  WAITING_APPROVAL: {
    label: "[WAIT]",
    messages: ["Awaiting your approval...", "Plan ready for review..."],
    color: "var(--mode-plan)",
  },
  QUEUED: {
    label: "[QUEUE]",
    messages: ["Request queued (position {position})...", "Waiting for current task..."],
    color: "var(--state-queued)",
  },
};

export default function AgentDashboard() {
  // ── Core chat state ───────────────────────────────────────────────────────
  const [messages, setMessages] = useState([
    {
      id: "m1",
      role: "assistant",
      content: "Hi, I'm agent_sam. Ask me anything — pick a model above to control cost.",
      provider: "system",
      created_at: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionName, setSessionName] = useState("New Conversation");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const sessionNameInputRef = useRef(null);
  const [loadingSaying] = useState(
    () => LOADING_SAYINGS[Math.floor(Math.random() * LOADING_SAYINGS.length)]
  );

  // ── Agent / model pickers ─────────────────────────────────────────────────
  const [agents, setAgents] = useState([]);
  const [models, setModels] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const agentPickerRef = useRef(null);
  const modelPickerRef = useRef(null);

  // ── Attachments ───────────────────────────────────────────────────────────
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const canUseVision = activeModel?.supports_vision === 1;

  // ── Connector popup (+ button) ────────────────────────────────────────────
  const [connectorPopupOpen, setConnectorPopupOpen] = useState(false);
  const connectorPopupRef = useRef(null);

  // ── Knowledge search (RAG) panel ─────────────────────────────────────────
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState("");
  const [knowledgeSearchResults, setKnowledgeSearchResults] = useState([]);
  const [knowledgeSearchLoading, setKnowledgeSearchLoading] = useState(false);
  const knowledgeSearchRef = useRef(null);

  const [mode, setMode] = useState("ask");
  const [modePopupOpen, setModePopupOpen] = useState(false);
  const modePopupRef = useRef(null);

  const [modelPopupOpen, setModelPopupOpen] = useState(false);
  const modelPopupRef = useRef(null);

  // ── Cost / token gauge ────────────────────────────────────────────────────
  const [telemetry, setTelemetry] = useState({ total_tokens: 0, total_cost: 0 });
  const [costPopoverOpen, setCostPopoverOpen] = useState(false);
  const costPopoverRef = useRef(null);

  const [inputBarContextPct, setInputBarContextPct] = useState(0);

  // ── Agent state (SSE type=state) ───────────────────────────────────────────
  const [agentState, setAgentState] = useState(AGENT_STATES.IDLE);
  const [agentStateContext, setAgentStateContext] = useState({});

  // ── Execution plan for approval (Step 10) ───────────────────────────────────
  const [executionPlan, setExecutionPlan] = useState(null);

  // ── Queue status (Step 11) ─────────────────────────────────────────────────
  const [queueStatus, setQueueStatus] = useState(null);
  const [queueDismissed, setQueueDismissed] = useState(false);

  // ── Monaco diff from chat (Option B: Open in Monaco) ───────────────────────
  const [monacoDiffFromChat, setMonacoDiffFromChat] = useState(null);

  // ── Speech recognition (talk-to-type) ─────────────────────────────────────
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // ── Recording ─────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);

  // ── Panel / split resize ──────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal");
  const [panelWidthPct, setPanelWidthPct] = useState(() => {
    try {
      const v = localStorage.getItem("iam_panel_width");
      if (v != null) {
        const n = Number(v);
        if (n >= 20 && n <= 80) return n;
      }
    } catch (_) {}
    return 50;
  });
  const panelResizeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [splitPos, setSplitPos] = useState(58);
  const dragRef = useRef(null);

  // ── Mobile ────────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  // ── File context (for agent) ──────────────────────────────────────────────
  const [codeContent, setCodeContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [browserUrl, setBrowserUrl] = useState("");
  const [connectedIntegrations, setConnectedIntegrations] = useState({});
  const [proposedFileChange, setProposedFileChange] = useState(null);

  // ── Integrations status ───────────────────────────────────────────────────
  const [integrationsStatus, setIntegrationsStatus] = useState({});

  const [recentFiles, setRecentFiles] = useState([]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);
  const runCommandRunnerRef = useRef(null);

  // ── Persist panel width ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("iam_panel_width", String(panelWidthPct));
    } catch (_) {}
  }, [panelWidthPct]);

  // ── Mobile resize listener ────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── URL params ────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSession = params.get("session");
    if (urlSession) setCurrentSessionId(urlSession);
  }, []);

  // ── Boot data ─────────────────────────────────────────────────────────────
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
          const defaultId = data.default_model_id;
          const defaultModel = defaultId
            ? data.models.find((m) => m.id === defaultId || m.model_key === defaultId)
            : null;
          setActiveModel(defaultModel ?? data.models[0]);
        }
        if (data.integrations) setConnectedIntegrations(data.integrations);
        if (data.integrations_status) setIntegrationsStatus(data.integrations_status);
      })
      .catch(() => {});
  }, []);

  // ── Knowledge search (RAG) debounced fetch ─────────────────────────────────
  useEffect(() => {
    if (!knowledgeSearchOpen || knowledgeSearchQuery.trim().length < 3) {
      setKnowledgeSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setKnowledgeSearchLoading(true);
      fetch("/api/agent/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ query: knowledgeSearchQuery.trim() }),
      })
        .then((r) => r.json())
        .then((d) => {
          const matches = (d && d.matches) ? d.matches : [];
          setKnowledgeSearchResults(Array.isArray(matches) ? matches : []);
        })
        .catch(() => setKnowledgeSearchResults([]))
        .finally(() => setKnowledgeSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [knowledgeSearchOpen, knowledgeSearchQuery]);

  // ── Load session messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSessionId) return;
    const welcomeMsg = {
      id: "m1",
      role: "assistant",
      content: "Hi, I'm agent_sam. Ask me anything — pick a model above to control cost.",
      provider: "system",
      created_at: Date.now(),
    };
    setMessages([welcomeMsg]);
    fetch(`/api/agent/sessions/${currentSessionId}/messages`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.messages ?? [];
        if (list.length > 0) {
          setMessages(
            list.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content || "",
              provider: m.provider || null,
              created_at: m.created_at ? m.created_at * 1000 : Date.now(),
            }))
          );
        }
      })
      .catch(() => {});
  }, [currentSessionId]);

  // Fetch session name when currentSessionId is set (for header display and edit)
  useEffect(() => {
    if (!currentSessionId) {
      setSessionName("New Conversation");
      return;
    }
    fetch(`/api/agent/sessions/${currentSessionId}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) setSessionName(data.name);
      })
      .catch(() => setSessionName("New Conversation"));
  }, [currentSessionId]);

  // ── Queue status poll (Step 11) ───────────────────────────────────────────
  useEffect(() => {
    if (!currentSessionId) return;
    const fetchQueue = () => {
      fetch(`/api/agent/queue/status?session_id=${encodeURIComponent(currentSessionId)}`, { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) return;
          setQueueStatus({ current: d.current ?? null, queue_count: d.queue_count ?? 0, queue: d.queue ?? [] });
          if ((d.queue_count ?? 0) === 0) setQueueDismissed(false);
        })
        .catch(() => {});
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, [currentSessionId]);

  const saveSessionName = useCallback(() => {
    if (!currentSessionId || !editNameValue.trim()) {
      setIsEditingName(false);
      return;
    }
    const name = editNameValue.trim().slice(0, 200);
    fetch(`/api/agent/sessions/${currentSessionId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setSessionName(name);
      })
      .catch(() => {})
      .finally(() => {
        setIsEditingName(false);
        setEditNameValue("");
      });
  }, [currentSessionId, editNameValue]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Close pickers on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!connectorPopupOpen && !costPopoverOpen && !modelPickerOpen && !agentPickerOpen && !modePopupOpen && !modelPopupOpen && !knowledgeSearchOpen) return;
    const onDocClick = (e) => {
      if (connectorPopupRef.current && !connectorPopupRef.current.contains(e.target))
        setConnectorPopupOpen(false);
      if (knowledgeSearchRef.current && !knowledgeSearchRef.current.contains(e.target))
        setKnowledgeSearchOpen(false);
      if (costPopoverRef.current && !costPopoverRef.current.contains(e.target))
        setCostPopoverOpen(false);
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target))
        setModelPickerOpen(false);
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target))
        setAgentPickerOpen(false);
      if (modePopupRef.current && !modePopupRef.current.contains(e.target))
        setModePopupOpen(false);
      if (modelPopupRef.current && !modelPopupRef.current.contains(e.target))
        setModelPopupOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [connectorPopupOpen, costPopoverOpen, modelPickerOpen, agentPickerOpen, modePopupOpen, modelPopupOpen, knowledgeSearchOpen]);

  // ── Split-pane drag (mouse + touch) ──────────────────────────────────────
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
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging]);

  // ── Floating panel resize (mouse) ─────────────────────────────────────────
  const handlePanelResize = useCallback(
    (e) => {
      e.preventDefault();
      if (e.button !== 0) return;
      const startX = e.clientX;
      const startPct = panelWidthPct;
      const onMove = (e2) => {
        e2.preventDefault();
        const w = window.innerWidth;
        const deltaPct = ((startX - e2.clientX) / w) * 100;
        setPanelWidthPct(Math.max(25, Math.min(75, startPct + deltaPct)));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelWidthPct]
  );

  // ── Floating panel resize (touch) ─────────────────────────────────────────
  const handlePanelResizeTouch = useCallback(
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startPct = panelWidthPct;
      const onMove = (e2) => {
        e2.preventDefault();
        const t = e2.touches[0];
        const deltaPct = ((startX - t.clientX) / window.innerWidth) * 100;
        setPanelWidthPct(Math.max(25, Math.min(75, startPct + deltaPct)));
      };
      const onUp = () => {
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      };
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [panelWidthPct]
  );

  // ── quickStart helper ─────────────────────────────────────────────────────
  const quickStart = useCallback((text) => {
    setInput(text);
    setTimeout(() => {
      document.querySelector(".agent-input-bar-wrap textarea")?.focus();
    }, 50);
  }, []);

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => setInput((prev) => prev + e.results[0][0].transcript);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const canSend = input.trim() || attachedImages.length > 0 || attachedFiles.length > 0;

  const sendMessage = async () => {
    if (!canSend) return;
    const text =
      input.trim() ||
      (attachedImages.length ? "(image attached)" : "(files attached)");
    const imagesToSend = attachedImages.length ? [...attachedImages] : undefined;
    const filesToSend = attachedFiles.length
      ? attachedFiles.map((f) => ({ name: f.name, content: f.content }))
      : undefined;
    const userMsg = {
      id: `m${Date.now()}`,
      role: "user",
      content: text,
      provider: null,
      created_at: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedImages([]);
    setAttachedFiles([]);
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .slice(-20)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    setAgentState(AGENT_STATES.THINKING);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          model_id: activeModel?.id,
          agent_id: activeAgent?.id,
          session_id: currentSessionId,
          messages: [...conversationMessages, { role: "user", content: text }],
          images: imagesToSend,
          attached_files: filesToSend,
          stream: true,
        }),
      });

      const contentType = response.headers.get("Content-Type") || "";
      const isStream = contentType.includes("text/event-stream") && response.ok;

      if (isStream && response.body) {
        const assistantId = `m${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            provider: activeModel?.provider ?? "system",
            created_at: Date.now(),
          },
        ]);
        let buffer = "";
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let fullContent = "";
        let inputTok = 0;
        let outputTok = 0;
        let costUsd = 0;
        let convId = currentSessionId;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") continue;
              try {
                const data = JSON.parse(raw);
                if (data.type === "state" && data.state != null) {
                  setAgentState(data.state);
                  if (data.tool != null || data.file != null || data.current != null || data.total != null || data.position != null) {
                    setAgentStateContext({
                      tool: data.tool,
                      file: data.file,
                      current: data.current,
                      total: data.total,
                      position: data.position,
                    });
                  }
                  if (data.state === "WAITING_APPROVAL" && data.plan_id != null) {
                    setExecutionPlan({
                      plan_id: data.plan_id,
                      summary: data.summary ?? "",
                      steps: Array.isArray(data.steps) ? data.steps : [],
                    });
                  }
                } else if (data.type === "code" && data.code != null) {
                  const codeStr = typeof data.code === "string" ? data.code : JSON.stringify(data.code, null, 2);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            generatedCode: codeStr,
                            filename: data.filename ?? "snippet",
                            language: data.language ?? "text",
                          }
                        : m
                    )
                  );
                } else if (data.type === "text" && data.text) {
                  fullContent += data.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: fullContent } : m
                    )
                  );
                } else if (data.type === "done") {
                  inputTok = data.input_tokens ?? 0;
                  outputTok = data.output_tokens ?? 0;
                  costUsd = data.cost_usd ?? 0;
                  if (data.conversation_id) convId = data.conversation_id;
                } else if (data.type === "error") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: (m.content || "") + "\n\nError: " + (data.error || "Unknown") }
                        : m
                    )
                  );
                }
              } catch (_) { /* ignore parse errors */ }
            }
          }
        } finally {
          reader.releaseLock();
        }
        setTelemetry((prev) => ({
          total_tokens: prev.total_tokens + inputTok + outputTok,
          total_cost: prev.total_cost + (costUsd || 0),
        }));
        const totalTokens = (telemetry.total_tokens || 0) + inputTok + outputTok;
        setInputBarContextPct(Math.min(100, Math.round((totalTokens / 200000) * 100)));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, tokens: inputTok + outputTok }
              : m
          )
        );
        if (convId && convId !== currentSessionId) {
          setCurrentSessionId(convId);
          setSessionName("New Conversation");
          window.history.replaceState(null, "", `?session=${convId}`);
        }
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m${Date.now()}`,
            role: "assistant",
            content: data.error || "Request failed",
            provider: "error",
            created_at: Date.now(),
          },
        ]);
        return;
      }
      const content =
        (typeof data.content === "string" ? data.content : null) ??
        data.content?.[0]?.text ??
        data.choices?.[0]?.message?.content ??
        (typeof data.message === "string" ? data.message : "No response");
      const inputTok = data.usage?.input_tokens ?? data.usage?.prompt_tokens ?? 0;
      const outputTok = data.usage?.output_tokens ?? data.usage?.completion_tokens ?? 0;
      setTelemetry((prev) => ({
        total_tokens: prev.total_tokens + inputTok + outputTok,
        total_cost: prev.total_cost,
      }));
      const totalTokens = (telemetry.total_tokens || 0) + inputTok + outputTok;
      setInputBarContextPct(Math.min(100, Math.round((totalTokens / 200000) * 100)));
      setMessages((prev) => [
        ...prev,
        {
          id: `m${Date.now()}`,
          role: "assistant",
          content,
          provider: activeModel?.provider ?? "system",
          created_at: Date.now(),
          tokens: inputTok + outputTok,
        },
      ]);
      if (data.conversation_id) {
        setCurrentSessionId(data.conversation_id);
        setSessionName("New Conversation");
        window.history.replaceState(null, "", `?session=${data.conversation_id}`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        {
          id: `m${Date.now()}`,
          role: "assistant",
          content: `Error: ${err.message}`,
          provider: "error",
          created_at: Date.now(),
        },
      ]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setAgentState(AGENT_STATES.IDLE);
      setAgentStateContext({});
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handlePlanApprove = useCallback(
    async (planId) => {
      try {
        const r = await fetch("/api/agent/plan/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ plan_id: planId }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.status === "approved") {
          setExecutionPlan(null);
          setAgentState(AGENT_STATES.EXECUTING);
        }
      } catch (_) {}
    },
    []
  );

  const handlePlanReject = useCallback(
    async (planId) => {
      try {
        await fetch("/api/agent/plan/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ plan_id: planId }),
        });
        setExecutionPlan(null);
        setAgentState(AGENT_STATES.IDLE);
      } catch (_) {}
    },
    []
  );

  const openInMonaco = useCallback(
    async (message) => {
      const filename = message.filename ?? "snippet";
      const language = message.language ?? "text";
      const generatedCode = message.generatedCode ?? "";
      let originalContent = "";
      try {
        const r = await fetch(
          `/api/r2/buckets/agent-sam/object/${encodeURIComponent(filename)}`,
          { credentials: "same-origin" }
        );
        if (r.ok) originalContent = await r.text();
      } catch (_) {}
      setMonacoDiffFromChat({
        original: originalContent,
        modified: generatedCode,
        filename,
        language,
      });
      setPreviewOpen(true);
      setActiveTab("code");
    },
    []
  );

  // ── File attach ───────────────────────────────────────────────────────────
  const onImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 3);
    if (!files.length) { e.target.value = ""; return; }
    let done = 0;
    const next = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        next.push({ name: f.name, dataUrl: reader.result });
        done++;
        if (done === files.length)
          setAttachedImages((prev) => [...prev, ...next].slice(-3));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const onFileSelect = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.size < 512 * 1024);
    if (!files.length) { e.target.value = ""; return; }
    let done = 0;
    const next = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        next.push({ name: f.name, content: reader.result });
        done++;
        if (done === files.length)
          setAttachedFiles((prev) => [...prev, ...next].slice(-5));
      };
      reader.readAsText(f, "UTF-8");
    });
    e.target.value = "";
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []).filter(
      (f) => f.size < 512 * 1024
    );
    if (!files.length) return;
    let done = 0;
    const next = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        next.push({ name: f.name, content: reader.result });
        done++;
        if (done === files.length)
          setAttachedFiles((prev) => [...prev, ...next].slice(-5));
      };
      reader.readAsText(f, "UTF-8");
    });
  };
  const onDragOverFiles = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // ── Gauges ────────────────────────────────────────────────────────────────
  const contextUsedK = Math.round((telemetry.total_tokens || 0) / 1000);
  const contextLimitK = 128;
  const contextPct = Math.min(100, (contextUsedK / contextLimitK) * 100);
  const spendDisplay =
    telemetry.total_cost != null ? Number(telemetry.total_cost).toFixed(2) : "0.00";
  const spendPct = Math.min(100, (Number(telemetry.total_cost) || 0) / 100);

  // ── Provider bubble color ─────────────────────────────────────────────────
  const providerBorderColor = (provider) => {
    if (!provider || provider === "system") return "var(--color-border)";
    if (provider === "anthropic") return "#D97757";
    if (provider === "openai") return "#10a37f";
    if (provider === "google") return "#4285F4";
    if (provider === "cloudflare_workers_ai") return "#00E5CC";
    if (provider === "error") return "var(--color-danger, #ef4444)";
    return "var(--color-border)";
  };

  // ── Active theme slug for Monaco ──────────────────────────────────────────
  const activeThemeSlug =
    typeof window !== "undefined"
      ? document.documentElement.getAttribute("data-theme") ||
        localStorage.getItem("dashboard-theme") ||
        ""
      : "";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const queueCurrent = queueStatus?.current ?? null;
  const queueCount = queueStatus?.queue_count ?? 0;
  const showQueueIndicator = !queueDismissed && (queueCurrent || queueCount > 0);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-elevated)",
        color: "var(--color-text)",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "13px",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        border: "none",
      }}
    >
      {showQueueIndicator && (
        <QueueIndicator
          current={queueCurrent}
          queueCount={queueCount}
          onClear={() => setQueueDismissed(true)}
        />
      )}
      <div
        style={{
          display: "flex",
          flex: "1 1 0%",
          overflow: "hidden",
          minHeight: 0,
          flexDirection: "row",
        }}
      >
        {/* ── Chat pane ──────────────────────────────────────────────────── */}
        <div
          className="iam-chat-pane"
          style={{
            flex: previewOpen ? `0 0 ${100 - panelWidthPct}%` : "1 1 0%",
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: dragging ? "none" : "flex 0.15s",
            background: "var(--bg-elevated)",
            margin: 0,
            padding: 0,
            border: "none",
          }}
        >
          {/* Icon bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px 0 12px",
              background: "var(--bg-canvas)",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              title="New file"
              onClick={() => {
                if (previewOpen && activeTab === "files") {
                  setPreviewOpen(false);
                } else {
                  setActiveTab("files");
                  setPreviewOpen(true);
                }
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            </button>
            <button
              type="button"
              title="Search"
              onClick={() => {
                if (previewOpen && activeTab === "files") {
                  setPreviewOpen(false);
                } else {
                  setActiveTab("files");
                  setPreviewOpen(true);
                }
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button
              type="button"
              title="Source control"
              onClick={() => {
                if (previewOpen && activeTab === "files") {
                  setPreviewOpen(false);
                } else {
                  setActiveTab("files");
                  setPreviewOpen(true);
                }
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            </button>
            <button
              type="button"
              title="Terminal"
              onClick={() => {
                if (previewOpen && activeTab === "terminal") {
                  setPreviewOpen(false);
                } else {
                  setActiveTab("terminal");
                  setPreviewOpen(true);
                }
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            </button>
            <button
              type="button"
              title="Browser"
              onClick={() => {
                if (previewOpen && activeTab === "browser") {
                  setPreviewOpen(false);
                } else {
                  setPreviewOpen(true);
                  setActiveTab("browser");
                }
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingLeft: "8px" }}>
              {isEditingName ? (
                <input
                  ref={sessionNameInputRef}
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveSessionName();
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                      setEditNameValue("");
                    }
                  }}
                  onBlur={saveSessionName}
                  placeholder="Chat name"
                  style={{
                    width: "100%",
                    maxWidth: "220px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    color: "var(--color-text)",
                    outline: "none",
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditNameValue(sessionName);
                    setIsEditingName(true);
                    setTimeout(() => sessionNameInputRef.current?.focus(), 0);
                  }}
                  title="Click to rename"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}
                >
                  {sessionName}
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0 16px 16px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: 0,
              minWidth: 0,
              scrollBehavior: "smooth",
            }}
          >
            {messages.length <= 1 && messages[0]?.role === "assistant" ? (
              /* Welcome cards */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  gap: "24px",
                  maxWidth: "480px",
                  width: "100%",
                }}
              >
                <img
                  src={COMPANY_ICON}
                  alt="Inner Animal Media"
                  style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "contain", opacity: 0.85 }}
                />
                <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
                  level AI
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                    width: "100%",
                  }}
                >
                  {WELCOME_COMMANDS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => quickStart(c.prompt)}
                      style={{
                        padding: "14px 16px",
                        background: "var(--bg-canvas)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px",
                        color: "var(--color-text)",
                        fontSize: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "3px", color: "var(--color-text)" }}>{c.label}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      width: "100%",
                      maxWidth: "720px",
                      alignSelf: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: msg.role === "user" ? "var(--color-primary)" : "var(--bg-canvas)",
                        border: `1px solid ${providerBorderColor(msg.provider)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        color: msg.role === "user" ? "var(--bg-canvas)" : "var(--text-muted)",
                        flexShrink: 0,
                        fontWeight: "700",
                      }}
                    >
                      {msg.role === "user" ? "S" : "AI"}
                    </div>
                    <div
                      style={{
                        maxWidth: "72%",
                        background: msg.role === "user" ? "var(--bg-canvas)" : "var(--bg-elevated)",
                        border: `1px solid ${providerBorderColor(msg.provider)}`,
                        borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text)",
                          lineHeight: "1.65",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.generatedCode && (
                        <div
                          className="message-code-block"
                          style={{
                            background: "var(--bg-canvas)",
                            borderRadius: 8,
                            padding: 16,
                            marginTop: 12,
                            maxWidth: "100%",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                              fontSize: 12,
                              color: "var(--text-muted)",
                            }}
                          >
                            <span>{msg.filename ?? "snippet"}</span>
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "var(--mode-code)",
                                borderRadius: 4,
                                color: "var(--color-on-mode)",
                              }}
                            >
                              {msg.language ?? "text"}
                            </span>
                          </div>
                          <pre
                            style={{
                              fontSize: 13,
                              fontFamily: "monospace",
                              overflow: "auto",
                              maxHeight: 300,
                              background: "var(--bg-elevated)",
                              padding: 12,
                              borderRadius: 6,
                              margin: 0,
                              color: "var(--color-text)",
                            }}
                          >
                            <code>
                              {msg.generatedCode.split("\n").slice(0, 15).join("\n")}
                              {msg.generatedCode.split("\n").length > 15 && (
                                <div
                                  style={{
                                    color: "var(--text-muted)",
                                    fontStyle: "italic",
                                    marginTop: 8,
                                  }}
                                >
                                  ... {msg.generatedCode.split("\n").length - 15} more lines
                                </div>
                              )}
                            </code>
                          </pre>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 8,
                            }}
                          >
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {msg.generatedCode.split("\n").length} lines total
                            </span>
                            <button
                              type="button"
                              onClick={() => openInMonaco(msg)}
                              style={{
                                padding: "8px 16px",
                                background: "var(--mode-code)",
                                color: "var(--color-on-mode)",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 500,
                              }}
                            >
                              Open in Monaco -&gt;
                            </button>
                          </div>
                        </div>
                      )}
                      {(msg.tokens != null && msg.tokens !== 0) && (
                        <div style={{ marginTop: "5px", fontSize: "10px", color: "var(--text-muted)" }}>
                          {msg.tokens} tokens
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      width: "100%",
                      maxWidth: "720px",
                      alignSelf: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "var(--bg-canvas)",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      AI
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{loadingSaying}</div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "var(--color-primary)",
                              animation: `agentPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Execution plan card (Step 10) ───────────────────────────────── */}
          {agentState === AGENT_STATES.WAITING_APPROVAL && executionPlan && (
            <div style={{ flexShrink: 0, padding: "0 16px 12px" }}>
              <ExecutionPlanCard
                plan_id={executionPlan.plan_id}
                summary={executionPlan.summary}
                steps={executionPlan.steps}
                onApprove={handlePlanApprove}
                onReject={handlePlanReject}
              />
            </div>
          )}

          {/* ── Agent status + input bar (--mode-color scope for status) ───── */}
          <div style={{ "--mode-color": `var(--mode-${mode})`, flexShrink: 0 }}>
            {/* Agent status (above input bar) */}
            <div
              style={{
                padding: "6px 12px 0",
                minHeight: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <AnimatedStatusText
                state={agentState}
                config={STATE_CONFIG[agentState]}
                context={agentStateContext}
              />
            </div>

            {/* ── Input bar ──────────────────────────────────────────────── */}
            <div
              className="agent-input-bar-wrap"
              style={{
                flexShrink: 0,
                background: "var(--bg-nav)",
                borderTop: "1px solid var(--color-border)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                gap: 0,
              }}
            >
            {/* Left: icons with 8px gap, 12px margin after */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px", flexShrink: 0, position: "relative" }}
              ref={connectorPopupRef}
            >
              {/* + button */}
              <button
                type="button"
                onClick={() => setConnectorPopupOpen(!connectorPopupOpen)}
                aria-expanded={connectorPopupOpen}
                aria-haspopup="true"
                title="Attach"
                style={{
                  minWidth: "32px",
                  height: "32px",
                  padding: 0,
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>

              {/* Mic (talk-to-type) */}
              <button
                type="button"
                title="Voice input"
                aria-label="Voice input"
                onClick={toggleMic}
                style={{
                  minWidth: "32px",
                  height: "32px",
                  padding: 0,
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: isListening ? "var(--color-primary)" : "var(--color-text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="2" width="6" height="12" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>
                </svg>
              </button>

              {/* Token gauge (session usage popover) */}
              <div style={{ position: "relative", flexShrink: 0 }} ref={costPopoverRef}>
                <button
                  type="button"
                  onClick={() => setCostPopoverOpen((o) => !o)}
                  title={`Context ${contextUsedK}k / ${contextLimitK}k — Spend $${spendDisplay}`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <svg viewBox="0 0 36 36" style={{ width: "28px", height: "28px", transform: "rotate(-90deg)" }}>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-border)" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray={`${contextPct * 0.88} 88`} strokeLinecap="round"/>
                  </svg>
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "var(--text-muted)", fontWeight: "600" }}>
                    {contextUsedK}k
                  </span>
                </button>
                {costPopoverOpen && (
                  <div
                    role="dialog"
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      marginBottom: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      minWidth: "200px",
                      zIndex: 9999,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "600" }}>Session Usage</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text)", marginBottom: "4px" }}>
                      Context: {contextUsedK}k / {contextLimitK}k tokens
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
                      Spend: ${spendDisplay}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile backdrop for connector popup */}
              {isMobile && connectorPopupOpen && (
                <div
                  onClick={() => setConnectorPopupOpen(false)}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10000 }}
                  aria-hidden="true"
                />
              )}

              {/* Connector popup */}
              {connectorPopupOpen && (
                <div
                  role="menu"
                  style={
                    isMobile
                      ? {
                          position: "fixed",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          borderRadius: "16px 16px 0 0",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--color-border)",
                          zIndex: 10001,
                          maxHeight: "75vh",
                          overflowY: "auto",
                          padding: "0 0 16px 0",
                          boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                        }
                      : {
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          marginBottom: "4px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "10px",
                          minWidth: "220px",
                          maxWidth: "320px",
                          maxHeight: "85vh",
                          overflowY: "auto",
                          padding: "8px 0",
                          zIndex: 9999,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        }
                  }
                >
                  {isMobile && (
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "10px auto 12px" }} />
                  )}
                  {[
                    { label: "Upload File", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, action: () => { fileInputRef.current?.click(); setConnectorPopupOpen(false); } },
                    { label: "Upload Image", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>, action: () => { imageInputRef.current?.click(); setConnectorPopupOpen(false); } },
                    { label: "Google Drive", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 19h20L12 2z"/></svg>, action: () => setConnectorPopupOpen(false) },
                    { label: "GitHub", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>, action: () => setConnectorPopupOpen(false) },
                    { label: "Cloudflare", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, action: () => { setInput("@cloudflare list my workers and D1 databases"); setTimeout(() => textareaRef.current?.focus(), 50); setConnectorPopupOpen(false); } },
                    { label: "Take Screenshot", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, action: () => { setPreviewOpen(true); setActiveTab("browser"); setConnectorPopupOpen(false); } },
                    { label: "Search knowledge base", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, action: () => { setConnectorPopupOpen(false); setKnowledgeSearchOpen(true); setKnowledgeSearchQuery(""); setKnowledgeSearchResults([]); } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={item.action}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "none",
                        color: "var(--color-text)",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-canvas)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                      <span style={{ color: "var(--text-muted)", display: "flex" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {knowledgeSearchOpen && (
                <div
                  ref={knowledgeSearchRef}
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: "100%",
                    marginBottom: "8px",
                    width: "320px",
                    maxWidth: "90vw",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    padding: "12px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "360px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>Search knowledge base</span>
                    <button type="button" onClick={() => setKnowledgeSearchOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", fontSize: "14px" }} aria-label="Close">x</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Type to search (min 3 chars)..."
                    value={knowledgeSearchQuery}
                    onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      background: "var(--bg-canvas)",
                      color: "var(--color-text)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <div style={{ flex: 1, overflowY: "auto", minHeight: "80px" }}>
                    {knowledgeSearchLoading && <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px" }}>Searching...</div>}
                    {!knowledgeSearchLoading && knowledgeSearchQuery.trim().length >= 3 && knowledgeSearchResults.length === 0 && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px" }}>No matches</div>
                    )}
                    {!knowledgeSearchLoading && knowledgeSearchResults.slice(0, 10).map((text, i) => {
                      const snippet = (typeof text === "string" ? text : "").slice(0, 150);
                      const full = typeof text === "string" ? text : "";
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setInput("Context from knowledge base:\n\n" + full + "\n\nBased on this, ");
                            setKnowledgeSearchOpen(false);
                            setKnowledgeSearchQuery("");
                            setKnowledgeSearchResults([]);
                            setTimeout(() => textareaRef.current?.focus(), 50);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 12px",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid var(--color-border)",
                            background: "none",
                            color: "var(--color-text)",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            lineHeight: 1.4,
                          }}
                        >
                          {(snippet + (full.length > 150 ? "..." : "")).replace(/\n/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Divider after left icons */}
            <div style={{ width: 1, height: 24, background: "var(--color-border)", marginRight: 12, flexShrink: 0 }} aria-hidden />

            {/* Center: input area (flex 1) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: 0 }}>
              {attachedImages.length > 0 && (
                <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                  {attachedImages.map((img, i) => (
                    <span key={i} style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-canvas)", padding: "2px 6px", borderRadius: "4px" }}>{img.name}</span>
                  ))}
                  <button type="button" onClick={() => setAttachedImages([])} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", padding: "2px" }}>x</button>
                </div>
              )}
              {attachedFiles.length > 0 && (
                <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                  {attachedFiles.map((f, i) => (
                    <span key={i} style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-canvas)", padding: "2px 6px", borderRadius: "4px" }}>{f.name}</span>
                  ))}
                  <button type="button" onClick={() => setAttachedFiles([])} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", padding: "2px" }}>x</button>
                </div>
              )}
              <div
                className="iam-chat-input-main"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  overflow: "visible",
                }}
              >
                <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                    }}
                    onDrop={onDropFiles}
                    onDragOver={onDragOverFiles}
                    placeholder={messages.length > 1 ? "Reply..." : "How can I help?"}
                    style={{
                      flex: 1,
                      minHeight: "44px",
                      maxHeight: "160px",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--color-text)",
                      padding: "10px 12px",
                      fontFamily: "inherit",
                      fontSize: "16px",
                      resize: "none",
                      lineHeight: "1.5",
                      overflowY: "auto",
                    }}
                  />
                </div>
              </div>

              {/* Hidden file inputs */}
              <input type="file" ref={fileInputRef} multiple style={{ display: "none" }} onChange={onFileSelect} />
              <input type="file" ref={imageInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={onImageSelect} />
            </div>

            {/* Divider before right controls */}
            <div style={{ width: 1, height: 24, background: "var(--color-border)", marginLeft: 12, marginRight: 12, flexShrink: 0 }} aria-hidden />

            {/* Right: mode, model, context gauge, send — 8px gap */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <div style={{ position: "relative", flexShrink: 0 }} ref={modePopupRef}>
                    <button
                      type="button"
                      onClick={() => setModePopupOpen((o) => !o)}
                      aria-haspopup="true"
                      aria-expanded={modePopupOpen}
                      title="Chat mode"
                      className="agent-mode-selector"
                      style={{
                        padding: "4px 8px 4px 20px",
                        fontSize: "11px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        background: "var(--bg-canvas)",
                        color: "var(--color-text)",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        position: "relative",
                      }}
                    >
                      <span
                        className="agent-mode-indicator"
                        style={{
                          position: "absolute",
                          left: "6px",
                          top: "50%",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--mode-color)",
                          animation: "modePulse 2s ease-in-out infinite",
                        }}
                        aria-hidden
                      />
                      {mode}
                    </button>
                    {modePopupOpen && (
                      <div
                        role="menu"
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          marginBottom: "4px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "4px 0",
                          minWidth: "100px",
                          zIndex: 9999,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                      >
                        {["ask", "plan", "debug", "agent"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="menuitem"
                            onClick={() => { setMode(m); setModePopupOpen(false); }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              width: "100%",
                              padding: "6px 10px",
                              textAlign: "left",
                              border: "none",
                              background: mode === m ? "var(--bg-canvas)" : "transparent",
                              color: "var(--color-text)",
                              fontSize: "12px",
                              cursor: "pointer",
                              textTransform: "capitalize",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: `var(--mode-${m})`,
                                flexShrink: 0,
                              }}
                              aria-hidden
                            />
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ position: "relative", flexShrink: 0 }} ref={modelPopupRef}>
                    <button
                      type="button"
                      onClick={() => setModelPopupOpen((o) => !o)}
                      aria-haspopup="true"
                      aria-expanded={modelPopupOpen}
                      title="Model"
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--color-text)",
                        cursor: "pointer",
                      }}
                    >
                      {MODEL_LABELS[activeModel?.model_key] ?? activeModel?.display_name ?? "Auto"}
                    </button>
                    {modelPopupOpen && (
                      <div
                        role="menu"
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          marginBottom: "4px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "4px 0",
                          minWidth: "120px",
                          zIndex: 9999,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setActiveModel(models[0] ?? null); setModelPopupOpen(false); }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "6px 10px",
                            textAlign: "left",
                            border: "none",
                            background: !activeModel || models[0]?.id === activeModel?.id ? "var(--bg-canvas)" : "transparent",
                            color: "var(--color-text)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Auto
                        </button>
                        {(models.length ? models : []).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            role="menuitem"
                            onClick={() => { setActiveModel(m); setModelPopupOpen(false); }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "6px 10px",
                              textAlign: "left",
                              border: "none",
                              background: activeModel?.id === m.id ? "var(--bg-canvas)" : "transparent",
                              color: "var(--color-text)",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            {MODEL_LABELS[m.model_key] ?? m.display_name ?? m.model_key}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Context gauge (same design: minimal circle with %) */}
                  <div title={`${inputBarContextPct}% context used`} style={{ flexShrink: 0 }}>
                    {(() => {
                      const radius = 10;
                      const circ = 2 * Math.PI * radius;
                      const filled = circ * (inputBarContextPct / 100);
                      return (
                        <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
                          <circle cx="14" cy="14" r={radius} fill="none"
                            stroke="rgba(255,255,255,0.1)" strokeWidth="2.5"/>
                          <circle cx="14" cy="14" r={radius} fill="none"
                            stroke={inputBarContextPct > 80 ? "var(--color-danger)" : "var(--color-primary)"}
                            strokeWidth="2.5"
                            strokeDasharray={`${filled} ${circ}`}
                            strokeLinecap="round"
                            transform="rotate(-90 14 14)"/>
                          <text x="14" y="18" textAnchor="middle"
                            fontSize="7" fill="var(--color-text)" fontWeight="600">
                            {inputBarContextPct}%
                          </text>
                        </svg>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={isLoading ? stopGeneration : sendMessage}
                    disabled={!isLoading && !canSend}
                    aria-label={isLoading ? "Stop" : "Send"}
                    style={{
                      background: isLoading ? "var(--bg-canvas)" : "var(--mode-color)",
                      border: "none",
                      color: "var(--color-text)",
                      padding: "7px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: !isLoading && !canSend ? 0.45 : 1,
                    }}
                  >
                    {isLoading ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
            </div>
          </div>
          </div>

          {/* Status bar */}
          <div
            className="agent-status-bar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "4px 8px",
              padding: "3px 12px",
              background: "var(--bg-canvas)",
              borderTop: "1px solid var(--color-border)",
              fontSize: "11px",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <span>Agent Sam</span>
            <span>{activeModel?.display_name ?? "Claude Haiku 4.5"} · level AI</span>
          </div>

          {recentFiles.length > 0 && (
            <div style={{ flexShrink: 0 }} aria-hidden="true" />
          )}
        </div>

        {/* ── Panel resize divider ────────────────────────────────────────── */}
        {previewOpen && (
          <div
            ref={dragRef}
            onMouseDown={handlePanelResize}
            onTouchStart={handlePanelResizeTouch}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = dragging ? "var(--color-primary)" : "transparent"; }}
            className="iam-panel-resize"
            style={{
              width: "2px",
              minWidth: "2px",
              background: dragging ? "var(--color-primary)" : "transparent",
              cursor: "col-resize",
              flexShrink: 0,
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              userSelect: dragging ? "none" : "auto",
              padding: 0,
              transition: "background 0.15s",
            }}
            title="Drag to resize"
          >
            <div
              style={{
                width: "2px",
                minHeight: "100%",
                background: dragging ? "var(--color-primary)" : "var(--color-border)",
                borderRadius: "1px",
                flexShrink: 0,
              }}
            />
          </div>
        )}

        {/* ── Floating preview panel ──────────────────────────────────────── */}
        {previewOpen && (
          <FloatingPreviewPanel
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            previewHtml={previewHtml}
            onPreviewHtmlChange={setPreviewHtml}
            browserUrl={browserUrl}
            onBrowserUrlChange={setBrowserUrl}
            codeContent={codeContent}
            onCodeContentChange={setCodeContent}
            isDarkTheme={true}
            activeThemeSlug={activeThemeSlug}
            proposedFileChange={proposedFileChange}
            onProposedChangeResolved={() => setProposedFileChange(null)}
            monacoDiffFromChat={monacoDiffFromChat}
            onMonacoDiffResolved={() => setMonacoDiffFromChat(null)}
            connectedIntegrations={connectedIntegrations}
            runCommandRunnerRef={runCommandRunnerRef}
          />
        )}
      </div>

      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
