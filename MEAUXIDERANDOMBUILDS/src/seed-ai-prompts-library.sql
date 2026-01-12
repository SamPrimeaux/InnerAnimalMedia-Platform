-- Seed: AI Prompts Library Data
-- Populates prompt library with workflow templates and tool role definitions
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-ai-prompts-library.sql --remote

-- Insert Workflow Stages (6-stage pipeline)
INSERT OR REPLACE INTO workflow_stages (id, stage_number, stage_name, stage_description, duration_minutes, deliverables_json, acceptance_criteria, handoff_instructions, created_at, updated_at) VALUES
('stage-0', 0, 'Intake', 'Goal, audience, constraints, deadline, assets available', 15, '["goal", "audience", "constraints", "deadline", "assets", "stack"]', 'All intake questions answered', 'Hand off to Spec stage with complete intake form', 1704859200, 1704859200),
('stage-1', 1, 'Spec', 'One-page PRD + acceptance criteria', 60, '["prd", "user_stories", "acceptance_criteria", "milestones", "risks"]', 'PRD approved, acceptance criteria defined', 'Hand off to Design stage with approved spec', 1704859200, 1704859200),
('stage-2', 2, 'Design', 'UI spec + component list + tokens', 90, '["ui_spec", "component_list", "design_tokens", "states", "copy_blocks"]', 'Design approved, components defined', 'Hand off to Build stage with complete design system', 1704859200, 1704859200),
('stage-3', 3, 'Build', 'Implement one page/feature at a time (no mega builds)', 240, '["code", "tests", "documentation"]', 'Feature implemented, tests passing', 'Hand off to QA stage with PR-ready code', 1704859200, 1704859200),
('stage-4', 4, 'QA', 'Checklist + perf + accessibility', 60, '["qa_report", "perf_metrics", "a11y_report", "security_check"]', 'All QA checks passed', 'Hand off to Ship stage with QA approval', 1704859200, 1704859200),
('stage-5', 5, 'Ship', 'Deploy + log learnings + update prompt library', 30, '["deployment", "learnings_log", "prompt_updates"]', 'Deployed successfully, learnings documented', 'Complete: Update prompt library based on learnings', 1704859200, 1704859200);

-- Insert Tool Role Definitions
INSERT OR REPLACE INTO ai_tool_roles (id, tool_name, role_description, responsibilities_json, strengths_json, limitations_json, preferred_stages_json, created_at, updated_at) VALUES
('role-chatgpt', 'chatgpt', 'Product strategy, system design, workflow SOPs, prompt library, quality gates, architecture', '["product_strategy", "system_design", "workflow_sops", "prompt_library", "quality_gates", "architecture"]', '["strategic_thinking", "workflow_design", "architecture_planning", "quality_assurance"]', '["not_for_longform_writing", "not_for_detailed_coding"]', '[0,1,4]', 1704859200, 1704859200),
('role-claude', 'claude', 'Longform writing, policies, brand voice, lessons, docs, refined copy', '["longform_writing", "policy_documents", "brand_voice", "documentation", "copy_refinement"]', '["extended_context", "coherent_longform", "detailed_documentation", "brand_consistency"]', '["slower_for_quick_tasks", "not_for_coding"]', '[1,2,5]', 1704859200, 1704859200),
('role-cursor', 'cursor', 'Coding + refactors + tests + repo structure + PR-ready changes', '["coding", "refactoring", "testing", "repo_structure", "pr_preparation"]', '["code_generation", "refactoring", "test_writing", "git_workflows"]', '["not_for_strategy", "not_for_design"]', '[3]', 1704859200, 1704859200),
('role-gemini', 'gemini', 'Google ecosystem (Docs/Drive/GCP ideas), quick comparisons, alt viewpoints', '["google_ecosystem", "comparisons", "alternative_viewpoints", "gcp_ideas"]', '["google_integration", "comparative_analysis", "diverse_perspectives"]', '["limited_to_google_stack", "not_for_implementation"]', '[0,1]', 1704859200, 1704859200),
('role-cloudflare', 'cloudflare', 'Runtime/deploy/data (Workers, D1, R2, Queues)', '["deployment", "database_migrations", "storage_management", "runtime_config"]', '["cloudflare_expertise", "deployment_automation", "data_management"]', '["cloudflare_only", "not_for_other_platforms"]', '[3,5]', 1704859200, 1704859200),
('role-cloudconvert', 'cloudconvert', 'Deterministic file conversions', '["file_conversions", "format_standardization"]', '["reliable_conversions", "batch_processing"]', '["conversion_only", "no_editing"]', '[2,3]', 1704859200, 1704859200),
('role-meshy', 'meshy', 'Fast 3D generation + web embeds', '["3d_generation", "rapid_prototyping", "web_embedding"]', '["fast_iteration", "web_native", "easy_embedding"]', '["not_for_polish", "limited_fidelity"]', '[2]', 1704859200, 1704859200),
('role-spline', 'spline', 'Fast 3D generation + web embeds + scene staging', '["3d_generation", "scene_staging", "web_interactions", "rapid_prototyping"]', '["scene_composition", "interactions", "web_native"]', '["not_for_final_polish", "performance_limits"]', '[2]', 1704859200, 1704859200),
('role-blender', 'blender', 'Final 3D polish + exports (GLB), finishing tool not ideation', '["3d_polish", "polygon_optimization", "texture_baking", "glb_export"]', '["high_fidelity", "optimization", "professional_quality"]', '["not_for_ideation", "requires_expertise", "slow_iteration"]', '[4,5]', 1704859200, 1704859200);

