# Diagram and Figure Descriptions — machine-drawable prompts

This file provides precise, unambiguous visual descriptions for every figure used in the thesis. Each description is formatted as a prompt that can be fed into a diagram/illustration generator (vector or raster). Use the section titled with the figure filename as the prompt name.

---

## fig_system_architecture.tex
Prompt:
Draw a clean three-tier system architecture diagram on a horizontal landscape canvas with a thin outer frame and generous whitespace. Use four horizontal pastel bands in this order: Presentation Tier in pale blue, Application Tier in pale green, Data Tier in pale orange, and External Services in pale gray. Center each tier title inside the band in bold small caps.

In the Presentation tier, place four evenly spaced rounded white cards with thin dark borders. Left card: Dashboard with exactly three short bullet lines, "Video list", "Folders / trash", and "Export". Second card: Editor with "Video player", "H5P timeline", and "Timestamp capture". Third card: AI Panel with "Suggestion cards", "Accept / Reject / Edit", and "Bloom's badges". Right card: Auth UI with "Login / Register" and "JWT storage (Zustand)". Above the blue band, centered and italic, write "React 18 + TypeScript SPA (Vite)".

Draw one vertical arrow from the Presentation band down to the Application band labeled "HTTPS REST + SSE". In the Application tier, place four rounded white boxes aligned left-to-right: "Auth Routes (/api/auth)\nJWT middleware\nbcrypt hashing"; "Video Routes (/api/videos)\nUpload + YouTube\nFFmpeg processing"; "H5P Routes (/api/h5p)\nCRUD + export + preview"; and "AI Routes (/api/ai)\nanalyze + inject + transcribe-and-gen". Above this tier, centered, add italic text "Express.js + Helmet + Rate Limit + CORS".

In the Data tier, place three boxes aligned left-to-right: "SQLite DB (h5p.db)\nSequelize ORM\nUsers, Videos"; "H5P Content Store\nh5p-content/\nh5p-libraries/\nh5p-temp/"; and "File System\nuploads/videos\nuploads/thumbnails\ncaption files". Above the Data band, add the small italic label "Data Layer".

In the External Services row at the bottom, place three light gray boxes: "Anthropic Claude\nAPI (cloud)\nclaude-sonnet-4 (fallback)"; "Ollama\nLocal LLM\nlocalhost:11434 (first choice)"; and "YouTube\nTranscript API\noEmbed metadata\nytdl-core". Use dashed gray arrows from AI Routes down to both Ollama and Claude, and from Video Routes down to YouTube. Use solid arrows for internal REST flow and keep labels small, sans-serif, and readable.

---

## fig_ai_pipeline.tex
Prompt:
Render a horizontal left-to-right pipeline on a clean white background with eight primary stages in rounded teal boxes connected by thick dark arrows: "Video input" → "Transcript acquisition" → "Segment formatting" → "Provider selection" → "LLM generation" → "Zod validation" → "Instructor review" → "H5P injection / export". Keep the boxes aligned on one central baseline with even spacing.

Under the first three boxes, place small helper notes: under Video input, "Upload, YouTube, or caption file"; under Transcript acquisition, "Whisper or captions to segments"; under Segment formatting, "Normalize timestamps and text".

Under Provider selection, draw a vertical fork with three smaller stacked boxes connected by thin arrows: top box "Groq" with label "primary cloud path"; middle box "Ollama" with label "local default if available"; bottom box "Claude" with label "fallback for higher fidelity". Add small latency notes beside each: "3--8 s" for Groq, "variable" for Ollama, and "15--30 s" for Claude. The fork should clearly rejoin the main flow at LLM generation.

Inside LLM generation, add the second line "Prompt includes language, Bloom's level, and schema constraints". Inside Zod validation, add "Reject malformed JSON". Inside Instructor review, add "Accept / Reject / Edit suggestions". Inside H5P injection / export, add "Timeline update + .h5p package". Use a flat teal-and-slate palette, no gradients, and make the arrows bold enough for print.

---

## fig_editor_layout.tex
Prompt:
Create a three-column UI mockup representing the editor. Use a narrow left sidebar, a wide center workspace, and a narrow right sidebar. The left panel header must read "Video source and upload" and include, from top to bottom, a drag-and-drop upload area, a single-line YouTube URL input, a small metadata block with three short lines, and a prominent "Capture timestamp" button. The center panel must be the largest column and must contain a large video player rectangle at the top, a thin timeline strip directly under it with small circular markers, and then a scrollable H5P interaction list with timestamp badges and one-line previews. The right panel header must read "AI suggestions" and show stacked suggestion cards; each card must include a timestamp pill, a question type badge, a one-line question snippet, a Bloom's badge, and three small action buttons labeled Accept, Reject, and Edit.

Use a neutral product-design style with rounded corners, subtle shadows, and clear spacing. Add a small arrow annotation near the player labeled "seek to timestamp". Ensure the three panels are visually distinct: left panel light gray, center white, right very pale blue. Text should be small but readable, and the layout should look like a real desktop app rather than a poster.

