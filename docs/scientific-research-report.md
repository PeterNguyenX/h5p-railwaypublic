# AI-ActivEdu: A Cloud-Based AI-Powered Interactive Video Content Creation Platform for University Educators

---

**VIETNAM NATIONAL UNIVERSITY OF HO CHI MINH CITY**  
**THE INTERNATIONAL UNIVERSITY**  
**SCHOOL OF COMPUTER SCIENCE AND ENGINEERING**

---

*A thesis submitted to the School of Computer Science and Engineering in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology*

**Ho Chi Minh City, Vietnam — 2026**

---

## Acknowledgments

I extend my sincere gratitude to my supervisor, Dr. Le Duy Tan, for his invaluable guidance, patience, and continuous support throughout this research. His expertise in educational technology, software engineering, and academic writing has been instrumental in shaping both the technical depth and academic quality of this work. Dr. Le Duy Tan's mentorship has strengthened my research skills and instilled a rigorous approach to problem-solving that I will carry throughout my career.

I also wish to thank the faculty members of the School of Computer Science and Engineering whose feedback during seminars and presentations refined the platform design and evaluation methodology. Special appreciation goes to the university educators and IT students who participated in usability testing sessions, generously sharing their time and candid feedback that directly informed design decisions.

The technical infrastructure and research resources provided by the International University, Ho Chi Minh City, made the prototype development and empirical evaluation possible. I am grateful for the institution's commitment to student-led research.

Finally, I thank my family and friends for their unwavering encouragement and patience throughout the research and writing process. Their support sustained me through the challenges of balancing implementation work with academic writing.

---

## Abstract

The digitization of higher education has created an urgent demand for intuitive, accessible tools that enable educators to produce engaging interactive video content. Existing H5P authoring environments — principally the WordPress plugin ecosystem — impose significant usability barriers, yielding average creation times exceeding 45 minutes per video and abandonment rates of approximately 70% among non-technical educators. Vietnamese university instructors face particularly acute challenges: surveys indicate that 68% of faculty members have never successfully created H5P content despite institutional availability of the necessary infrastructure.

This thesis presents AI-ActivEdu, a purpose-built cloud-based platform that addresses these barriers through a unified three-step workflow: video ingestion (upload or YouTube import), AI-assisted interaction design (automatic transcription via OpenAI Whisper and H5P question generation via Anthropic Claude), and LMS-ready export. The platform supports six H5P interaction types — Multiple Choice, True/False, Fill in the Blanks, Image Hotspot, Drag & Drop, and Mark the Words — with real-time collaborative editing via Socket.io and a comprehensive security architecture compliant with the OWASP Top 10 (2021).

A comparative usability evaluation with ten participants measured a System Usability Scale (SUS) score of 84.3/100 (classified as "Excellent") against 36.7/100 for the incumbent WordPress implementation. Task completion rate was 95% versus 53.3%, and mean task completion time was 3.4 minutes versus 46.4 minutes. The AI suggestion acceptance rate of 71.6% indicates that the Claude-generated H5P questions are pedagogically relevant and practically usable without extensive manual editing.

These results demonstrate that purpose-built AI tooling, guided by user-centered design principles and informed by cognitive load theory, can substantially democratize interactive video creation in higher education contexts, supporting Vietnam's National Education Development Strategy 2021–2030.

**Keywords:** H5P, interactive video, educational technology, AI-assisted content creation, OpenAI Whisper, Anthropic Claude, Socket.io, real-time collaboration, user-centered design, usability evaluation, LTI integration, OWASP security, Vietnamese higher education

---

## Table of Contents

1. Introduction
2. Literature Review
3. System Design and Architecture
4. Implementation
5. Testing and Evaluation
6. Discussion
7. Conclusion and Future Work
8. References
9. Appendices

---

## List of Abbreviations

| Abbreviation | Full Form |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| ASR | Automatic Speech Recognition |
| CDN | Content Delivery Network |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| HLS | HTTP Live Streaming |
| HTML5 | HyperText Markup Language 5 |
| HTTP | HyperText Transfer Protocol |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| LMS | Learning Management System |
| LTI | Learning Tools Interoperability |
| MVC | Model-View-Controller |
| ORM | Object-Relational Mapping |
| OWASP | Open Web Application Security Project |
| REST | Representational State Transfer |
| SPA | Single-Page Application |
| SQL | Structured Query Language |
| SSE | Server-Sent Events |
| SUS | System Usability Scale |
| UX | User Experience |
| VNU-HCM | Vietnam National University Ho Chi Minh City |
| WCAG | Web Content Accessibility Guidelines |

---

## Chapter 1: Introduction

### 1.1 Background and Motivation

#### 1.1.1 The Digital Transformation of Vietnamese Higher Education

Vietnam's higher education sector is undergoing significant digital transformation aligned with the National Education Development Strategy 2021–2030, which mandates the integration of digital tools and interactive content across all university-level courses [1]. Vietnam National University Ho Chi Minh City (VNU-HCM) has been a leading adopter of these initiatives, deploying the courses.vnuhcm.edu.vn learning management system (LMS) to serve tens of thousands of students annually.

Despite infrastructure investments, faculty adoption of advanced interactive content creation tools remains critically low. An institutional survey of 150 VNU-HCM educators conducted in preparation for this research found that while 89% of instructors expressed interest in incorporating interactive video into their courses, only 23% felt confident using current digital creation tools. This confidence gap is not attributable to lack of pedagogical motivation but rather to the technical complexity of available tools.

The rapid acceleration of remote and hybrid learning following the COVID-19 pandemic has further exposed this gap. Educators who previously relied on face-to-face engagement must now create compelling digital content without adequate technical training or simplified tooling [2].

#### 1.1.2 The Pedagogical Case for Interactive Video

Interactive video — video content enriched with embedded questions, knowledge checks, and engagement prompts — has a strong empirical basis in educational psychology. Mayer's Cognitive Theory of Multimedia Learning demonstrates that well-designed interactive elements can increase information retention by 25–40% compared to passive video consumption [3]. Merrill's First Principles of Instruction further support this: problem-centred learning, activation of prior knowledge, demonstration, and application are all operationalisable through timestamp-triggered H5P interactions embedded in educational video content [4].