-- Insert Master Prompts
INSERT OR REPLACE INTO ai_prompts_library (id, name, category, description, prompt_template, variables_json, tool_role, stage, company, version, is_active, created_at, updated_at) VALUES
('prompt-project-intake-spec', 'project_intake_to_spec', 'workflow', 'Master intake to spec prompt that kills chaos. Takes project intake and creates structured spec.', 'Use Workflow Contract v1.

Project: {{project_name}}
Company: {{company}}
Goal: {{goal}}
Audience: {{audience}}
Deadline: {{deadline}}
Constraints: {{constraints}}
Assets available: {{assets}}
Stack: {{stack}}
Success metrics: {{success_metrics}}

Deliver:
- One-page PRD (problem, solution, scope, non-goals)
- User stories (5–12)
- Acceptance criteria (testable)
- Milestones (max 5)
- Risks + mitigations
- "First build slice" recommendation (smallest shippable piece)', '["project_name","company","goal","audience","deadline","constraints","assets","stack","success_metrics"]', 'chatgpt', 1, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-task-breakdown', 'task_breakdown_cursor_ready', 'workflow', 'Takes spec and produces PR-sized implementation task list for Cursor/Antigravity', 'Take this spec and produce an implementation task list that is PR-sized.

Spec:
{{spec}}

Repo structure (if known):
{{repo_structure}}

Constraints:
{{constraints}}

Output:
- Epic -> stories -> tasks
- Each task includes: files touched, commands, acceptance checks
- "PR Plan": 5–12 pull requests maximum, ordered
- Identify what to stub vs fully implement', '["spec","repo_structure","constraints"]', 'cursor', 3, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-ui-spec', 'ui_spec_clay_level', 'design', 'UI spec at Clay.global / iOS polish level without overbuilding', 'Create a UI spec for {{page_name}} at Clay.global / iOS polish.

Brand tokens:
{{brand_tokens}}

Required components:
{{components}}

Inspirations:
{{inspirations}}

Accessibility level:
{{accessibility_level}}

Deliver:
- Layout map (sections + purpose)
- Component inventory (w/ props)
- Spacing + typography rules
- States (loading/empty/error/success)
- Motion rules (reduced motion fallback)
- Copy blocks (headline/subcopy/cta)
- Acceptance checklist', '["page_name","brand_tokens","components","inspirations","accessibility_level"]', 'claude', 2, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-api-contract', 'api_contract_generator', 'api', 'API contract design for Cloudflare Workers + D1 + R2', 'Design the API contract for feature: {{feature}}

Actors:
{{actors}}

Data entities:
{{data_entities}}

Auth model:
{{auth_model}}

Rate limits:
{{rate_limits}}

Deliver:
- Endpoint list (method/path)
- Request/response JSON schemas
- Status codes + error shape standard
- Auth rules per endpoint
- D1 tables involved + indexes needed
- Example curl calls
- Minimal Worker routing outline', '["feature","actors","data_entities","auth_model","rate_limits"]', 'chatgpt', 1, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-d1-schema', 'd1_schema_and_seed_builder', 'database', 'D1 schema + seed data builder prevents empty useless tables', 'Build Cloudflare D1 schema + seed data.

Domain:
{{domain}}

Entities:
{{entities}}

Need example records:
{{example_records}}

Multi-tenant:
{{multi_tenant}}

ID strategy:
{{id_strategy}}

Deliver:
1) SQL migrations (CREATE TABLE + indexes)
2) Seed SQL inserting realistic data (min 30 rows total)
3) 10 example queries for the app
4) Data integrity rules (FKs if feasible, uniqueness, soft-delete)', '["domain","entities","example_records","multi_tenant","id_strategy"]', 'chatgpt', 1, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-one-slice', 'one_slice_shipping_plan', 'workflow', 'Stops massive refactors by focusing on smallest shippable slice', 'You are a shipping coach.

