# Daily Work Diary Template

**Multi-Chat Usage:**
Use this template once per day per chat/project. To avoid overwriting files when using in multiple chats, always include the chat or project name after the date in the filename.

**Example:**
- documentation/diary/2026-04-17-zarkili.md
- documentation/diary/2026-04-17-ai-research.md

Keep entries short, specific, and decision-focused.

## Date
- YYYY-MM-DD (Day)

## Session Metadata Header (Required)
- Chat Name: CHATNAME
- Session ID: SESSION-ID-OR-LABEL
- Project/Workspace: Zarkili
- Start Time:
- End Time:
- Scope: What this chat covered in one line

## Main Focus
- What was the primary objective today?

## Wins (What Moved Forward)
1. 
2. 
3. 

## Decisions Made
1. Decision:
- Why:
- Impact:

2. Decision:
- Why:
- Impact:

## What I Actually Worked On
1. Task:
- Action taken:
- Result:

2. Task:
- Action taken:
- Result:

3. Task:
- Action taken:
- Result:

## Artifacts Created/Updated
1. File/link:
- Purpose:

2. File/link:
- Purpose:

## Risks/Blockers
1. Risk or blocker:
- Current status:
- Mitigation/next action:

## Open Questions
1. 
2. 

## Metrics/Signals (Optional)
- Time spent:
- Screens/components completed:
- Tests/checks run:
- User feedback collected:

## Next Actions (Tomorrow)
1. 
2. 
3. 

## Key Prompts Used Today
1. Tool:
- Purpose:
- Prompt summary:
- Full prompt (copy exact text used):
```text
PASTE COMPLETE PROMPT HERE
```

2. Tool:
- Purpose:
- Prompt summary:
- Full prompt (copy exact text used):
```text
PASTE COMPLETE PROMPT HERE
```

3. Tool:
- Purpose:
- Prompt summary:
- Full prompt (copy exact text used):
```text
PASTE COMPLETE PROMPT HERE
```

---

# Fast Fill Version (2-3 Minutes)

Copy this quick format when you are short on time:

Date: YYYY-MM-DD
Chat Name: CHATNAME
Session ID: SESSION-ID-OR-LABEL

- Focus:
- Top 3 Wins:
  1) 
  2) 
  3) 
- Key Decision:
  - Decision:
  - Why:
- Main Artifact:
  - 
- Biggest Risk:
  - 
- Tomorrow First 3 Actions:
  1) 
  2) 
  3) 
- Key Prompts Used Today:
  1) [Tool] - [short purpose]
    Full prompt:
    ```text
    PASTE COMPLETE PROMPT HERE
    ```
  2) [Tool] - [short purpose]
    Full prompt:
    ```text
    PASTE COMPLETE PROMPT HERE
    ```
  3) [Tool] - [short purpose]
    Full prompt:
    ```text
    PASTE COMPLETE PROMPT HERE
    ```

---


# Suggested Naming Convention (Multi-Chat Safe)

- For daily per-chat/project files:
  - documentation/diary/YYYY-MM-DD-CHATNAME.md
    (e.g., documentation/diary/2026-04-17-zarkili.md)

- For rolling weekly per-chat/project files:
  - documentation/diary/YYYY-WW-CHATNAME.md
    (e.g., documentation/diary/2026-W16-zarkili.md)

Replace CHATNAME with a short, unique identifier for your chat or project.

## Safe Header Rules
1. Always include Chat Name and Session ID in the entry body.
2. Use the same CHATNAME token in both filename and header.
3. If a chat continues the next day, keep the same CHATNAME and create a new date file.
4. If two chats are about similar topics, use distinct names (for example: zarkili-design and zarkili-implementation).

---

# Example Entry (Based On Recent Work)

## Date
- 2026-04-17 (Friday)

## Main Focus
- Set up an AI-first design workflow for Gen-Z redesign without a dedicated designer.

## Wins (What Moved Forward)
1. Created an execution playbook for AI-driven design work.
2. Added ready-to-run prompts for strategy, research, visual routes, QA, and implementation.
3. Connected the new playbook into the existing master documentation index.