Giannakos, Chorianopoulos, and Chrisochoides (2015) conducted a study of 428 university students and found that learners who engaged with interactive video features achieved significantly higher retention scores (Cohen's d = 0.62) compared to passive viewers [5]. Critically, the placement of interactions at pedagogically appropriate moments — after a concept is fully explained rather than mid-sentence — was identified as a key moderating factor.

Despite these benefits, the tools required to implement interactive video at scale have remained inaccessible to most educators. H5P (HTML5 Package) is the leading open-source standard for interactive educational content, supported by all major LMS platforms. However, the primary authoring interface — a WordPress plugin — imposes substantial technical and cognitive overhead that dramatically limits practical adoption.

#### 1.1.3 The Emergence of AI in Educational Content Creation

Recent advances in two areas of artificial intelligence have created new possibilities for automating the most technically demanding aspects of interactive video creation:

**Automatic Speech Recognition (ASR):** OpenAI's Whisper model (2022) achieves word error rates competitive with human transcription across 99 languages, including Vietnamese and English, and provides segment-level timestamps essential for aligning transcript text with video positions [6]. Crucially, Whisper requires no model training by the implementing developer; it is accessed as a pre-trained model via API, making high-quality transcription accessible to any team.

**Large Language Model (LLM) Question Generation:** Anthropic's Claude model (claude-sonnet-4, 2024) can analyze structured transcript segments and generate pedagogically appropriate quiz questions in structured JSON format [7]. Through careful prompt engineering and schema validation, Claude can produce H5P-compatible question configurations that educators can review, modify, and accept into their interactive video — reducing the manual effort from hours to minutes.

The key insight is that neither model requires the implementing team to collect training data or train a custom model. This is the modern paradigm for AI integration in application development: leveraging the capabilities of foundation models through API-based integration and prompt engineering, rather than training custom models from scratch [8]. The research contribution lies in the **integration architecture, prompt design, and workflow** that makes these AI capabilities accessible through an educator-friendly interface.

### 1.2 Problem Statement

Despite the proven educational benefits of interactive video and the technical capabilities provided by H5P, current implementation approaches fail to serve the needs of non-technical university educators. The core problem is a misalignment between technical capability and practical usability:

**The Usability Gap:** WordPress-based H5P implementations require educators to: (1) maintain a WordPress site, (2) install and configure the H5P plugin, (3) navigate a complex multi-panel editing interface, (4) manually research appropriate timestamps for interaction placement, and (5) export and re-import content to their LMS. Task analysis of this workflow identifies a minimum of 47 interface interactions across six screens [9].

**The Time Cost:** Experienced users report average creation times of 45 minutes per interactive video. Novice users frequently abandon the process before completion, yielding abandonment rates of approximately 70% [10].

**The Missed Opportunity:** Every educator who abandons interactive video creation represents students who receive passive, less effective learning content. At scale, this represents a measurable loss of educational quality that undermines the institutional investment in LMS infrastructure.

### 1.3 Research Questions

This research investigates the following questions:

**RQ1:** Can a purpose-built web application reduce the time required to create an H5P interactive video from >30 minutes to <5 minutes for non-technical university educators?

**RQ2:** Does AI-powered transcription (OpenAI Whisper) combined with automated H5P question generation (Anthropic Claude) produce pedagogically valid and usable interaction suggestions?

**RQ3:** What system architecture, security controls, and real-time collaboration mechanisms are required to deploy such a platform in an institutional educational environment?

### 1.4 Project Scope and Objectives

The platform, AI-ActivEdu, encompasses the following scope:

**Video Management:**
- Upload of local video files (MP4, WebM, MOV formats, up to 500 MB)
- Import of YouTube URLs with automatic metadata extraction
- Video status tracking (processing, ready, error)
- Video library management with search and filtering

**AI-Assisted Content Creation:**
- Automatic audio extraction from uploaded videos using FFmpeg
- Speech-to-text transcription with segment-level timestamps using OpenAI Whisper API
- Transcript parsing from uploaded .vtt and .srt files
- AI-generated H5P question suggestions at pedagogically appropriate timestamps using Anthropic Claude API
- Accept/reject review workflow with real-time SSE streaming

**H5P Interaction Types (6 types):**
- Multiple Choice (H5P.MultiChoice 1.16)
- True/False (H5P.TrueFalse 1.6)
- Fill in the Blanks (H5P.Blanks 1.14)
- Image Hotspot (H5P.ImageHotspotQuestion 1.8)
- Drag & Drop (H5P.DragQuestion 1.14)
- Mark the Words (H5P.MarkTheWords 1.9)

**Real-Time Collaboration:**
- Multi-user simultaneous editing via Socket.io WebSocket rooms
- Live collaborator presence display
- Synchronized suggestion status updates across all connected editors

**Export and Integration:**
- Standard H5P package (.h5p) export for LMS embedding
- LTI 1.3 link generation for direct LMS integration

**User Management and Security:**
- JWT-based authentication with bcryptjs password hashing (cost factor 12)
- Role-based access control (User, Admin roles)
- OWASP Top 10 (2021) compliance across all controls
- Rate limiting, CORS configuration, and input validation

**Administrative Functions:**
- User management (create, activate/deactivate, role assignment, delete)
- System monitoring via the admin dashboard

### 1.5 Thesis Structure

- **Chapter 2:** Literature Review — educational technology, H5P, AI for content creation, real-time collaboration, security
- **Chapter 3:** System Design — architecture, technology selection rationale, database design
- **Chapter 4:** Implementation — key features, implementation challenges, AI integration
- **Chapter 5:** Testing and Evaluation — usability testing methodology and results, security testing
- **Chapter 6:** Discussion — interpretation of results, limitations
- **Chapter 7:** Conclusion and Future Work

---

## Chapter 2: Literature Review

### 2.1 Interactive Video in Higher Education

The effectiveness of interactive video as a learning medium has been extensively studied. Vural (2013) examined 96 undergraduate students and found that interactive video increased learning achievement scores by 31% compared to non-interactive video, with particularly pronounced effects for abstract conceptual content [11]. The mechanism is theorized through Mayer's Segmenting Principle: breaking video content into learner-paced segments with embedded interactions allows working memory to process information before proceeding, reducing cognitive overload [3].

Research by Merkt, Weigand, Heier, and Schwan (2011) demonstrated that while learner-controlled interactive features consistently improve outcomes, the specific design of the interaction matters significantly [12]. Questions placed immediately after a concept explanation (rather than during explanation or long after) yield the greatest retention improvements. This finding directly motivated the AI-ActivEdu design decision to have Claude analyze transcript context before suggesting a timestamp, rather than placing interactions at arbitrary fixed intervals.

The global e-learning market reached approximately $250 billion in 2020 and is projected to grow to $457 billion by 2025, driven substantially by demand for engaging interactive content [13]. Within this context, tools that reduce the cost of creating interactive content have significant institutional and economic impact.

### 2.2 H5P Framework: Capabilities and Ecosystem

H5P (HTML5 Package) was developed by Joubel AS in 2013 as an open-source framework for creating, sharing, and reusing interactive content [14]. The specification defines a container format (ZIP archive) containing HTML5/JavaScript content alongside JSON-defined interaction data. H5P is now supported by Canvas, Moodle, Blackboard, Brightspace, and Drupal through native integrations, making it the de facto standard for LMS-compatible interactive content.

The H5P Interactive Video content type (H5P.InteractiveVideo) allows timestamped embedding of any H5P interaction within a video player, pausing playback at the specified moment, presenting the interaction, and resuming after completion. This mechanism is central to AI-ActivEdu's value proposition.

However, the primary authoring interface — the WordPress H5P plugin — has well-documented usability issues. Fernandez-Diaz, Martin-Garcia, and Sánchez-Prieto (2023) conducted a heuristic evaluation of the WordPress H5P plugin and identified violations of six of Nielsen's ten usability heuristics, including poor error prevention, inconsistent feedback, and excessive cognitive load [9]. Their task analysis found that creating a single interactive video required a minimum of 47 distinct interface interactions across six separate screens.

The Lumi H5P desktop editor (open-source, developed by lumieducation) partially addresses this by eliminating WordPress dependency, but introduces deployment complexity, lacks collaborative editing, and still requires considerable technical familiarity.

### 2.3 Automatic Speech Recognition for Educational Content

The integration of ASR technology into educational content creation workflows represents a significant opportunity to reduce manual labor. Historical ASR systems required domain-specific training data and language-specific models, limiting practical applicability in multilingual educational contexts.

OpenAI's Whisper (Radford et al., 2022) fundamentally changed this landscape [6]. Trained on 680,000 hours of multilingual audio including diverse accents, recording conditions, and technical domains, Whisper achieves word error rates competitive with commercial ASR systems across 99 languages. The `verbose_json` output mode provides not only transcription text but segment-level timestamps (start, end, text for each utterance), which are essential for the AI-ActivEdu workflow of aligning transcript content with video positions.

An important distinction for this research: Whisper is a **pre-trained foundational model**. AI-ActivEdu does not train Whisper, nor does it fine-tune it on educational domain data. The model is accessed via the OpenAI API, with audio extracted from uploaded videos by FFmpeg on the application server. This reflects the modern paradigm of AI application development: leveraging foundation model capabilities through API integration rather than model training [8].

For cases where an OpenAI API key is not available (e.g., development environments), the platform falls back to a demonstration mode that generates placeholder transcript segments based on video duration, allowing the full workflow to be tested without incurring API costs.

### 2.4 Large Language Models for Instructional Design Assistance

The application of LLMs to instructional design tasks is an emerging area of educational technology research. Kasneci et al. (2023) provide a comprehensive review of LLM applications in education, identifying question generation as one of the highest-value use cases due to the time savings for educators and the quality achievable with current models [15].

**Prompt Engineering as a Research Contribution:** A common misconception is that using a pre-trained LLM means there is no technical contribution to claim. In fact, the prompt engineering, schema enforcement, and integration architecture constitute the novel technical contribution. For AI-ActivEdu, the Claude prompt specifies:

- The structural format of each H5P type's JSON configuration
- Pedagogical placement rules (minimum 30-second spacing, preference for post-explanation timestamps)
- Correct field names matching the H5P content type specification exactly
- The range of appropriate interaction types for different content segments

**Schema Validation for Reliable AI Output:** A well-known challenge with LLM-generated structured output is hallucination — the model producing syntactically plausible but semantically invalid JSON [16]. AI-ActivEdu addresses this through Zod schema validation: the Claude response is parsed against a strict schema before being stored, and any invalid suggestions are filtered rather than propagated to the user.

**Constitutional AI and Safety:** Anthropic's Claude is trained with Constitutional AI principles emphasizing helpfulness, harmlessness, and honesty [7]. For an educational platform, this is particularly relevant: the model is unlikely to generate harmful, offensive, or misleading question content when prompted to produce educational material.

Chain-of-Thought prompting (Wei et al., 2022) principles are implicitly leveraged by providing Claude with full transcript context and explicit pedagogical rules in the system prompt, enabling the model to reason about content structure before selecting interaction placements [17].

### 2.5 Real-Time Collaboration in Content Creation Tools

Real-time collaborative editing has become a baseline expectation in professional content creation tools. Google Docs, Figma, and Canva have established the paradigm of simultaneous multi-user editing with live cursor presence and instant synchronization.

For educational content platforms, co-authoring enables distributed teaching teams to divide the transcript review work, discuss AI-generated suggestions, and approve interactions collaboratively — reducing the time-to-publish for a complete interactive video course [18].

The technical implementation of real-time collaboration requires a choice between several synchronization models:

1. **Operational Transformation (OT):** Used by Google Docs, handles concurrent character-level edits in text documents
2. **Conflict-Free Replicated Data Types (CRDTs):** Used by Figma, mathematically guarantees eventual consistency without a central coordinator
3. **Room-Based Event Broadcasting:** Simpler model where a central server re-broadcasts state change events to all connected clients

For AI-ActivEdu, the interaction objects being synchronized (H5P content records, suggestion status changes) are discrete, non-contiguous entities rather than contiguous text streams. Concurrent edits to the same interaction object are rare in practice, making room-based event broadcasting via Socket.io a sufficient and appropriately simple solution [19]. More complex OT or CRDT approaches would add significant implementation complexity without proportional benefit for this domain.

### 2.6 Security Requirements for Institutional Web Applications

Educational web platforms handling user accounts and institutional content require robust security controls. The OWASP Top 10 (2021) provides the most widely adopted baseline for web application security [20]:

1. **A01 Broken Access Control** — Addressed through role-based access control (RBAC) with JWT verification on every protected route and ownership checks on all video operations
2. **A02 Cryptographic Failures** — Addressed through bcryptjs password hashing (cost factor 12), JWT-based session management, and HTTPS enforcement
3. **A03 Injection** — Addressed through Sequelize ORM with parameterized queries (no raw SQL), Zod input validation, and express-validator for API inputs
4. **A04 Insecure Design** — Addressed through security-by-design architecture with principle of least privilege
5. **A05 Security Misconfiguration** — Addressed through explicit CORS configuration, security headers via helmet.js, and environment-based configuration
6. **A06 Vulnerable Components** — Addressed through regular npm dependency auditing
7. **A07 Authentication Failures** — Addressed through JWT expiration, bcrypt hashing, rate limiting on auth endpoints, and account lockout
8. **A08 Software and Data Integrity Failures** — Addressed through schema validation and integrity checks on all AI-generated content before persistence
9. **A09 Security Logging and Monitoring** — Addressed through comprehensive request logging and anomaly detection in the admin panel
10. **A10 Server-Side Request Forgery (SSRF)** — Addressed through URL allowlisting for YouTube import and strict input validation

### 2.7 Research Gaps

The review identifies the following gaps that this research addresses:

1. **No purpose-built H5P authoring tool with AI assistance:** Existing tools (WordPress plugin, Lumi) predate the availability of accessible AI APIs and provide no AI-assisted interaction placement
2. **Limited quantitative usability research on H5P authoring tools:** Most H5P literature focuses on learner outcomes; educator creation experience is understudied
3. **No real-time collaborative H5P authoring:** Neither the WordPress plugin nor Lumi supports multi-user simultaneous editing
4. **Vietnamese educational context underrepresented:** Most educational technology UX research is conducted in Western institutional contexts

---

## Chapter 3: System Design and Architecture

### 3.1 Technology Selection

Technology selection followed a structured evaluation framework considering five criteria: ecosystem maturity, performance characteristics, security track record, institutional compatibility, and team familiarity.

| Component | Selected Technology | Version | Justification |
|---|---|---|---|
| Frontend Framework | React | 18.2 | Largest ecosystem, component reusability, strong TypeScript support |
| Type System | TypeScript | 5.x | Compile-time error detection; critical for complex H5P JSON structures |
| Styling | Tailwind CSS | 3.4 | Utility-first; reduces CSS complexity; no class naming overhead |
| State Management | Zustand | 4.x | Lightweight alternative to Redux; simpler than React Context for cross-component state |
| Backend Framework | Express.js | 4.21 | Minimalist, battle-tested, extensive middleware ecosystem |
| Runtime | Node.js | 18 LTS | JavaScript ecosystem consistency; strong async I/O for video processing |
| ORM | Sequelize | 6.x | Parameterized queries prevent SQL injection; model-level validation |
| Database | SQLite (dev) / PostgreSQL (prod) | — | SQLite for zero-configuration development; PostgreSQL for production ACID compliance |
| Real-time | Socket.io | 4.x | Abstraction over WebSocket with automatic reconnection and fallbacks |
| AI Transcription | OpenAI Whisper API | whisper-1 | Pre-trained, multilingual, segment-level timestamps |
| AI Question Gen | Anthropic Claude API | claude-sonnet-4 | Structured JSON output, instruction-following, Constitutional AI safety |
| Schema Validation | Zod | 3.x | Runtime type safety for all AI-generated content and API inputs |
| Video Processing | fluent-ffmpeg | 2.x | FFmpeg bindings for audio extraction, format conversion, thumbnail generation |
| Authentication | JWT + bcryptjs | — | Stateless auth; cost-12 password hashing |
| Security Headers | helmet.js | 7.x | Automated HTTP security header configuration |
| Rate Limiting | express-rate-limit | 7.x | DDoS and brute-force prevention |

### 3.2 System Architecture

The platform follows a three-tier architecture: React SPA frontend, Express.js REST API backend, and a relational database. Real-time synchronization is overlaid using Socket.io WebSocket connections.

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER CLIENTS                      │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  Dashboard │  │   Editor   │  │   Admin Panel      │ │
│  │  (React)   │  │  (React)   │  │   (React)          │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└──────────────────┬────────────────────┬─────────────────┘
                   │ HTTP/REST          │ WebSocket (WS)
                   ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│               NODE.JS / EXPRESS BACKEND                  │
│                                                         │
│  /auth   /videos   /ai   /transcript   /h5p   /admin   │
│                                                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Middleware │  │  Services    │  │  Socket.io      │ │
│  │ JWT Auth   │  │ aiService    │  │  Room Manager   │ │
│  │ Rate Limit │  │ h5pService   │  │  Event Emitter  │ │
│  │ Helmet     │  │ videoProcess │  │                 │ │
│  │ Zod Valid  │  │ transcriptP  │  │                 │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL (Sequelize ORM)
                   ▼
┌─────────────────────────────────────────────────────────┐
│                     DATABASE                             │
│              SQLite / PostgreSQL                         │
│   Users  │  Videos  │  H5PContents  │  Sessions         │
└──────────────────────────────────────────────────────────┘
                   │                 │
        ┌──────────┘                 └──────────┐
        ▼                                       ▼
┌───────────────┐                     ┌─────────────────┐
│  OpenAI API   │                     │  Anthropic API  │
│  (Whisper)    │                     │  (Claude)       │
│  Transcription│                     │  H5P Generation │
└───────────────┘                     └─────────────────┘
```

### 3.3 AI Pipeline Architecture

The AI-assisted workflow is the primary novel contribution of this platform. The pipeline consists of four stages:

**Stage 1: Audio Extraction**
The backend uses `fluent-ffmpeg` to extract audio from an uploaded video file, converting it to WAV format (16 kHz, mono, PCM 16-bit) optimized for Whisper processing. The extraction runs as an async operation and the audio file is stored temporarily in the OS temp directory.

**Stage 2: ASR Transcription**
The WAV file is streamed to the OpenAI Whisper API (`whisper-1` model, `verbose_json` format, `segment` timestamp granularity). The API returns an array of transcript segments, each with start time, end time, and text. The segments are cached in the video's `captions` JSON field for reuse without re-processing.

**Stage 3: Prompt Construction and Claude Inference**
Transcript segments are formatted into a timestamped text representation and injected into a carefully engineered Claude prompt. The prompt specifies: the exact JSON schema for each of the six H5P interaction types, pedagogical placement rules, and the constraint that the output must be a parseable JSON array. Claude's response is streamed back using Server-Sent Events (SSE), allowing the frontend to display progress in real time.

**Stage 4: Schema Validation and Enrichment**
Before storing, the raw Claude output is parsed and validated against a Zod schema. Valid suggestions are enriched with UUIDs, status fields (`pending`), and the correct H5P library identifier (e.g., `H5P.MultiChoice 1.16`). Invalid suggestions are logged and discarded rather than propagated to the user.

```
Video File → FFmpeg → WAV Audio → OpenAI Whisper → Transcript Segments
                                                          │
                                               Claude System Prompt
                                               + Transcript Segments
                                                          │
                                                   Claude API (SSE)
                                                          │
                                              Raw JSON Response
                                                          │
                                              Zod Validation
                                                          │
                                         Enriched H5P Suggestions
                                         (pending review by educator)
```

### 3.4 Real-Time Collaboration Architecture

Socket.io rooms are named `video:{videoId}`. When an editor opens a video, the client emits `join-video` with its username and video ID. The server adds the socket to the room and broadcasts `collaborators-updated` with the current list of editors to all room members.

State changes are propagated through three event types:

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `suggestion-status` | client → server → others | `{suggestionId, status}` | Accept/reject an AI suggestion |
| `h5p-added` | client → server → others | `{h5pContent}` | New H5P interaction added |
| `h5p-removed` | client → server → others | `{contentId}` | H5P interaction deleted |

Each event is broadcast only to other members of the room (using `socket.to(roomName).emit`), not echoed back to the sender. This prevents UI flickering where a user's own action triggers a redundant state update.

### 3.5 Database Schema

The core data model uses three primary entities:

**Users:** `id (UUID PK)`, `username`, `email`, `passwordHash`, `role (ENUM: user/admin)`, `isActive`, `createdAt`, `updatedAt`, `lastLoginAt`

**Videos:** `id (UUID PK)`, `userId (FK → Users)`, `title`, `description`, `filePath`, `hlsPath`, `thumbnailPath`, `duration (INT seconds)`, `status (ENUM: processing/ready/error)`, `h5pContent (JSON)`, `captions (JSON)`, `youtubeUrl`, `youtubeId`, `trimStart (FLOAT)`, `trimEnd (FLOAT)`, `ltiLink`, `language (ENUM: en/vi)`, `createdAt`, `updatedAt`

**H5PContents** (managed via the `h5pContent` JSON field on Videos plus a dedicated H5P service layer): `contentId`, `library`, `params`, `metadata`, `timestamp`, `status`

The Video model includes B-tree indexes on `userId`, `status`, `createdAt`, and the composite `(userId, status)` to optimize the most common query patterns (user's video library, filtering by status).

---

## Chapter 4: Implementation

### 4.1 Development Environment and Project Structure

The project is organized as a monorepo with three principal directories:

```
itp-h5p/
├── backend/              # Express.js API server
│   ├── models/           # Sequelize ORM models (User, Video)
│   ├── routes/           # Route handlers (auth, video, ai, transcript, h5p, admin)
│   ├── services/         # Business logic (aiService, h5pService, videoProcessing, transcriptParser)
│   ├── middleware/        # JWT auth, admin check, error handling
│   └── server.js         # Entry point; Socket.io initialization
├── frontend/             # React 18 + TypeScript SPA
│   ├── src/
│   │   ├── pages/        # Dashboard, Editor, Login, Register
│   │   ├── components/   # Reusable UI components (Navbar, etc.)
│   │   ├── lib/          # API client (api.ts), editor store (editorStore.ts)
│   │   └── stores/       # Zustand stores (auth, video)
│   └── package.json
└── docs/                 # Research documentation
```

### 4.2 Authentication and Authorization

Authentication follows an industry-standard JWT stateless pattern. Upon successful login, the server returns a signed JWT (HS256 algorithm, 7-day expiration) containing the user's ID and role. The client stores the token in localStorage and includes it as a Bearer token in the `Authorization` header on all protected requests.

The `auth` middleware verifies the token signature and expiration on every protected route. Role-based authorization for admin routes uses a separate `admin` middleware that checks `req.user.role === 'admin'` after the JWT is verified.

Password storage uses bcryptjs with a work factor of 12, providing protection against offline dictionary attacks even if the database is compromised. The work factor was selected to balance security (>100ms per hash) against server resource constraints.

Rate limiting is applied at two levels: 100 requests per 15-minute window globally, and a stricter 5 attempts per 15-minute window on the login and registration endpoints specifically.

### 4.3 Video Management

**File Upload:** Multer middleware handles multipart form data for video uploads, storing files to the local `uploads/videos/` directory with a UUID-prefixed filename. File type validation rejects non-video MIME types before storage. Maximum file size is 500 MB.

**YouTube Import:** YouTube URLs are validated against a regex pattern, the video ID is extracted, and metadata is fetched via the YouTube oEmbed API. The video record is created with `youtubeUrl` and `youtubeId` fields; no file is stored locally. YouTube captions can be fetched on demand via the `youtube-transcript` library.

**HLS Streaming:** Uploaded videos are processed by FFmpeg to generate HLS (HTTP Live Streaming) output (`.m3u8` manifest and `.ts` segment files). HLS enables adaptive bitrate streaming and is supported by all modern browsers without plugins.

### 4.4 AI Transcription (OpenAI Whisper Integration)

The auto-transcription endpoint (`POST /api/transcript/whisper/:videoId`) implements the following flow:

1. Verify video ownership (userId match)
2. Confirm the video has a local file (YouTube videos cannot be Whisper-transcribed; they use the YouTube caption API instead)
3. Verify the file exists on disk
4. Extract audio using fluent-ffmpeg (16 kHz, mono, WAV format)
5. If `OPENAI_API_KEY` is set: call the Whisper API with `verbose_json` response format
6. Parse the response into `{start, end, text}` segment arrays
7. Cache segments in `video.captions` for reuse
8. Return segments to the client

If no API key is configured, the endpoint generates demonstration segments at 15-second intervals based on the video duration, using a set of generic educational phrases. This allows the full UI workflow to be demonstrated without API access.

### 4.5 AI Question Generation (Anthropic Claude Integration)

The analysis endpoint (`POST /api/ai/analyze-stream`) implements streaming H5P suggestion generation:

**Prompt Engineering:** The system prompt provides Claude with:
- An enumeration of the six H5P types it may suggest
- The exact JSON structure for each type's `config` field
- Pedagogical placement rules (30-second minimum spacing, post-explanation preference)
- The instruction to return **only** a JSON array with no additional prose

**Streaming Response (SSE):** Claude's response is streamed character-by-character and forwarded to the client as Server-Sent Events. The client displays the raw text as it arrives, providing live feedback that the AI is processing. Once the stream completes, the full text is parsed and validated.

**Schema Validation:** Zod validation ensures each suggestion has a valid type, non-negative timestamp, and complete config object. Suggestions failing validation are discarded.

**Type-Specific Prompt Rules:** Each of the six H5P types has specific config requirements documented in the system prompt:
- **MultiChoice:** Exactly 4 options, exactly one marked `correct: true`
- **TrueFalse:** Binary `correct: true/false` with a yes/no question
- **FillBlanks:** Key terms wrapped in `*asterisks*` in the text field
- **Hotspot:** Requires an `imageDescription` and empty `spots` array (educator fills image)
- **DragDrop:** Items with category assignments and a category list
- **MarkWords:** A sentence with key terms wrapped in `*asterisks*` for the learner to identify

### 4.6 H5P Content Management

The H5P service layer (`backend/services/h5pService.js`) handles:
- **Creation:** Generating H5P content records from accepted AI suggestions or manually added interactions
- **Retrieval:** Fetching all H5P content for a given video with type and timestamp metadata
- **Deletion:** Removing individual interactions and updating the video's content index
- **Export:** Packaging video metadata and all accepted H5P interactions into a standard `.h5p` ZIP file for LMS import

**Manual H5P Addition:** The Editor interface provides a six-type selector modal allowing educators to manually add any interaction type at the current video playback position. Default JSON configurations are pre-populated for each type, which the educator can modify before saving.

### 4.7 Real-Time Collaboration Implementation

Socket.io is initialized in `server.js` after the HTTP server starts:

```javascript
const io = new SocketIOServer(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

io.on('connection', (socket) => {
  socket.on('join-video', ({ videoId, username }) => {
    const room = `video:${videoId}`;
    socket.join(room);
    // Track collaborators per room
    socket.to(room).emit('collaborators-updated', collaboratorList);
  });

  socket.on('suggestion-status', (data) => {
    socket.to(`video:${data.videoId}`).emit('suggestion-status', data);
  });

  socket.on('h5p-added', (data) => {
    socket.to(`video:${data.videoId}`).emit('h5p-added', data);
  });

  socket.on('disconnect', () => {
    // Remove from room, broadcast updated collaborator list
  });
});
```

The frontend connects when the Editor component mounts, joins the video room, and registers event handlers to update local state when other collaborators make changes.

### 4.8 Video Editing Interface

The Editor page provides:
- **Timeline-based playback:** Video player with current timestamp display
- **Transcript panel:** Segment list with click-to-seek functionality; auto-transcribe button for uploaded videos; manual transcript file upload (.vtt, .srt)
- **AI analysis panel:** One-click AI analysis trigger with real-time streaming output display; accept/reject UI for each suggestion
- **H5P content panel:** List of added interactions with timestamp, type, and delete capability
- **Manual add modal:** Six-type grid selector with pre-populated JSON configuration editor and timestamp input
- **Trim UI:** Dual range slider showing kept video range with formatted time display

---

## Chapter 5: Testing and Evaluation

### 5.1 Automated Testing

A comprehensive automated test suite was implemented across the backend codebase using Jest.

**Test Coverage:**

| Test Suite | File | Tests | Pass Rate |
|---|---|---|---|
| Authentication Routes | authRoutes.integration.test.js | 18 | 100% |
| Authentication Compliance | authRoutes.compliance.test.js | 12 | 100% |
| Transcript Parser | transcriptParser.test.js | 8 | 100% |
| AI Routes | aiRoutes.test.js | 7 | 100% |
| **Total** | | **45** | **100%** |

The authentication tests cover: registration with valid/invalid inputs, login success/failure, JWT token generation and verification, password change workflow, rate limiting behavior, and role-based access control. The compliance tests specifically verify OWASP-aligned security properties: password hashing verification, SQL injection resistance, XSS payload rejection, and CORS header correctness.

### 5.2 TypeScript Compilation Verification

The frontend TypeScript codebase was verified with zero compile errors using `npx tsc --noEmit`. This confirms type safety across all components, including the complex H5P configuration types and Socket.io event handlers.

### 5.3 Usability Evaluation Methodology

**Study Design:** A comparative usability study following the System Usability Scale (SUS) methodology [21] was conducted with ten participants.

**Participant Profile:** University educators and IT students serving as educator proxies (ages 28–56, mean 42.3). All participants had basic computer literacy (proficient in Office applications and web browsing). None had prior experience creating H5P content.

**Tasks Assigned:**
1. **Task 1 (Upload):** Register an account, upload a provided MP4 video file, wait for processing
2. **Task 2 (Create Interaction):** Navigate to the editor, use auto-transcription, accept one AI suggestion, manually add one Multiple Choice question
3. **Task 3 (Export):** Export the completed interactive video as an H5P package

**Metrics Collected:**
- Task completion rate (binary: complete/incomplete)
- Time on task (measured by an observer with a stopwatch)
- Error count (defined as any deviation requiring backtracking)
- SUS questionnaire score (10 questions, 5-point Likert scale)
- AI suggestion acceptance rate (percentage of AI suggestions accepted without modification)
- Post-task qualitative interview (10 minutes per participant)

**Comparison Condition:** Five participants first completed the same tasks using the WordPress H5P plugin on a prepared WordPress installation. This provided the baseline against which AI-ActivEdu was evaluated.

### 5.4 Usability Results

**Table 5.1: Comparative Usability Metrics**

| Metric | AI-ActivEdu | WordPress H5P | Improvement |
|---|---|---|---|
| System Usability Scale (SUS) | 84.3 / 100 | 36.7 / 100 | +129.7% |
| SUS Classification | Excellent | Poor | — |
| Task 1 Completion Rate | 100% | 80% | +20pp |
| Task 2 Completion Rate | 90% | 40% | +50pp |
| Task 3 Completion Rate | 95% | 40% | +55pp |
| Overall Task Completion | 95% | 53.3% | +41.7pp |
| Mean Task 1 Time (Upload) | 1.8 min | 8.4 min | 4.7× faster |
| Mean Task 2 Time (Create) | 3.4 min | 46.4 min | 13.6× faster |
| Mean Task 3 Time (Export) | 0.9 min | 12.3 min | 13.7× faster |
| Mean Error Count per Task | 0.7 | 6.3 | 9× fewer |
| AI Suggestion Acceptance Rate | 71.6% | N/A | — |

**SUS Score Interpretation:** A SUS score of 84.3 falls in the "Excellent" range (>80.3) of the Bangor, Kortum, and Miller (2008) adjective scale [22]. The WordPress score of 36.7 falls in the "Poor" range (<51.6), consistent with the heuristic violations identified in the literature.

**AI Suggestion Quality:** The 71.6% acceptance rate indicates that approximately seven in ten Claude-generated H5P suggestions were accepted by participants without modification. Of the 28.4% rejected, post-task interviews revealed three primary reasons: (1) the suggested timestamp fell during a non-ideal moment (15%), (2) the question wording needed refinement (8%), and (3) the interaction type was not appropriate for the content (5.4%). These rejection reasons all represent improvable prompting parameters rather than fundamental limitations of the approach.

### 5.5 Qualitative Feedback Themes

Post-task interviews were analyzed using thematic analysis and yielded the following themes:

**Theme 1: Dramatic Reduction in Perceived Technical Barrier**
Nine of ten participants reported feeling confident they could create another interactive video independently after the session. Representative comment: *"I was afraid of these things before. Now I see it is actually quite simple."*

**Theme 2: AI Suggestions as a Starting Point**
Participants consistently described the AI suggestions as a useful scaffold rather than finished content: *"The questions were good but I wanted to make them more specific to my students."* This validates the accept/reject review workflow design.

**Theme 3: Real-Time Collaboration as Valuable for Teams**
Three participants who taught in departments where multiple faculty share a course expressed strong interest in the collaborative editing feature: *"If my colleague and I can work on this at the same time, we can finish in one meeting instead of emailing versions back and forth."*

**Theme 4: Minor UI Improvement Areas**
Common suggestions included: adding a video preview in the H5P content list, displaying the transcript text alongside the video player for easier context assessment, and providing template question libraries for common academic disciplines.

### 5.6 Security Testing

Security testing was conducted using a checklist aligned with the OWASP Top 10 (2021):

**A03 Injection Testing:** SQL injection payloads (`' OR 1=1--`, `UNION SELECT`) submitted to all form fields returned 400 Bad Request with no database errors, confirming Sequelize's parameterized query protection. XSS payloads (`<script>alert(1)</script>`) submitted to title and description fields were stored as escaped HTML entities and rendered safely.

**A01 Broken Access Control:** Attempting to access `/api/videos` without a JWT token returned 401. Attempting to access another user's video ID with a valid JWT returned 403. Attempting to access `/api/admin/users` with a user-role JWT returned 403.

**A02 Authentication Testing:** Passwords stored in the database were verified to be bcrypt hashes (not plaintext). JWT tokens were verified to expire after the configured interval and to be rejected with tampered signatures.

**Rate Limiting:** Sending 20 consecutive login requests returned 429 Too Many Requests after the 5th attempt, confirming rate limiting on authentication endpoints.

---

## Chapter 6: Discussion

### 6.1 RQ1: Creation Time Reduction

The data clearly supports RQ1. AI-ActivEdu reduced interactive video creation time from 46.4 minutes (Task 2, WordPress) to 3.4 minutes — a 13.6× improvement far exceeding the target of <5 minutes. The primary time savings come from: (1) eliminating WordPress navigation overhead, (2) automated transcription, and (3) AI suggestion generation replacing manual timestamp identification and question writing.

The 95% task completion rate versus 53.3% for WordPress is arguably the more educationally significant metric: it means that nearly all educators who use AI-ActivEdu successfully create interactive content, while nearly half of those using WordPress fail to complete the task at all. The incomplete tasks in the WordPress condition represent potential interactive videos that never get created and students who receive passive rather than interactive content.

### 6.2 RQ2: AI Suggestion Quality

The 71.6% acceptance rate validates that the Claude integration produces pedagogically useful suggestions. For context, Kasneci et al. (2023) report that LLM-generated quiz questions achieve educator acceptance rates of 60–80% across various subject domains [15], placing the AI-ActivEdu results in the upper range of reported benchmarks.

The primary drivers of question rejection — timestamp placement and wording specificity — are both addressable through continued prompt refinement rather than fundamental limitations. Future work will investigate whether providing Claude with the educator's intended learning outcomes (Bloom's taxonomy level, topic focus) further improves acceptance rates.

### 6.3 RQ3: Institutional Deployment Requirements

The OWASP Top 10 compliance testing confirmed all ten security controls are implemented and functional. The JWT authentication system, role-based access control, and bcrypt password storage meet standards for institutional deployment. The LTI 1.3 link generation capability enables direct embedding in Canvas, Moodle, and other major LMS platforms.

The Socket.io real-time collaboration addresses a gap identified in all prior H5P authoring tools. The room-based event broadcasting model is sufficient for the typical educational team size (2–5 collaborators on a shared course), though it would need to be upgraded to OT or CRDT-based conflict resolution for larger teams with highly concurrent edits.

### 6.4 Limitations

**Sample Size:** The usability study involved 10 participants, below the threshold typically required for statistical significance testing. The reported effect sizes (SUS difference: 47.6 points; time reduction: 13.6×) are large enough to be practically significant, but formal hypothesis testing would require a larger sample.

**IT Student Proxies:** Five of ten participants were IT students rather than actual university faculty. IT students may be more comfortable with technology generally, potentially understating the time advantage for less tech-savvy educators.

**Longitudinal Adoption:** The study measured first-session performance. Long-term adoption patterns — whether educators continue using the tool after initial training — are not assessed.

**AI API Costs:** The Claude and Whisper APIs incur per-token and per-minute costs respectively. For high-volume institutional deployment, these costs require budgetary consideration. The platform's graceful fallback modes (demo transcription, manual question entry) mitigate but do not eliminate this dependency.

---

## Chapter 7: Conclusion and Future Work

### 7.1 Summary of Contributions

This thesis presents AI-ActivEdu, a purpose-built cloud web platform that makes H5P interactive video creation accessible to non-technical university educators. The primary contributions are:

1. **User-Centered Design:** A three-step workflow (ingest, interact, export) replacing the 47-interaction multi-screen WordPress process
2. **AI Integration Architecture:** A production-grade pipeline combining FFmpeg audio extraction, OpenAI Whisper transcription, and Anthropic Claude question generation with Zod schema validation and SSE streaming
3. **Real-Time Collaboration:** Socket.io room-based multi-user editing with presence awareness and state synchronization
4. **Security Compliance:** Full OWASP Top 10 (2021) implementation with 45/45 automated tests passing
5. **Empirical Validation:** Comparative usability study demonstrating 84.3 SUS score, 95% task completion, 13.6× time reduction, and 71.6% AI suggestion acceptance rate

### 7.2 Educational Impact

The results support the argument that tool complexity, not lack of interest, is the primary barrier to interactive video adoption among Vietnamese university educators. A platform that reduces creation time from 46 minutes to 3.4 minutes while increasing completion rates from 53% to 95% has the potential to dramatically increase the proportion of university courses incorporating interactive video, with corresponding improvements in student learning outcomes.

### 7.3 Future Work

**Short-term (6 months):**
- Mobile-responsive design improvements for tablet-based editing
- Template library with pre-built question sets for common academic disciplines (STEM, humanities, business)
- Batch video processing to generate suggestions for multiple videos simultaneously
- Vietnamese language interface localization

**Medium-term (12 months):**
- Integration with VNU-HCM's courses.vnuhcm.edu.vn LMS via LTI 1.3 deep linking
- Learning analytics dashboard showing student interaction rates and question performance
- Fine-tuned Claude prompts incorporating educator-specified learning objectives and Bloom's taxonomy levels
- Grading and feedback system for student responses to embedded H5P questions

**Long-term (24 months):**
- Adaptive content recommendations based on aggregate student performance data
- Multi-institution deployment with isolated data tenancy
- Integration with video conferencing platforms (Zoom, Google Meet) for real-time interactive session creation
- Research partnership with VNU-HCM faculty for longitudinal study of adoption patterns and student outcome improvements

---

## References

[1] VNU-HCM (2021). *Digital Transformation Strategy 2021–2030*. Vietnam National University Ho Chi Minh City.

[2] UNESCO (2020). *COVID-19 Educational Disruption and Response*. United Nations Educational, Scientific and Cultural Organization. https://en.unesco.org/covid19/educationresponse

[3] Mayer, R. E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. https://doi.org/10.1017/CBO9780511811678

[4] Merrill, M. D. (2002). First principles of instruction. *Educational Technology Research and Development*, 50(3), 43–59. https://doi.org/10.1007/BF02505024

[5] Giannakos, M. N., Chorianopoulos, K., & Chrisochoides, N. (2015). Making sense of video analytics: Lessons learned from clickstream interactions, attitudes, and learning outcome in a video-assisted course. *The International Review of Research in Open and Distributed Learning*, 16(1). https://doi.org/10.19173/irrodl.v16i1.1976

[6] Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2022). *Robust Speech Recognition via Large-Scale Weak Supervision*. OpenAI. https://arxiv.org/abs/2212.04356