Feature:
{{feature}}

Definition of done:
{{definition_of_done}}

Time budget (hours):
{{time_budget_hours}}

Dependencies:
{{dependencies}}

Deliver:
- Smallest shippable slice
- Cut list (what to delay)
- Step-by-step execution (commands included)
- QA checklist
- Deploy checklist', '["feature","definition_of_done","time_budget_hours","dependencies"]', 'chatgpt', 3, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-qa-gate', 'qa_gate_clay_ios', 'qa', 'QA gate for brand + performance + accessibility', 'Create a QA gate for {{page_or_feature}}.

Perf budget:
{{perf_budget}}

A11y requirements:
{{a11y_requirements}}

Browsers:
{{browsers}}

Deliver:
- Visual QA checklist
- Interaction QA checklist
- Accessibility checklist
- Performance checklist
- Security checklist (basic)
- "Blocker vs non-blocker" rules', '["page_or_feature","perf_budget","a11y_requirements","browsers"]', 'chatgpt', 4, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-ai-router', 'ai_router_dispatch', 'workflow', 'Decides which AI tool should handle which stage of work', 'Task:
{{task}}

Tools available:
{{tools_available}}

Deadline:
{{deadline}}

Risk level:
{{risk_level}}

Decide the optimal split of work across:
- ChatGPT
- Claude
- Cursor/Antigravity
- Gemini
- Cloudflare (Workers/D1/R2)
- CloudConvert
- Meshy/Spline/Blender

Output:
- Owner tool per stage (Plan, Write, Code, QA, Deploy)
- Handoff artifacts per stage
- What NOT to do (avoid redundancy)
- Timeboxed plan (max 6 steps)', '["task","tools_available","deadline","risk_level"]', 'chatgpt', 0, NULL, '1.0', 1, 1704859200, 1704859200),

('prompt-blender-finish', 'blender_finish_instructions', '3d', 'Blender finishing instructions for 3D assets (not ideation, finishing only)', 'I have a 3D asset that needs finishing in Blender.

Goal:
{{asset_goal}}

Target platform:
{{target_platform}} (web/ios/visionos)

Poly budget:
{{poly_budget}}

Texture budget:
{{texture_budget}}

Export format:
{{export_format}} (GLB preferred)

Give:
- Exact Blender steps (menu paths)
- Recommended settings (units, scale, transforms)
- Optimization steps (decimate, remove hidden geo)
- Export settings for {{export_format}}
- QA checks (file size, shading, lighting, pivots)', '["asset_goal","target_platform","poly_budget","texture_budget","export_format"]', 'blender', 4, NULL, '1.0', 1, 1704859200, 1704859200);

-- Insert Workflow Contract v1 (foundational prompt)
INSERT OR REPLACE INTO ai_prompts_library (id, name, category, description, prompt_template, variables_json, tool_role, stage, company, version, is_active, created_at, updated_at) VALUES
('prompt-workflow-contract-v1', 'workflow_contract_v1', 'workflow', 'Foundational workflow contract that all prompts should reference', 'Workflow Contract v1:

1) GOAL (1 sentence)
2) CONTEXT (bullets; include assumptions)
3) INPUTS REQUIRED (bullets; if missing, proceed with best defaults)
4) OUTPUTS (explicit files/objects to produce)
5) PLAN (5–12 steps max)
6) DELIVERABLES
   - Spec (requirements + acceptance criteria)
   - Implementation (code or structured steps)
   - Tests/QA checklist
   - Rollback plan (if relevant)
7) NEXT HANDOFF (what the next agent/tool should do, with exact copy/paste commands if possible)

Rules:
- Never repeat analysis already in CONTEXT.
- If ambiguity exists, choose a reasonable default and state it.
- Optimize for minimal rework and modular deliverables.', '[]', NULL, 0, NULL, '1.0', 1, 1704859200, 1704859200);
