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

const MODE_ICONS = {
  ask: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  agent: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.178 8C19.72 8.667 21 10.2 21 12s-1.28 3.333-2.822 4m-12.356 0C4.28 15.333 3 13.8 3 12s1.28-3.333 2.822-4m0 0C7.636 7.333 9.818 7 12 7s4.364.333 6.178 1m-12.356 0C7.636 8.667 9.818 9 12 9s4.364-.333 6.178-1" />
    </svg>
  ),
  plan: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7h8M8 12h8M8 17h5" />
    </svg>
  ),
  debug: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="6" width="8" height="12" rx="2" />
      <path d="M4 7h4M4 12h4M4 17h4M16 7h4M16 12h4M16 17h4" />
      <path d="M9 3v3M15 3v3" />
    </svg>
  ),
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
  const [selectedModel, setSelectedModel] = useState(null);
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
  const [showModeModal, setShowModeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

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

  // ── Source Control panel (multi bucket / multi repo) ───────────────────────
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [selectedSource, setSelectedSource] = useState("");
  const [sourceTab, setSourceTab] = useState("Recent Files");
  const [r2Buckets, setR2Buckets] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [sourceRecentFiles, setSourceRecentFiles] = useState([]);
  const [gitChanges, setGitChanges] = useState(null);
  const [gitInfo, setGitInfo] = useState(null);
  const [bucketInfo, setBucketInfo] = useState(null);
  const defaultBucketForMonacoRef = useRef(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);
  const runCommandRunnerRef = useRef(null);

  // ── Default R2 bucket for Open in Monaco (no hardcoded bucket) ─────────────
  useEffect(() => {
    if (defaultBucketForMonacoRef.current) return;
    fetch("/api/r2/buckets", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const names = data.bound_bucket_names || (data.buckets || []).map((b) => b.bucket_name || b.name);
        if (names && names.length > 0) defaultBucketForMonacoRef.current = names[0];
      })
      .catch(() => {});
  }, []);

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
          setSelectedModel({ id: "auto", display_name: "Auto" });
          setActiveModel(defaultModel ?? data.models[0]);
        }
        if (data.integrations) setConnectedIntegrations(data.integrations);
        if (data.integrations_status) setIntegrationsStatus(data.integrations_status);
      })
      .catch(() => {});
  }, []);

  // ── Multi-source search (R2 all buckets + RAG + conversations) ─────────────
  useEffect(() => {
    if (!knowledgeSearchOpen || knowledgeSearchQuery.trim().length < 2) {
      setKnowledgeSearchResults([]);
      return;
    }
    const query = knowledgeSearchQuery.trim();
    const t = setTimeout(async () => {
      setKnowledgeSearchLoading(true);
      const results = [];
      try {
        const [bucketsResp, kbResp, chatResp] = await Promise.all([
          fetch("/api/r2/buckets", { credentials: "same-origin" }),
          fetch("/api/agent/rag/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ query }),
          }),
          fetch(`/api/agent/conversations/search?q=${encodeURIComponent(query)}`, { credentials: "same-origin" }),
        ]);
        const bucketsData = await bucketsResp.json().catch(() => ({}));
        const bucketNames = (bucketsData.bound_bucket_names || (bucketsData.buckets || []).map((b) => b.bucket_name || b.name)).filter(Boolean);
        for (const bucketName of bucketNames) {
          try {
            const searchResp = await fetch(
              `/api/r2/search?bucket=${encodeURIComponent(bucketName)}&q=${encodeURIComponent(query)}`,
              { credentials: "same-origin" }
            );
            const files = await searchResp.json().catch(() => []);
            if (Array.isArray(files)) {
              files.forEach((f) =>
                results.push({
                  type: "file",
                  title: f.name || f.key,
                  path: f.path || f.key,
                  bucket: bucketName,
                  id: `${bucketName}/${f.key}`,
                })
              );
            }
          } catch (_) {}
        }
        const kbData = await kbResp.json().catch(() => ({}));
        const matches = (kbData && kbData.matches) ? kbData.matches : [];
        (Array.isArray(matches) ? matches : []).forEach((m, i) =>
          results.push({
            type: "knowledge",
            title: typeof m === "string" ? m.slice(0, 60) + (m.length > 60 ? "..." : "") : "Knowledge",
            source: typeof m === "string" ? m : "",
            id: `kb-${i}`,
          })
        );
        const chats = await chatResp.json().catch(() => []);
        (Array.isArray(chats) ? chats : []).forEach((c) =>
          results.push({
            type: "chat",
            title: c.title || "Chat",
            path: `/dashboard/agent?session=${c.id}`,
            id: c.id,
          })
        );
      } catch (_) {}
      setKnowledgeSearchResults(results);
      setKnowledgeSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [knowledgeSearchOpen, knowledgeSearchQuery]);

  // ── Load all sources (R2 buckets + GitHub repos) for Source Control ───────
  useEffect(() => {
    if (!showSourcePanel) return;
    Promise.all([
      fetch("/api/r2/buckets", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/integrations/github/repos", { credentials: "same-origin" }).then((r) => r.json()).catch(() => []),
    ]).then(([bucketsData, reposData]) => {
      const boundNames = bucketsData.bound_bucket_names;
      const bucketList = boundNames && Array.isArray(boundNames)
        ? boundNames.map((n) => ({ name: n }))
        : (bucketsData.buckets || []).map((b) => ({ name: b.bucket_name || b.name })).filter((b) => b.name);
      setR2Buckets(bucketList);
      const repos = Array.isArray(reposData) ? reposData : (reposData && reposData.repos) ? reposData.repos : [];
      setGithubRepos(repos.map((r) => ({ name: r.full_name || r.name || r.repo })).filter((r) => r.name));
      if (bucketList.length > 0 && !selectedSource) setSelectedSource(`r2:${bucketList[0].name}`);
      else if (repos.length > 0 && !selectedSource) setSelectedSource(`git:${repos[0].name}`);
      if (bucketList.length > 0 && !defaultBucketForMonacoRef.current) defaultBucketForMonacoRef.current = bucketList[0].name;
    });
  }, [showSourcePanel]);

  useEffect(() => {
    if (!selectedSource) return;
    if (selectedSource.startsWith("r2:")) {
      const bucketName = selectedSource.replace("r2:", "");
      fetch(`/api/r2/list?bucket=${encodeURIComponent(bucketName)}&prefix=&recursive=1`, { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d) => {
          const objects = (d && d.objects) ? d.objects : [];
          const sorted = objects.slice().sort((a, b) => (b.last_modified || "").localeCompare(a.last_modified || ""));
          setSourceRecentFiles(sorted.slice(0, 20).map((o) => ({ name: (o.key || "").split("/").pop(), path: o.key, updated_at: o.last_modified })));
        })
        .catch(() => setSourceRecentFiles([]));
      setBucketInfo({ object_count: 0 });
      fetch("/api/r2/buckets", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => {
          const b = (data.buckets || []).find((x) => (x.bucket_name || x.name) === bucketName);
          if (b) setBucketInfo({ object_count: b.object_count ?? 0, size: b.size_bytes ?? 0 });
        })
        .catch(() => {});
    } else if (selectedSource.startsWith("git:")) {
      setSourceRecentFiles([]);
      fetch("/api/git/status", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((s) => {
          setGitChanges(s);
          setGitInfo(s ? { branch: s.branch, last_commit: s.last_commit } : null);
        })
        .catch(() => { setGitChanges(null); setGitInfo(null); });
    }
  }, [selectedSource]);

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
      const bucket = message.bucket || defaultBucketForMonacoRef.current;
      let originalContent = "";
      if (bucket) {
        try {
          const r = await fetch(
            `/api/r2/buckets/${encodeURIComponent(bucket)}/object/${encodeURIComponent(filename)}`,
            { credentials: "same-origin" }
          );
          if (r.ok) originalContent = await r.text();
        } catch (_) {}
      }
      setMonacoDiffFromChat({
        original: originalContent,
        modified: generatedCode,
        filename,
        language,
        bucket: bucket || undefined,
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
              title="Files"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>
            </button>
            <button
              type="button"
              title="Search All"
              onClick={() => {
                setConnectorPopupOpen(false);
                setKnowledgeSearchOpen(true);
                setKnowledgeSearchQuery("");
                setKnowledgeSearchResults([]);
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button
              type="button"
              title="Source control"
              onClick={() => setShowSourcePanel((v) => !v)}
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

            {/* ── Input bar (Cursor-style: one container) ─────────────────── */}
            <div style={{ flexShrink: 0, padding: "12px 16px", background: "var(--bg-nav)", borderTop: "1px solid var(--color-border)" }}>
              <div
                className="agent-input-container"
                onDrop={onDropFiles}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  minHeight: 48,
                  width: "100%",
                  maxWidth: 900,
                  margin: "0 auto",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }} ref={connectorPopupRef}>
                  <button
                    type="button"
                    onClick={() => setConnectorPopupOpen(!connectorPopupOpen)}
                    className="add-files-btn"
                    aria-label="Attach"
                    aria-expanded={connectorPopupOpen}
                    aria-haspopup="true"
                    title="Attach"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "var(--color-text)",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </button>
                  {isMobile && connectorPopupOpen && (
                    <div
                      onClick={() => setConnectorPopupOpen(false)}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10000 }}
                      aria-hidden="true"
                    />
                  )}
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
                              marginBottom: 8,
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 10,
                              minWidth: 220,
                              maxWidth: 320,
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
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>Search (R2, knowledge, chats)</span>
                        <button type="button" onClick={() => setKnowledgeSearchOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", fontSize: "14px" }} aria-label="Close">x</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Type to search (min 2 chars)..."
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
                        {!knowledgeSearchLoading && knowledgeSearchQuery.trim().length >= 2 && knowledgeSearchResults.length === 0 && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px" }}>No matches</div>
                        )}
                        {!knowledgeSearchLoading && knowledgeSearchResults.slice(0, 15).map((result, i) => (
                          <button
                            key={result.id || i}
                            type="button"
                            onClick={() => {
                              if (result.type === "file") {
                                setInput((prev) => prev + (prev ? "\n\n" : "") + "Context: file " + (result.bucket ? result.bucket + "/" : "") + (result.path || result.title) + " from R2. ");
                              } else if (result.type === "knowledge") {
                                setInput((prev) => prev + (prev ? "\n\n" : "") + "Context from knowledge base:\n\n" + (result.source || result.title) + "\n\nBased on this, ");
                              } else if (result.type === "chat") {
                                setCurrentSessionId(result.id);
                                setSessionName(result.title || "Chat");
                              }
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
                            <div style={{ fontWeight: 500 }}>{result.title}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                              {result.type} {result.bucket && `${result.bucket}/`}{result.path || result.source || ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {attachedImages.length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                    {attachedImages.map((img, i) => (
                      <span key={i} style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-canvas)", padding: "2px 6px", borderRadius: 4 }}>{img.name}</span>
                    ))}
                    <button type="button" onClick={() => setAttachedImages([])} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: 2 }}>x</button>
                  </div>
                )}
                {attachedFiles.length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                    {attachedFiles.map((f, i) => (
                      <span key={i} style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-canvas)", padding: "2px 6px", borderRadius: 4 }}>{f.name}</span>
                    ))}
                    <button type="button" onClick={() => setAttachedFiles([])} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: 2 }}>x</button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  placeholder="How can I help?"
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
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    resize: "none",
                    outline: "none",
                    fontSize: 14,
                    lineHeight: 1.4,
                    minHeight: 28,
                    maxHeight: 120,
                    overflowY: "auto",
                    color: "var(--color-text)",
                    fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowModeModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--color-text)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: "flex", color: "var(--mode-color)" }}>
                    {MODE_ICONS[mode]}
                  </span>
                  <span style={{ textTransform: "capitalize" }}>{mode}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M5 7L1 3h8z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowModelModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--color-text)",
                    flexShrink: 0,
                  }}
                >
                  {selectedModel?.id === "auto" ? "Auto" : (selectedModel ? (MODEL_LABELS[selectedModel.model_key] ?? selectedModel.display_name) : (activeModel ? (MODEL_LABELS[activeModel.model_key] ?? activeModel.display_name) : "Auto"))}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: 6, flexShrink: 0 }}>
                    <path d="M5 7L1 3h8z" />
                  </svg>
                </button>

                <div
                  title={`Context ${contextUsedK}k / ${contextLimitK}k — Spend $${spendDisplay}`}
                  style={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    padding: "0 8px",
                    flexShrink: 0,
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 4,
                        height: 16,
                        background: contextPct > i * 20 ? "var(--mode-color)" : "var(--color-border)",
                        borderRadius: 2,
                        opacity: contextPct > i * 20 ? 1 : 0.3,
                        transition: "all 200ms ease",
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={isLoading ? stopGeneration : sendMessage}
                  disabled={!canSend && !isLoading}
                  aria-label={isLoading ? "Stop" : "Send"}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: isLoading ? "var(--color-border)" : "var(--mode-color)",
                    border: "none",
                    cursor: !canSend && !isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-on-mode)",
                    opacity: !input.trim() && !attachedImages.length && !attachedFiles.length ? 0.5 : 1,
                    flexShrink: 0,
                    transition: "all 200ms ease",
                  }}
                >
                  {isLoading ? (
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid var(--color-on-mode)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  )}
                </button>
                </div>

                <input type="file" ref={fileInputRef} multiple accept="*/*" onChange={onFileSelect} style={{ display: "none" }} />
                <input type="file" ref={imageInputRef} accept="image/*" multiple onChange={onImageSelect} style={{ display: "none" }} />
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

        {/* ── Mode selection modal ─────────────────────────────────────────── */}
        {showModeModal && (
          <>
            <div
              role="presentation"
              onClick={() => setShowModeModal(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 9998,
                backdropFilter: "blur(2px)",
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mode-modal-title"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: 24,
                minWidth: 320,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                zIndex: 9999,
              }}
            >
              <h3 id="mode-modal-title" style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600 }}>Select Mode</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["ask", "agent", "plan", "debug"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setShowModeModal(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      border: mode === m ? `2px solid var(--mode-${m})` : "1px solid var(--color-border)",
                      borderRadius: 8,
                      background: mode === m ? "var(--bg-canvas)" : "transparent",
                      cursor: "pointer",
                      fontSize: 14,
                      textAlign: "left",
                      transition: "all 150ms ease",
                      color: "var(--color-text)",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ display: "flex", color: `var(--mode-${m})` }}>{MODE_ICONS[m]}</span>
                    <span style={{ textTransform: "capitalize" }}>{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Model selection modal ─────────────────────────────────────────── */}
        {showModelModal && (
          <>
            <div
              role="presentation"
              onClick={() => setShowModelModal(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 9998,
                backdropFilter: "blur(2px)",
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="model-modal-title"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: 24,
                minWidth: 340,
                maxHeight: "60vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                zIndex: 9999,
              }}
            >
              <h3 id="model-modal-title" style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600 }}>Select Model</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel({ id: "auto", display_name: "Auto" });
                    setActiveModel(models[0] ?? null);
                    setShowModelModal(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    border: selectedModel?.id === "auto" ? "2px solid var(--mode-color)" : "1px solid var(--color-border)",
                    borderRadius: 8,
                    background: selectedModel?.id === "auto" ? "var(--bg-canvas)" : "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    textAlign: "left",
                    transition: "all 150ms ease",
                    color: "var(--color-text)",
                    fontFamily: "inherit",
                  }}
                >
                  Auto
                </button>
                {models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(m);
                      setActiveModel(m);
                      setShowModelModal(false);
                    }}
                    style={{
                      padding: "12px 16px",
                      border: selectedModel?.id === m.id ? "2px solid var(--mode-color)" : "1px solid var(--color-border)",
                      borderRadius: 8,
                      background: selectedModel?.id === m.id ? "var(--bg-canvas)" : "transparent",
                      cursor: "pointer",
                      fontSize: 14,
                      textAlign: "left",
                      transition: "all 150ms ease",
                      color: "var(--color-text)",
                      fontFamily: "inherit",
                    }}
                  >
                    {MODEL_LABELS[m.model_key] ?? m.display_name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

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

        {showSourcePanel && (
          <div
            style={{
              position: "fixed",
              top: 60,
              right: 20,
              width: 350,
              maxHeight: 500,
              background: "var(--bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              zIndex: 2000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>Source Control</span>
                <button type="button" onClick={() => setShowSourcePanel(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", opacity: 0.6, color: "var(--color-text)" }} aria-label="Close">&#215;</button>
              </div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  background: "var(--bg-canvas)",
                  fontSize: 12,
                  color: "var(--color-text)",
                }}
              >
                <optgroup label="R2 Buckets">
                  {r2Buckets.map((b) => (
                    <option key={`r2-${b.name}`} value={`r2:${b.name}`}>{b.name}</option>
                  ))}
                </optgroup>
                <optgroup label="GitHub Repos">
                  {githubRepos.map((r) => (
                    <option key={`git-${r.name}`} value={`git:${r.name}`}>{r.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
              {["Recent Files", "Changes", "Info"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSourceTab(tab)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: sourceTab === tab ? "var(--bg-canvas)" : "transparent",
                    border: "none",
                    borderBottom: sourceTab === tab ? "2px solid var(--mode-color)" : "none",
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--color-text)",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 350, overflowY: "auto", padding: 12 }}>
              {sourceTab === "Recent Files" && (
                sourceRecentFiles.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>No recent files for this source.</div>
                ) : (
                sourceRecentFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => { setPreviewOpen(true); setActiveTab("files"); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--bg-canvas)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>{file.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{file.path}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{file.updated_at ? new Date(file.updated_at).toLocaleDateString() : ""}</div>
                  </div>
                ))
                )
              )}
              {sourceTab === "Changes" && (
                <>
                  {selectedSource.startsWith("git:") && gitChanges && (
                    <>
                      {(gitChanges.modified || []).map((f, i) => (
                        <div key={i} style={{ padding: "6px 10px", fontSize: 11, marginBottom: 4, borderRadius: 4, background: "var(--bg-canvas)", color: "var(--color-text)" }}>
                          <span style={{ color: "var(--mode-plan)", marginRight: 8 }}>M</span>
                          {typeof f === "string" ? f : f.file || f.name}
                        </div>
                      ))}
                      {(gitChanges.staged || []).map((f, i) => (
                        <div key={i} style={{ padding: "6px 10px", fontSize: 11, marginBottom: 4, borderRadius: 4, background: "var(--bg-canvas)", color: "var(--color-text)" }}>
                          <span style={{ color: "var(--mode-ask)", marginRight: 8 }}>+</span>
                          {typeof f === "string" ? f : f.file || f.name}
                        </div>
                      ))}
                    </>
                  )}
                  {selectedSource.startsWith("r2:") && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Recent uploads to {selectedSource.replace("r2:", "")}</div>
                  )}
                </>
              )}
              {sourceTab === "Info" && (
                <>
                  {selectedSource.startsWith("r2:") && (
                    <div style={{ fontSize: 11, color: "var(--color-text)" }}>
                      <div style={{ marginBottom: 8 }}><strong>Bucket:</strong> {selectedSource.replace("r2:", "")}</div>
                      <div style={{ marginBottom: 8 }}><strong>Objects:</strong> {bucketInfo?.object_count ?? 0}</div>
                      <div><strong>Size:</strong> {bucketInfo?.size != null ? (bucketInfo.size / 1024).toFixed(1) + " KB" : "—"}</div>
                    </div>
                  )}
                  {selectedSource.startsWith("git:") && (
                    <div style={{ fontSize: 11, color: "var(--color-text)" }}>
                      <div style={{ marginBottom: 8 }}><strong>Repo:</strong> {selectedSource.replace("git:", "")}</div>
                      <div style={{ marginBottom: 8 }}><strong>Branch:</strong> {gitInfo?.branch ?? "—"}</div>
                      <div><strong>Last commit:</strong> {gitInfo?.last_commit ?? "—"}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