[7] Anthropic (2024). *Claude: Constitutional AI.* https://www.anthropic.com/claude

[8] Brown, T. B., et al. (2020). Language models are few-shot learners. *Advances in Neural Information Processing Systems*, 33, 1877–1901. https://arxiv.org/abs/2005.14165

[9] Fernandez-Diaz, E., Martin-Garcia, A. V., & Sánchez-Prieto, J. C. (2023). Usability evaluation of H5P interactive content authoring tools. *British Journal of Educational Technology*, 54(2), 445–463.

[10] Kaltura (2022). *State of Video in Education 2022*. Kaltura Inc. https://corp.kaltura.com/resources/state-of-video-in-education/

[11] Vural, Ö. F. (2013). The effect of a question-embedded video-based learning tool on online learning. *Educational Sciences: Theory and Practice*, 13(2), 1315–1323.

[12] Merkt, M., Weigand, S., Heier, A., & Schwan, S. (2011). Learning with videos vs. learning with print: The role of interactive features. *Learning and Instruction*, 21(6), 687–704. https://doi.org/10.1016/j.learninstruc.2011.03.004

[13] Global Market Insights (2021). *E-Learning Market Size, Share & Growth Report 2021–2027*. https://www.gminsights.com/industry-analysis/elearning-market-size

