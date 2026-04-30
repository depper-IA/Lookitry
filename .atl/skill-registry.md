# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| clone website, vibe clone, replicate landing page | clone-website | C:\Users\Matt\.agents\skills\clone-website\SKILL.md |
| frontend, UI, component, responsive, build error | web-development | C:\Users\Matt\Lookitry\.opencode\skills\web-development\SKILL.md |
| webapp testing, playwright, browser testing | webapp-testing | C:\Users\Matt\Lookitry\.opencode\skills\webapp-testing\SKILL.md |
| responsive design, mobile layout, breakpoints | adapt | C:\Users\Matt\Lookitry\.opencode\skills\adapt\SKILL.md |
| animation, transitions, micro-interactions, motion | animate | C:\Users\Matt\Lookitry\.opencode\skills\animate\SKILL.md |
| audit, accessibility, performance, quality check | audit | C:\Users\Matt\Lookitry\.opencode\skills\audit\SKILL.md |
| bolder, amplify, more visual impact | bolder | C:\Users\Matt\Lookitry\.opencode\skills\bolder\SKILL.md |
| brainstorm, creative work, feature planning | brainstorming | C:\Users\Matt\Lookitry\.opencode\skills\brainstorming\SKILL.md |
| changelog, conventional commits | changelog-generator | C:\Users\Matt\Lookitry\.opencode\skills\changelog-generator\SKILL.md |
| clarify, UX copy, error messages, microcopy | clarify | C:\Users\Matt\Lookitry\.opencode\skills\clarify\SKILL.md |
| color, colorize, more vibrant | colorize | C:\Users\Matt\Lookitry\.opencode\skills\colorize\SKILL.md |
| code review, PR review | code-review-commons | C:\Users\Matt\Lookitry\.opencode\skills\code-review-commons\SKILL.md |
| critique, evaluate, review design | critique | C:\Users\Matt\Lookitry\.opencode\skills\critique\SKILL.md |
| defuddle, extract clean markdown from web | defuddle | C:\Users\Matt\.opencode\skills\defuddle\SKILL.md |
| delight, joy, personality, polish | delight | C:\Users\Matt\Lookitry\.opencode\skills\delight\SKILL.md |
| distill, simplify, declutter, reduce | distill | C:\Users\Matt\Lookitry\.opencode\skills\distill\SKILL.md |
| emil design, UI polish, component design | emil-design-eng | C:\Users\Matt\Lookitry\.opencode\skills\emil-design-eng\SKILL.md |
| excalidraw, diagram, visualize | excalidraw-diagram | C:\Users\Matt\Lookitry\.opencode\skills\excalidraw-diagram\SKILL.md |
| find skills, how do I do X, skill for X | find-skills | C:\Users\Matt\Lookitry\.opencode\skills\find-skills\SKILL.md |
| full output, no truncation, exhaustive | full-output-enforcement | C:\Users\Matt\Lookitry\.opencode\skills\full-output-enforcement\SKILL.md |
| go testing, bubbletea, teatest | go-testing | C:\Users\Matt\.config\opencode\skills\go-testing\SKILL.md |
| gpt taste, GSAP, editorial typography | gpt-taste | C:\Users\Matt\Lookitry\.opencode\skills\gpt-taste\SKILL.md |
| high-end design, expensive look | high-end-visual-design | C:\Users\Matt\Lookitry\.opencode\skills\high-end-visual-design\SKILL.md |
| impeccable, distinctive UI, premium | impeccable | C:\Users\Matt\Lookitry\.opencode\skills\impeccable\SKILL.md |
| industrial, brutalist, military terminal | industrial-brutalist-ui | C:\Users\Matt\Lookitry\.opencode\skills\industrial-brutalist-ui\SKILL.md |
| issue creation, GitHub issue, bug report | issue-creation | C:\Users\Matt\.config\opencode\skills\issue-creation\SKILL.md |
| layout, spacing, visual hierarchy | layout | C:\Users\Matt\Lookitry\.opencode\skills\layout\SKILL.md |
| mcp, MCP server, model context protocol | mcp-builder | C:\Users\Matt\Lookitry\.opencode\skills\mcp-builder\SKILL.md |
| minimalist, clean, editorial | minimalist-ui | C:\Users\Matt\Lookitry\.opencode\skills\minimalist-ui\SKILL.md |
| multi-reviewer, parallel review, consolidate | multi-reviewer-patterns | C:\Users\Matt\Lookitry\.opencode\skills\multi-reviewer-patterns\SKILL.md |
| overdrive, 60fps, shaders, spring physics | overdrive | C:\Users\Matt\Lookitry\.opencode\skills\overdrive\SKILL.md |
| polish, finishing touches, quality pass | polish | C:\Users\Matt\Lookitry\.opencode\skills\polish\SKILL.md |
| postgres, PostgreSQL, query optimization | postgres-patterns | C:\Users\Matt\Lookitry\.opencode\skills\postgres-patterns\SKILL.md |
| quieter, calmer, less intense | quieter | C:\Users\Matt\Lookitry\.opencode\skills\quieter\SKILL.md |
| redesign, upgrade existing site | redesign-existing-projects | C:\Users\Matt\Lookitry\.opencode\skills\redesign-existing-projects\SKILL.md |
| refactor, extract function, improve maintainability | refactor | C:\Users\Matt\Lookitry\.opencode\skills\refactor\SKILL.md |
| requesting code review, verify work | requesting-code-review | C:\Users\Matt\Lookitry\.opencode\skills\requesting-code-review\SKILL.md |
| sequential thinking, step-by-step reasoning | sequentialthinking-mcp | C:\Users\Matt\Lookitry\.opencode\skills\sequentialthinking-mcp\SKILL.md |
| shape, plan UX, design brief | shape | C:\Users\Matt\Lookitry\.opencode\skills\shape\SKILL.md |
| skill creator, create new skill | skill-creator | C:\Users\Matt\.config\opencode\skills\skill-creator\SKILL.md |
| stitch design, semantic design system | stitch-design-taste | C:\Users\Matt\Lookitry\.opencode\skills\stitch-design-taste\SKILL.md |
| subagent, execute plan, independent tasks | subagent-driven-development | C:\Users\Matt\Lookitry\.opencode\skills\subagent-driven-development\SKILL.md |
| testing, unit test, integration test, TDD | testing-strategies | C:\Users\Matt\Lookitry\.opencode\skills\testing-strategies\SKILL.md |
| design taste frontend, senior UI/UX | design-taste-frontend | C:\Users\Matt\Lookitry\.opencode\skills\design-taste-frontend\SKILL.md |
| typeset, typography, font hierarchy | typeset | C:\Users\Matt\Lookitry\.opencode\skills\typeset\SKILL.md |
| ui-ux-pro, UI/UX database | ui-ux-pro-max | C:\Users\Matt\Lookitry\.opencode\skills\ui-ux-pro-max\SKILL.md |
| verification, verify completion, checklist | verification-loop | C:\Users\Matt\Lookitry\.opencode\skills\verification-loop\SKILL.md |

