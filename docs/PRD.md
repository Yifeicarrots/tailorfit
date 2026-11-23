# TailorFit — Product Requirements

## Overview
TailorFit helps job seekers tailor their resume to a specific job. Users store
all their experiences and projects once. For each application, they paste a job
description, and the app uses the Claude API to (1) select the most relevant
experiences and projects and (2) rewrite their bullet points to fit the role.
The user reviews and approves every change.

Group: [Group #] — [Member names]

## Problem
Job seekers often have more experiences than fit on a one-page resume, and the
best ones to show change with every job. Tailoring by hand is slow, so many
people send one generic resume everywhere and get fewer callbacks.

## Target Users
- Students and new grads applying to many internships and entry-level roles
- Career switchers whose varied background needs different framing per role

## User Stories
1. As a job seeker, I want to save all my experiences and projects in one place,
   so I only enter them once.
2. As a job seeker, I want to paste in a job description, so the app knows what
   role I'm targeting.
3. As a job seeker, I want the app to pick my most relevant experiences and tell
   me why, so I can trust or adjust its choices.
4. As a job seeker, I want to add or remove items from the selection, so I stay
   in control of what goes on my resume.
5. As a job seeker, I want my bullet points rewritten to match the job
   description's wording, so my resume reads as relevant to the role.
6. As a job seeker, I want to compare each original and rewritten bullet side by
   side and accept or edit it, so the final version still sounds like me.
7. As a job seeker, I want assurance that rewrites never invent skills or numbers
   I didn't provide, so I can stand behind every line in an interview.

## Core Pipeline
1. ExperienceSelector (Claude call #1): takes the experience library and job
   description, returns the IDs of the best-fit items with a reason for each,
   as JSON.
2. ResumeRewriter (Claude call #2): takes only the selected items and the job
   description, returns a rewritten version of every bullet, as JSON.
3. Validation: every Claude response is checked before reaching the user
   (valid JSON, IDs that exist, no dropped bullets, no invented numbers or skills).

## Constraints
- The Anthropic API key is used only in server-side code, never in the browser.
- Rewrites must not add skills, employers, or numbers absent from the original.
- Sample and test data use fictional people, never real resumes.

## Out of Scope
- User accounts and authentication
- Exporting to PDF or Word
- Job search or application tracking

## Success Measures
- Selector eval: at least 90% average recall of human-labeled "must include"
  items across the sample job descriptions.
- Every user story above works end to end in the demo.