---

## fig_erd.tex
Prompt:
Draw a clean monochrome ER diagram on a light background with two primary entities only: "Users" on the left and "Videos" on the right. Each entity should be a rectangle with the entity name in bold at the top and attributes listed below in smaller text. The Users entity must list exactly: id (PK, UUIDv4), username (unique), email (unique), passwordHash, role, isActive, createdAt. The Videos entity must list exactly: id (PK, UUIDv4), title, filePath, thumbnailPath, duration, status, h5pContent (JSON), metadata (JSON), userId (FK). Place a crow's-foot relationship line from Users to Videos labeled "owns" near the middle of the connector, with the crow's-foot at the Videos end to indicate one-to-many. Add two tiny italic index notes below the diagram: "idx_videos_user_id" and "idx_videos_status". Keep the diagram minimal, formal, and textbook-like.

---

## fig_evaluation_metrics.tex
Prompt:
Produce a 2x2 small-multiples bar-chart figure comparing two series only: "New Platform" and "WordPress". Top-left subplot title: "Task Completion Rate (%)" with bars at 95 and 30. Top-right subplot title: "Median Task Time (min)" with bars at 3.2 and 45. Bottom-left subplot title: "Mean SUS Score (0--100)" with bars at 82.5 and 38.0 and a horizontal red dashed line at y=68 labeled "average benchmark (68)". Bottom-right subplot title: "User Satisfaction (1--5)" with bars at 4.8 and 2.1. Use the same x-axis ordering in every subplot, pastel blue for New Platform and muted orange for WordPress, and small numeric labels above every bar. Keep axes neat and consistent, with minimal grid lines and readable tick labels.

---

## fig_workflow_comparison.tex
Prompt:
Create a split comparison diagram with two vertical columns. The left column must be titled "WordPress H5P Plugin" and show a red-to-orange workflow with ten stacked steps connected by downward arrows: login, open or create a post, insert H5P block, open the editor in a new tab, upload/link video, seek to timestamp, configure nested options, save and return, publish, export. Add a small red badge near the bottom that says "30% completion rate" and add short italic pain notes to the right side such as "Too many screens", "WordPress concepts", and "No real-time preview".

The right column must be titled "AI-ActivEdu New Platform" and show a green-to-blue workflow with seven stacked steps: login and open dashboard, upload video or paste URL, click AI Analyse, review suggestions, accept/edit/reject, preview, export .h5p or copy LTI link. Add a green badge that says "95% completion rate" and small benefit notes such as "Single screen", "AI drafts", and "Real-time preview". Keep the two columns aligned and visually symmetric, with a dashed divider down the middle.

---

## fig_sequence_ai.tex & fig_sequence_auth.tex
Prompt:
For sequence diagrams, produce simplified swimlane-style diagrams with lane headers across the top and vertical lifelines. For the AI sequence diagram, use exactly five lanes labeled "Instructor", "Frontend (SSE)", "Backend (AI)", "LLM Provider", and "DB / H5P". Show the following messages in order: Instructor clicks Analyze; Frontend opens SSE connection; Backend extracts or receives transcript; Backend formats segments and sends prompt; LLM Provider streams tokens; Backend relays chunks through SSE; Frontend renders suggestion cards; Instructor accepts one suggestion; Backend injects H5P content; Database and content store are updated. Add small step numbers beside the major arrows.

For the auth sequence diagram, use exactly four lanes labeled "User", "Frontend", "Auth API", and "DB". Show the login path only: User submits credentials; Frontend POSTs to /api/auth/login; Auth API verifies bcrypt; Auth API issues JWT; Frontend stores token in Zustand/localStorage. Make the return arrow from Auth API to Frontend clearly labeled "JWT + user profile".

---

## fig_usecase.tex
Prompt:
A simple use-case diagram with one stick-figure actor labeled "Instructor" on the left and a system boundary box on the right labeled "MOOC Video Authoring Platform". Inside the system boundary, place five use-case ovals: "Upload video", "AI Analyse", "Review suggestions", "Export .h5p", and "Embed in LMS". Connect the actor to each oval with thin straight lines. Keep the layout compact and formal, with the system box taking most of the right side and the actor sitting just outside it.

---

## fig_deployment_topology.tex
Prompt:
A small deployment topology showing client browsers at the top connecting downward to a load balancer, then to multiple app server boxes in the middle, then to shared storage and a database node below. On the storage side, show a shared file store for uploads, thumbnails, and H5P content. On the database side, show SQLite as the current single-file database and add a faint optional arrow toward PostgreSQL labeled "future scale-out". At the side, place external service boxes for AI provider and YouTube captions. Use simple server icons, clear network connectors, and a neat, compact layout suitable for a thesis figure.

---


If you want these prompts tailored to a specific image model (SVG/vector vs raster), tell me the target and I will adapt token-level style details (font families, exact color hex values, stroke widths).