## Compact Rules

### web-development
- Use when implementing, integrating, debugging, building, deploying, or validating a Web frontend
- React patterns: optional chaining (?.) for API data, fallback renders for components
- Next.js App Router conventions: server components by default, 'use client' for interactivity
- Always check existing patterns before creating new code

### testing-strategies
- Unit tests: test smallest units in isolation
- Integration: test component interactions with mocked dependencies
- E2E: test full flows with Playwright (frontend)
- TDD: write failing test first, then implement

### refactor
- Extract functions when files exceed 600 lines
- Prefer small, focused functions over god functions
- Maintain existing behavior — do not change what the code does
- Improve type safety, eliminate code smells

### code-review-commons
- Focus on correctness, security, and maintainability
- Check for proper error handling and edge cases
- Verify tests cover the changes
- Follow existing code style and conventions

### postgres-patterns
- Use parameterized queries to prevent SQL injection
- Index columns used in WHERE, JOIN, ORDER BY
- Use EXPLAIN ANALYZE to optimize slow queries
- Prefer transactions for multi-step operations

### impeccable
- Premium UI: avoid generic AI aesthetics
- Use Plus Jakarta Sans (titles), DM Sans (body)
- Colors: #FF5C3A (accent), #0a0a0a (base), #141414 (cards)
- No emojis in UI — use SVG/lucide-react icons
- Toggle active: #FF5C3A (never bg-blue-600)

### frontend-design-patterns
- Optional chaining (?.) mandatory for API/Supabase data
- Always provide fallback values in UI components
- Dynamic pricing: use getPricingConfig() — never hardcode prices
- Currency: COP→USD conversion formula: Math.ceil((precioCOP + 10000) / trm)

### backend-patterns
- Use maybeSingle() or manual validations instead of .single()
- Try-catch with granular error handling
- Always validate inputs before database operations

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | Lookitry_Brain_Vault/Cerebro/AGENTS.md | Agent team config (8 agents) |
| TECH_STACK.md | Lookitry_Brain_Vault/Cerebro/TECH_STACK.md | Full tech documentation |
| REGLAS_IMPORTANTES.md | Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md | Operational rules |
| PRD.md | Lookitry_Brain_Vault/Cerebro/PRD.md | Product definition |
| DESIGN.md | Lookitry_Brain_Vault/Cerebro/DESIGN.md | Design system |

## Project-Specific Rules

### Code Organization
- Monorepo: frontend/, backend/, Lookitry_Brain_Vault/
- Backend services: 23 services, 24 route files, modular controllers
- Frontend components: 40+ reusable components

### Deployment
- Use `python scripts/_deploy_now.py` — NOT GitHub Actions
- Auto-commit after significant changes (conventional commits)

### Database
- Supabase PostgreSQL + pgvector (RAG embeddings)
- 30+ tables including brands, products, generations, leads

### Testing
- Frontend: vitest (unit/integration), @playwright/test (E2E)
- Backend: jest (unit/integration), fast-check (property-based)
- Run tests before commits when possible