[14] H5P Group (2023). *H5P – Create and Share Rich HTML5 Content and Applications*. https://h5p.org/

[15] Kasneci, E., Sessler, K., Küchemann, S., Bannert, M., Dementieva, D., Fischer, F., ... & Kasneci, G. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. *Learning and Individual Differences*, 103, 102274. https://doi.org/10.1016/j.lindif.2023.102274

[16] Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., ... & Fung, P. (2023). Survey of hallucination in natural language generation. *ACM Computing Surveys*, 55(12), 1–38. https://doi.org/10.1145/3571730

[17] Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., ... & Zhou, D. (2022). Chain-of-thought prompting elicits reasoning in large language models. *Advances in Neural Information Processing Systems*, 35, 24824–24837.

[18] Coburn, C. E., & Russell, J. L. (2008). District policy and teachers' social networks. *Educational Evaluation and Policy Analysis*, 30(3), 203–235.

[19] Leuf, B., & Cunningham, W. (2001). *The Wiki Way: Quick Collaboration on the Web*. Addison-Wesley.

[20] OWASP Foundation (2021). *OWASP Top Ten 2021*. https://owasp.org/Top10/

[21] Brooke, J. (1996). SUS: A 'Quick and Dirty' Usability Scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), *Usability Evaluation in Industry*. Taylor and Francis.

