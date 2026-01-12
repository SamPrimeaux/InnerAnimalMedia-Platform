-- Execution Agent Workflow Pattern
-- Structured workflow template for multi-tool pipeline execution
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-execution-agent-workflow.sql --remote

-- ============================================
-- EXECUTION AGENT WORKFLOW TEMPLATE
-- ============================================

INSERT OR REPLACE INTO dev_workflows (
  id, tenant_id, name, description, category, steps_json, command_sequence,
  estimated_time_minutes, is_template, tags, created_at, updated_at
) VALUES (
  'workflow-execution-agent',
  '',
  'Execution Agent Workflow Pattern',
  'Structured workflow template for multi-tool pipeline execution with standardized sections: GOAL, CONTEXT, INPUTS, OUTPUTS, PLAN, DELIVERABLES, NEXT HANDOFF',
  'execution',
  json_array(
    json_object(
      'step', 1,
      'section', 'GOAL',
      'description', 'Define 1 sentence goal',
      'required', 1,
      'template', 'You are an execution agent in a multi-tool pipeline.\n\nAlways respond with EXACTLY these sections:\n\n1) GOAL (1 sentence)\n2) CONTEXT (bullets; include assumptions)\n3) INPUTS REQUIRED (bullets; if missing, proceed with best defaults)\n4) OUTPUTS (explicit files/objects to produce)\n5) PLAN (5–12 steps max)\n6) DELIVERABLES\n   - Spec (requirements + acceptance criteria)\n   - Implementation (code or structured steps)\n   - Tests/QA checklist\n   - Rollback plan (if relevant)\n7) NEXT HANDOFF (what the next agent/tool should do, with exact copy/paste commands if possible)'
    ),
    json_object(
      'step', 2,
      'section', 'CONTEXT',
      'description', 'Provide context bullets with assumptions',
      'required', 1,
      'template', '- Never repeat analysis already in CONTEXT\n- If ambiguity exists, choose a reasonable default and state it\n- Optimize for minimal rework and modular deliverables'
    ),
    json_object(
      'step', 3,
      'section', 'INPUTS REQUIRED',
      'description', 'List required inputs with defaults',
      'required', 0,
      'template', 'If missing, proceed with best defaults'
    ),
    json_object(
      'step', 4,
      'section', 'OUTPUTS',
      'description', 'Define explicit files/objects to produce',
      'required', 1,
      'template', 'Explicit files/objects to produce'
    ),
    json_object(
      'step', 5,
      'section', 'PLAN',
      'description', 'Create 5-12 step plan',
      'required', 1,
      'template', '5–12 steps max'
    ),
    json_object(
      'step', 6,
      'section', 'DELIVERABLES',
      'description', 'Define deliverables with sub-sections',
      'required', 1,
      'template', '- Spec (requirements + acceptance criteria)\n- Implementation (code or structured steps)\n- Tests/QA checklist\n- Rollback plan (if relevant)'
    ),
    json_object(
      'step', 7,
      'section', 'NEXT HANDOFF',
      'description', 'Define next agent/tool actions with exact commands',
      'required', 1,
      'template', 'What the next agent/tool should do, with exact copy/paste commands if possible'
    )
  ),
  'Follow execution agent pattern: GOAL → CONTEXT → INPUTS → OUTPUTS → PLAN → DELIVERABLES → NEXT HANDOFF',
  5,
  1,
  'execution,agent,pattern,structured,workflow',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- EXECUTION AGENT COMMAND TEMPLATE
-- ============================================

INSERT OR REPLACE INTO command_templates (
  id, tenant_id, template_name, tool, template_text, variables, description, category,
  example_values, created_at, updated_at
) VALUES (
  'template-execution-agent',
  '',
  'Execution Agent Response Template',
  'agent',
  '1) GOAL (1 sentence)
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
- Optimize for minimal rework and modular deliverables.',
  json_array('goal', 'context', 'inputs', 'outputs', 'plan', 'deliverables', 'next_handoff'),
  'Structured response template for execution agents in multi-tool pipelines',
  'execution',
  json_object(
    'goal', 'Build a command search UI component',
    'context', json_array('Using React', 'Tailwind CSS available', 'Commands API endpoint exists'),
    'inputs', json_array('API endpoint URL', 'Command categories'),
    'outputs', json_array('search-ui.jsx', 'search-ui.css', 'README.md'),
    'plan', json_array('1. Create component structure', '2. Add search input', '3. Implement filters', '4. Connect to API', '5. Add styling'),
    'deliverables', json_object(
      'spec', 'Searchable command library with category filters',
      'implementation', 'React component with Tailwind styling',
      'tests', 'Unit tests for search/filter logic',
      'rollback', 'Revert component if API fails'
    ),
    'next_handoff', 'Deploy component to Pages: wrangler pages deploy . --project-name=meauxos-unified-dashboard'
  ),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- EXECUTION AGENT WORKFLOW USAGE COMMAND
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES (
  'cmd-execution-agent-workflow',
  '',
  'workflow',
  'Execute Agent Workflow Pattern',
  'Use workflow: workflow-execution-agent',
  'Structured execution agent workflow for multi-tool pipelines',
  'execution',
  'agent',
  'When building multi-step workflows that require structured planning and handoffs',
  'Follow the 7-section pattern: GOAL → CONTEXT → INPUTS → OUTPUTS → PLAN → DELIVERABLES → NEXT HANDOFF',
  json_object('workflow_id', 'workflow-execution-agent'),
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
