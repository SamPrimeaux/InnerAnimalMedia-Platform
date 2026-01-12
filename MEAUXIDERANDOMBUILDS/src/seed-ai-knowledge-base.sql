-- Seed: AI Knowledge Base Initial Data
-- Populates knowledge base with initial documentation, workflows, and best practices
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-ai-knowledge-base.sql --remote

-- Insert initial knowledge base entries (best practices, workflows, documentation)
INSERT OR REPLACE INTO ai_knowledge_base (id, tenant_id, title, content, content_type, category, metadata_json, chunk_count, token_count, is_indexed, is_active, created_at, updated_at) VALUES
('kb-workflow-contract-v1', 'system', 'Workflow Contract v1 - Foundation', 'Workflow Contract v1 defines the standard structure for all AI agent tasks:

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
- Optimize for minimal rework and modular deliverables.', 'document', 'workflow', '{"tags":["foundation","workflow","standard"],"version":"1.0","priority":"high"}', 1, 250, 1, 1, 1704859200, 1704859200),

('kb-3-stage-pipeline', 'system', '3-Company Parallel Operating System', 'The 3-company parallel operating system runs the same 6-stage pipeline across each company:

Stage 0 – Intake (15 minutes)
Goal, audience, constraints, deadline, assets available

Stage 1 – Spec (60 minutes)
One-page PRD + acceptance criteria

Stage 2 – Design (90 minutes)
UI spec + component list + tokens

Stage 3 – Build (240 minutes)
Implement one page/feature at a time (no mega builds)

Stage 4 – QA (60 minutes)
Checklist + perf + accessibility

Stage 5 – Ship (30 minutes)
Deploy + log learnings + update prompt library

Each stage has deliverables, acceptance criteria, and handoff instructions. Build prompts for each stage so agents always behave predictably.', 'workflow', 'workflow', '{"tags":["pipeline","6-stage","process"],"version":"1.0","priority":"high"}', 1, 300, 1, 1, 1704859200, 1704859200),

('kb-tool-role-assignment', 'system', 'Tool Role Assignment Rules', 'Assign roles so tools don''t duplicate each other:

ChatGPT = product strategy, system design, workflow SOPs, prompt library, quality gates, architecture (Preferred Stages: 0, 1, 4)

Claude = longform writing, policies, brand voice, lessons, docs, refined copy (Preferred Stages: 1, 2, 5)

Cursor / Antigravity = coding + refactors + tests + repo structure + PR-ready changes (Preferred Stage: 3)

Gemini = Google ecosystem (Docs/Drive/GCP ideas), quick comparisons, alt viewpoints (Preferred Stages: 0, 1)

Cloudflare = runtime/deploy/data (Workers, D1, R2, Queues) (Preferred Stages: 3, 5)

CloudConvert = deterministic file conversions (Preferred Stages: 2, 3)

Meshy / Spline = fast 3D generation + web embeds (Preferred Stage: 2)

Blender = final 3D polish + exports (GLB), but treat it as "finishing", not ideation (Preferred Stages: 4, 5)

Rule: Only one "brain" owns the plan per task. Everyone else executes.', 'document', 'best_practices', '{"tags":["tools","roles","assignment"],"version":"1.0","priority":"high"}', 1, 400, 1, 1, 1704859200, 1704859200),

('kb-3d-workflow', 'system', '3D Workflow Best Practice (Meshy/Spline → Blender)', 'Blender is powerful but it''s a finishing tool. Don''t "learn Blender first" — treat it like this:

Best practice 3D pipeline:
1. Generate/iterate fast in Meshy (or any gen-3D tool)
2. Stage scenes and interactions in Spline for web feel
3. Finish/cleanup in Blender:
   - scale + pivot
   - decimate (reduce polygons)
   - fix normals
   - bake textures if needed
   - export GLB (web-friendly)

Blender finishing instructions should include:
- Exact Blender steps (menu paths)
- Recommended settings (units, scale, transforms)
- Optimization steps (decimate, remove hidden geo)
- Export settings for GLB
- QA checks (file size, shading, lighting, pivots)', 'workflow', 'design', '{"tags":["3d","blender","meshy","spline","pipeline"],"version":"1.0","priority":"medium"}', 1, 350, 1, 1, 1704859200, 1704859200),

('kb-autorag-pattern', 'system', 'AutoRAG Pattern for Knowledge Retrieval', 'AutoRAG (Automatic Retrieval-Augmented Generation) pattern:

1. User query comes in (from prompt execution or workflow)
2. Generate embedding for query using same model as knowledge base
3. Vector similarity search across ai_knowledge_chunks
4. Retrieve top K chunks (default: 5-10) based on cosine similarity
5. Combine retrieved chunks with original prompt
6. Send enriched prompt to AI tool (ChatGPT, Claude, etc.)
7. Log retrieval results in ai_rag_search_history for learning
8. Collect feedback on usefulness to improve retrieval

Key considerations:
- Use same embedding model for query and chunks (text-embedding-3-small recommended)
- Chunk size: 500-1000 tokens optimal
- Overlap between chunks: 50-100 tokens for context continuity
- Store embeddings as JSON arrays in D1 (or use external vector DB for scale)
- Cache frequently accessed chunks
- Re-index when knowledge base updates', 'document', 'best_practices', '{"tags":["rag","retrieval","vector","embeddings"],"version":"1.0","priority":"high"}', 1, 450, 1, 1, 1704859200, 1704859200),

('kb-cloudflare-workers-best-practices', 'system', 'Cloudflare Workers Best Practices', 'Cloudflare Workers deployment and data management:

1. Always use D1 for SQL-backed data (not KV for complex queries)
2. Use R2 for static assets and large files
3. Use Durable Objects for real-time coordination (WebRTC, sessions)
4. Use Hyperdrive for external database connections (PostgreSQL)
5. Use Analytics Engine for event tracking
6. Bind resources in wrangler.toml for easy access
7. Handle CORS explicitly in API responses
8. Use environment variables for sensitive config
9. Deploy with --env production flag for production
10. Monitor errors in Cloudflare dashboard

Database migrations:
- Run migrations with: wrangler d1 execute <db> --file=<file> --remote
- Always test locally first: remove --remote flag
- Use transactions for multi-step operations
- Index frequently queried columns
- Use soft deletes (is_active flag) for recoverability', 'document', 'deployment', '{"tags":["cloudflare","workers","d1","r2","deployment"],"version":"1.0","priority":"high"}', 1, 500, 1, 1, 1704859200, 1704859200);

-- Insert initial workflow pipeline templates
INSERT OR REPLACE INTO ai_workflow_pipelines (id, tenant_id, name, description, category, trigger_event, stages_json, variables_json, knowledge_base_ids_json, success_criteria, is_template, status, created_at, updated_at) VALUES
('pipeline-project-intake-to-ship', 'system', 'Project Intake to Ship Pipeline', 'Complete 6-stage pipeline from intake to deployment', 'development', 'manual', '[{"stage_number":0,"stage_name":"Intake","prompt_id":"prompt-project-intake-spec","tool_role":"chatgpt","expected_duration_minutes":15,"dependencies":[]},{"stage_number":1,"stage_name":"Spec","prompt_id":"prompt-project-intake-spec","tool_role":"chatgpt","expected_duration_minutes":60,"dependencies":[0]},{"stage_number":2,"stage_name":"Design","prompt_id":"prompt-ui-spec","tool_role":"claude","expected_duration_minutes":90,"dependencies":[1]},{"stage_number":3,"stage_name":"Build","prompt_id":"prompt-task-breakdown","tool_role":"cursor","expected_duration_minutes":240,"dependencies":[2]},{"stage_number":4,"stage_name":"QA","prompt_id":"prompt-qa-gate","tool_role":"chatgpt","expected_duration_minutes":60,"dependencies":[3]},{"stage_number":5,"stage_name":"Ship","prompt_id":null,"tool_role":"cloudflare","expected_duration_minutes":30,"dependencies":[4]}]', '{"default_variables":{"project_name":"","company":"","goal":"","audience":"","deadline":"","constraints":"","assets":"","stack":"","success_metrics":""},"required_variables":["project_name","goal"]}', '["kb-workflow-contract-v1","kb-3-stage-pipeline","kb-tool-role-assignment"]', 'Project deployed successfully with all acceptance criteria met', 1, 'draft', 1704859200, 1704859200),

('pipeline-3d-asset-creation', 'system', '3D Asset Creation Pipeline', 'Generate, iterate, and polish 3D assets for web', 'design', 'manual', '[{"stage_number":0,"stage_name":"Generate","prompt_id":null,"tool_role":"meshy","expected_duration_minutes":30,"dependencies":[]},{"stage_number":1,"stage_name":"Stage","prompt_id":null,"tool_role":"spline","expected_duration_minutes":60,"dependencies":[0]},{"stage_number":2,"stage_name":"Finish","prompt_id":"prompt-blender-finish","tool_role":"blender","expected_duration_minutes":90,"dependencies":[1]}]', '{"default_variables":{"asset_goal":"","target_platform":"web","poly_budget":"5000","texture_budget":"2MB","export_format":"GLB"},"required_variables":["asset_goal"]}', '["kb-3d-workflow"]', 'GLB asset exported under poly budget with optimized textures', 1, 'draft', 1704859200, 1704859200);
