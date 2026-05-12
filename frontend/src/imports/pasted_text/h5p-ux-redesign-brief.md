# UX/UI Redesign Brief
## ReactivEdu

## Project Summary
This website is ReactivEdu for creating, editing, enriching, and exporting interactive learning videos.

The product is used primarily by teachers. A major priority for this redesign is that the website must be easy to use for middle-aged teachers who may not be highly technical, may not be familiar with modern complex interfaces, and may prefer clarity, predictability, and low-stress workflows over power-user density.

This is not a product that should feel experimental, trendy, or overloaded. It should feel calm, clear, trustworthy, and easy to learn.

## Primary Design Goal
Redesign the product so that middle-aged teachers can confidently complete core tasks without confusion, without needing technical knowledge, and without feeling overwhelmed.

## Core User Group
Primary users:
- Middle-aged teachers
- Non-technical educators
- Content creators in schools or training environments
- Admin users who may manage content, but are still not necessarily technical

Important user traits:
- They may not understand platform jargon
- They may be cautious about clicking unfamiliar controls
- They may be slower to explore hidden actions
- They may need stronger visual guidance and clearer feedback
- They may prefer step-by-step workflows over dense dashboards
- They may use laptops more than phones, but mobile compatibility is still required

## UX Principles
The new UI should be designed around these principles:

1. Simple first
- Show only what is needed for the current step
- Avoid dense toolbars, crowded cards, and too many parallel actions

2. Low cognitive load
- Reduce the number of decisions on screen
- Use progressive disclosure for advanced options

3. Clear language
- Replace technical terms with plain, teacher-friendly wording
- Avoid internal product jargon unless absolutely necessary

4. Strong guidance
- Help users know what to do next at all times
- Use step labels, helper text, and clear CTAs

5. Safe interaction design
- Actions should feel reversible and predictable
- Destructive actions must be obvious and confirmed

6. Accessibility and readability
- Large enough text
- Good contrast
- Strong visual hierarchy
- Clear spacing and grouping

7. Calm and trustworthy visual design
- Avoid flashy UI trends
- Avoid clever but confusing patterns
- Favor familiarity, structure, and legibility

## Product Scope
Main functions currently supported by the platform:
- Register and log in
- View dashboard of videos
- Upload a video file
- Import a YouTube video
- Edit a video
- Add H5P interactive elements
- Preview video with interactions
- Use AI transcript-based enrichment
- Accept, reject, and edit AI suggestions
- Apply AI-generated interactions to a video
- Export as H5P
- Export/share LTI link
- Admin access

## Priority User Flows
These flows should be redesigned first:

1. Login / Register
Goal:
- Get teachers into the system with minimal friction

2. Dashboard
Goal:
- Let teachers quickly understand what content they have
- Make key actions obvious:
  - create/upload
  - continue editing
  - preview
  - export

3. Video Upload / Import
Goal:
- Make adding a new video feel easy and guided
- Reduce confusion between file upload and YouTube import

4. Video Edit
Goal:
- Make editing feel structured instead of overwhelming
- Help teachers understand what interactive content exists in the video
- Make the next available action obvious

5. AI Enrichment
Goal:
- Turn a technically complex workflow into a guided teacher-friendly process
- Help users understand:
  - upload transcript
  - run AI
  - review suggestions
  - accept/reject/edit
  - apply changes

6. Export / Share
Goal:
- Make delivery and sharing easy to understand
- Clarify difference between export types

## Current UX Issues to Solve
The redesign should explicitly address these issues:

1. The product currently feels too technical in some flows
2. Too many actions compete for attention on single screens
3. Some interactions are discoverability-poor
4. Right-click or hidden actions should not be required for important tasks
5. AI Enrichment is powerful but cognitively heavy
6. The platform does not yet feel optimized for teachers who need confidence and clarity
7. Error handling should be more human-friendly
8. Empty states and next steps need stronger guidance
9. Navigation should be simplified and more role-aware
10. The visual system should be more coherent and consistent

## Design Direction
The visual direction should be:

- clean
- welcoming
- calm
- readable
- structured
- familiar
- professional but not corporate-cold

Avoid:
- overly futuristic UI
- dark, heavy, technical aesthetic by default
- tiny labels
- icon-only decision making
- dense enterprise-style control panels
- hidden critical actions
- complicated filter and menu patterns unless strongly justified

## Content and Tone Guidelines
UI copy should sound:
- supportive
- clear
- direct
- non-technical
- instructional when necessary

Examples of preferred tone:
- "Upload your transcript"
- "Run AI suggestions"
- "Review suggested activities"
- "Apply selected interactions"

Examples to avoid:
- "Execute enrichment pipeline"
- "Manage interaction injection"
- "Configure advanced AI staging"

## Specific Expectations for the Designer
Please deliver:

1. UX Audit
- Main friction points
- Key opportunities to simplify
- Top teacher-usability risks

2. Information Architecture Proposal
- Improved sitemap
- Improved navigation model
- Clear separation of teacher tasks vs admin tasks

3. User Flows
- End-to-end journeys for the main tasks
- Especially focused on middle-aged teacher usability

4. Wireframes
- Low-fidelity wireframes for all key screens
- Desktop-first, but responsive

5. High-Fidelity UI
- Final visual direction
- Design system/tokens/components
- States for loading, empty, success, error

6. Prototype
- Clickable prototype for major workflows

7. Handoff Notes
- Interaction guidance
- Accessibility notes
- Design rationale
- Priority implementation guidance

## Required Design Questions
While redesigning, please answer these:

1. How can the platform feel easier for teachers on first use?
2. How can we reduce intimidation on the AI Enrichment screen?
3. How can we make the dashboard more actionable and less ambiguous?
4. What should the “default path” for a teacher look like?
5. Which advanced options should be hidden until needed?
6. How can export/share be explained in a simpler way?
7. How can the system communicate progress and success with confidence?

## Accessibility Requirements
The redesign must support:
- keyboard accessibility
- visible focus states
- readable type sizes
- strong contrast
- clear form labels
- strong error visibility
- non-color-only status communication

## Localization Requirements
The product supports multiple languages. The UI should be designed to handle localization safely, including:
- longer labels
- button text growth
- translated helper text
- clear language switching

## Technical Constraints
The redesign should respect the current application structure unless discussed otherwise:
- React frontend
- MUI component system
- existing page routes
- existing backend-driven workflows for auth, videos, transcript parsing, AI analysis, and export

The redesign can reorganize the experience and screen layouts, but should not assume a full product rewrite unless explicitly approved.

## Success Criteria
The redesign is successful if:

1. A middle-aged teacher can understand the main workflow quickly
2. A first-time user can upload and edit a video without confusion
3. The AI Enrichment flow feels guided, not intimidating
4. Important actions are easy to find
5. The interface feels more trustworthy and less technical
6. The product is visually consistent and easier to learn

## Final Note
This redesign should prioritize usability over novelty.

The most important outcome is not a visually trendy interface. The most important outcome is a platform that middle-aged teachers can use comfortably, confidently, and independently.