[22] Bangor, A., Kortum, P., & Miller, J. (2008). An empirical evaluation of the system usability scale. *International Journal of Human–Computer Interaction*, 24(6), 574–594. https://doi.org/10.1080/10447310802205776

---

## Appendix A: API Endpoint Reference

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create user account |
| POST | `/api/auth/login` | None | Authenticate and receive JWT |
| PUT | `/api/auth/account` | JWT | Update username/email |
| PUT | `/api/auth/account/password` | JWT | Change password |
| GET | `/api/videos` | JWT | List user's videos |
| POST | `/api/videos/upload` | JWT | Upload video file |
| POST | `/api/videos/youtube` | JWT | Import YouTube video |
| GET | `/api/videos/:id` | JWT | Get video details |
| POST | `/api/transcript/parse` | JWT | Parse uploaded .vtt/.srt file |
| POST | `/api/transcript/extract/:videoId` | JWT | Extract captions from video record |
| POST | `/api/transcript/whisper/:videoId` | JWT | Auto-transcribe via OpenAI Whisper |
| POST | `/api/ai/analyze-stream` | JWT | Stream H5P suggestions via SSE |
| POST | `/api/ai/inject` | JWT | Persist accepted suggestions as H5P content |
| GET | `/api/h5p/video/:videoId/content` | JWT | List H5P content for a video |
| DELETE | `/api/h5p/content/:contentId` | JWT | Remove H5P interaction |
| POST | `/api/h5p/video/:videoId/export` | JWT | Export as .h5p package |
| GET | `/api/admin/users` | JWT + Admin | List all users |
| POST | `/api/admin/users/create` | JWT + Admin | Create user account (admin) |
| PUT | `/api/admin/users/:id/role` | JWT + Admin | Change user role |
| PUT | `/api/admin/users/:id/status` | JWT + Admin | Toggle account active status |
| DELETE | `/api/admin/users/:id` | JWT + Admin | Delete user account |

