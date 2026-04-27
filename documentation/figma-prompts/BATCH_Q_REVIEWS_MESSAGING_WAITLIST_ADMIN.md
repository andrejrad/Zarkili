# Batch Q — Reviews, Messaging, Waitlist Admin

> Consumed by **Week 41**. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Review queue + bulk actions · Owner reply composer with templates · Flag/dispute/hide with audit · Review request automation · Reputation summary · Inbox triage across staff · Thread assignment · Canned replies · Operating-hours auto-reply · Block/report client from inbox · Message archive + search · Waitlist list with priority · Convert waitlist → booking · Waitlist policies.

New components: `bulk-action-bar` (reuse), `assignment-picker`, `canned-reply-editor`, `auto-reply-schedule-editor`, `waitlist-priority-drag-list`.

---

## SCREEN — Q.1 Review Queue + Bulk Actions

```text
SCREEN: Review Queue    DEVICE: iPad + iPhone
- data-table-v1: client · service · rating · sentiment chip · status pill · action.
- Filters: rating, date range (US), status (pending reply / replied / flagged), sentiment.
- Bulk-action bar: Reply with template · Flag · Hide.
STATES: default, empty, loading, error.
```

## SCREEN — Q.2 Owner Reply Composer with Templates

```text
SCREEN: Reply Composer    DEVICE: side-panel iPad / modal-sheet iPhone
- Original review preview at top.
- Composer multiline + variable picker (e.g., `{{client.firstName}}`).
- Template picker (saved replies) + Save-as-template CTA.
- Tone hint chip-row (AI suggestion: Apologetic / Grateful / Professional).
- Sticky CTA "Post reply" + "Save as draft".
STATES: draft, posted, error.
```

## SCREEN — Q.3 Flag / Dispute / Hide with Audit

```text
SCREEN: Moderation Action    DEVICE: modal-sheet
- Reason picker.
- Evidence textarea/upload.
- Action: Flag for platform / Dispute / Hide locally (with audit-timeline-row preview).
States: submitted, accepted, rejected, error.
```

## SCREEN — Q.4 Review Request Automation Rules

```text
SCREEN: Review Request Rules    DEVICE: iPad + iPhone
- Rule list: trigger (post-booking N hours), channel (Email/SMS/Push), audience filter, frequency cap.
- Live preview render.
States: enabled, disabled, error.
```

## SCREEN — Q.5 Reputation Summary Dashboard

```text
SCREEN: Reputation    DEVICE: iPad + iPhone
- KPI tiles: avg rating, reviews this period, response rate %, sentiment distribution.
- Trend chart line.
- Top keywords cloud (positive / negative).
States: default, no-data, error.
```

## SCREEN — Q.6 Inbox Triage Across Staff

```text
SCREEN: Triage Inbox    DEVICE: iPad + iPhone
- 3-column iPad: list (left), thread (center), info (right with client + assignment).
- Filters: assigned-to-me, unassigned, my team, all.
- Bulk-action bar: assign, archive, mark-read, snooze.
STATES: default, empty filter, error.
```

## SCREEN — Q.7 Thread Assignment

```text
SCREEN: Assign Thread    DEVICE: assignment-picker popover
- assignment-picker: avatar list with availability dot + assign button.
- Optional message to assignee.
States: assigning, assigned toast, error.
```

## SCREEN — Q.8 Canned Replies / Templates

```text
SCREEN: Canned Replies    DEVICE: iPad + iPhone
- canned-reply-editor list with name + content + variables.
- Insert into composer button.
States: editing, saved, error.
```

## SCREEN — Q.9 Operating-Hours Auto-Reply

```text
SCREEN: Auto-Reply Schedule    DEVICE: iPad + iPhone
- auto-reply-schedule-editor: weekly schedule (US week) + holidays + away message body.
- Preview rendered as chat-bubble.
States: enabled, disabled, error.
```

## SCREEN — Q.10 Block / Report from Inbox

```text
Action sheet from thread: Block client (destructive confirm) · Report message (form).
States: submitted, blocked.
```

## SCREEN — Q.11 Message Archive + Search

```text
SCREEN: Archive Search    DEVICE: iPad + iPhone
- Top: search-bar with filters (sender, date range US, with attachments).
- List of matching messages with highlight.
- Restore-to-inbox swipe action.
STATES: default, no-results, error.
```

## SCREEN — Q.12 Waitlist List with Priority

```text
SCREEN: Waitlist Admin    DEVICE: iPad + iPhone
- waitlist-priority-drag-list: rows of clients with avatar, requested service, requested window, joined date (US), priority chip (drag handle to reorder).
- Filters: status, service, date.
STATES: default, empty, error.
```

## SCREEN — Q.13 Convert Waitlist → Booking

```text
SCREEN: Convert Waitlist    DEVICE: modal-sheet
- Suggested slots from slot engine.
- Notify client toggle (channel picker).
- "Confirm booking" primary.
States: default, no-slot, success → O.3, error.
```

## SCREEN — Q.14 Waitlist Policies

```text
SCREEN: Waitlist Policies    DEVICE: iPad + iPhone
- Editor: max time on list, auto-expire, notification cadence, response window.
States: draft, published.
```

---

## COMPONENTS

```text
assignment-picker — popover 280 wide with searchable avatar list, availability dot, optional message field, assign primary.

canned-reply-editor — list view with name/content/variables; editor with name input + multiline body + variable picker + tag chips for organization.

auto-reply-schedule-editor — 7-day grid with on/off + time range; holiday list; away-message preview chat-bubble.

waitlist-priority-drag-list — list rows with drag handle 24, avatar, service, window chip, joined date label-small.
```

---

## Human Review Checklist

- [ ] All 14 screens + 4 components delivered.
- [ ] Reply composer supports templates + variables + AI tone suggestions.
- [ ] Auto-reply uses 12h AM/PM with timezone label.
- [ ] Waitlist conversion routes through slot engine.
- [ ] Frames named `Q-<screen>-<state>`.