## Decisions Made
1. Decision: Use foundation-first then parallel design/build model.
- Why: Prevent visual drift while not blocking development.
- Impact: Clear weekly operating cadence for team execution.

2. Decision: Pre-fill all prompts for Zarkili context instead of using placeholders.
- Why: Reduce setup friction and speed up daily execution.
- Impact: Immediate copy-paste usability for next work sessions.

## What I Actually Worked On
1. Task: AI design playbook creation.
- Action taken: Wrote a full no-designer operating guide with tool stack and process.
- Result: Team now has one source of truth for AI-based design workflow.

2. Task: Prompt pack production.
- Action taken: Produced concrete prompts for GPT, Perplexity, Ideogram/Midjourney, Figma, QA, and Copilot implementation.
- Result: Prompt engineering workflow is production-ready.

3. Task: Documentation integration.
- Action taken: Added playbook link to master index.
- Result: New artifact is discoverable in current doc run order.

## Artifacts Created/Updated
1. File/link: documentation/AI_FIRST_GENZ_DESIGN_PLAYBOOK.md
- Purpose: Core AI-first redesign guide and prompt pack.

2. File/link: documentation/MULTITENANT_MASTER_INDEX.md
- Purpose: Added playbook reference for discoverability.

## Risks/Blockers
1. Risk or blocker: Overproducing visual options and slowing decisions.
- Current status: Medium risk.
- Mitigation/next action: Limit to 3 style routes and pick one route in Week 1.

## Open Questions
1. Which of the 3 visual routes should become the final brand direction?
2. What exact conversion metric baseline should be tracked first?

## Next Actions (Tomorrow)
1. Run UX direction and research prompts.
2. Generate and compare 3 visual routes.
3. Select one route and build first high-fidelity flow in Figma.

## Key Prompts Used Today
1. Tool: GPT
- Purpose: Define product and UX direction.
- Prompt summary: Generated UX principles, IA, journey specs, and component inventory.
- Full prompt (copy exact text used):
```text
You are a senior mobile product designer and UX strategist specializing in Gen-Z consumer apps.
Context: Product Zarkili; target users Gen-Z clients booking beauty services + salon staff; platform iOS/Android via React Native Expo; backend/business logic reused from ZaraNails (auth, profile, tenant context, bookings, payments); no dedicated designer; output must be implementation-ready.
Tasks: define 6 UX principles; propose tab IA and subflows; write 5 end-to-end journeys (onboarding, discovery, booking, loyalty, profile) with happy path, edge cases, friction risks; provide MVP component inventory with variants/states; list open decisions.
Output format: numbered sections, practical recommendations, accessibility included.
```

2. Tool: Perplexity
- Purpose: Gather evidence-based Gen-Z pattern references.
- Prompt summary: Collected 2025-2026 mobile interaction patterns, do/don't list, and risks.
- Full prompt (copy exact text used):
```text
Research the most effective mobile UX and visual design patterns used in Gen-Z consumer apps between 2024 and 2026 for booking/beauty/lifestyle/social-commerce contexts. Deliver 12 findings with source links, why each pattern works, misuse risk, trends to avoid, and a Zarkili-specific do/don't table. Focus on mobile behavior-level patterns (tap counts, gesture patterns, flow friction), not desktop or surface aesthetics only.
```

3. Tool: Ideogram/Midjourney
- Purpose: Explore visual style routes.
- Prompt summary: Generated three competing style directions for route selection.
- Full prompt (copy exact text used):
```text
Create a mobile app visual direction board for Zarkili (Gen-Z beauty booking). Generate 3 routes:
1) Elevated Soft Minimal, 2) Bold Playful Editorial, 3) Warm Neo-Brutalist Soft.
For each route include color mood, typography feel, UI texture/depth, icon/illustration style, sample card and navigation motifs, and 3 palettes with hex values. Keep mobile readability high; avoid generic startup look.
```