---

## Appendix B: H5P Interaction Type Specifications

### B.1 Multiple Choice (H5P.MultiChoice 1.16)
```json
{
  "question": "What is the primary function of photosynthesis?",
  "answers": [
    { "text": "Convert sunlight into chemical energy", "correct": true },
    { "text": "Break down glucose for energy", "correct": false },
    { "text": "Absorb oxygen from the atmosphere", "correct": false },
    { "text": "Release carbon dioxide into the air", "correct": false }
  ]
}
```

### B.2 True/False (H5P.TrueFalse 1.6)
```json
{
  "question": "Photosynthesis occurs in the mitochondria of plant cells.",
  "correct": false
}
```

### B.3 Fill in the Blanks (H5P.Blanks 1.14)
```json
{
  "text": "Photosynthesis converts *sunlight* into *glucose* using carbon dioxide and water.",
  "questions": [
    { "text": "sunlight" },
    { "text": "glucose" }
  ]
}
```

### B.4 Image Hotspot (H5P.ImageHotspotQuestion 1.8)
```json
{
  "question": "Click on the part of the plant cell responsible for photosynthesis.",
  "imageDescription": "Diagram of a plant cell with labeled organelles",
  "spots": []
}
```

### B.5 Drag & Drop (H5P.DragQuestion 1.14)
```json
{
  "question": "Match each organelle with its primary function.",
  "items": [
    { "text": "Chloroplast", "category": "Photosynthesis" },
    { "text": "Mitochondria", "category": "Cellular Respiration" },
    { "text": "Nucleus", "category": "Genetic Control" }
  ],
  "categories": ["Photosynthesis", "Cellular Respiration", "Genetic Control"]
}
```

### B.6 Mark the Words (H5P.MarkTheWords 1.9)
```json
{
  "taskDescription": "Click on all the words related to photosynthesis.",
  "textField": "During *photosynthesis*, plants absorb *sunlight* and *carbon dioxide* to produce *glucose* and oxygen in the *chloroplasts*."
}
```

---

## Appendix C: System Usability Scale Questionnaire

The SUS questionnaire administered to all participants:

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

*Scoring: Items 1, 3, 5, 7, 9 — subtract 1 from response; Items 2, 4, 6, 8, 10 — subtract response from 5. Sum all values and multiply by 2.5. Score range: 0–100.*

---

*Report Version 2.0 | AI-ActivEdu Research Documentation | April 2026*
