# Quizzes

Study quizzes drawn from the 2025 NFHS Football Rules Book and Case Book in this
repository. Each `quiz-NNN-*.md` is published at `/quizzes/<filename>/` and is
listed automatically on `/quizzes/` and the home page — no page needs editing
when a quiz is added. This README and `asked-questions.md` are authoring docs and
are excluded from the build (see `.eleventy.js`).

| Quiz | Level | Qs | Focus |
| --- | --- | --- | --- |
| [quiz-001-expert-mixed.md](quiz-001-expert-mixed.md) | Expert | 10 | Mixed — kicking, scoring/touchbacks, penalty enforcement, overtime |
| [quiz-002-rule-3-clock-and-substitutions.md](quiz-002-rule-3-clock-and-substitutions.md) | Expert | 10 | Rule 3 — extending a period, timing errors, helmets, substitution |
| [quiz-003-dead-ball-and-definitions.md](quiz-003-dead-ball-and-definitions.md) | Expert | 10 | Rules 1, 2, 4 — dead ball, inadvertent whistle, progress, numbering |
| [quiz-004-rule-9-conduct.md](quiz-004-rule-9-conduct.md) | Expert | 10 | Rule 9 — blocks, horse collar, helmets off, illegal participation |
| [quiz-005-kicks-passes-enforcement-overtime.md](quiz-005-kicks-passes-enforcement-overtime.md) | Expert | 10 | Rules 5, 6, 7, 10 + overtime — PSK, spikes, basic spots, tie-breaker |
| [quiz-006-rookie-definitions-part-1.md](quiz-006-rookie-definitions-part-1.md) | Rookie | 11 | Rules 1, 2, 7 — dead ball, neutral zone, fumble vs muff, false start |
| [quiz-007-rookie-definitions-part-2.md](quiz-007-rookie-definitions-part-2.md) | Rookie | 15 | Rules 2, 6, 7 — linemen and backs, forward passes, free and scrimmage kicks |

[asked-questions.md](asked-questions.md) is the ledger of every question already
used. Nothing in it may be asked again.

## Front matter

Every quiz file starts with this block; `test/content/frontmatter.test.js`
enforces it. The layout renders these fields, so the body starts at
`## Questions` — no `# Title` heading.

```yaml
---
title: "Quiz 006 — Short Descriptive Name"   # number first: the lists sort on title
date: 2026-07-26                             # ISO 8601
description: "One line shown under the title in the quiz list."
source: "2025 NFHS Football Rules Book + Case Book (Rule 9)"
level: Expert
questions: 10
scope: "11-player football, no state adoptions in effect unless stated."
---
```

## Making another one

The [creating-nfhs-quizzes](../.claude/skills/creating-nfhs-quizzes/SKILL.md)
skill handles this. Ask for a quiz — "make me a 15-question quiz on Rule 9" —
and it reads the ledger, draws fresh questions from the source chapters, writes
the next `quiz-NNN-*.md`, and records the new questions so they stay retired.
