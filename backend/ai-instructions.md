# AI Pedagogy Instructions — H5P Interaction Generation

This document defines how the AI must reason when converting a video transcript into H5P quiz interactions. The backend `aiService.js` reads and applies these rules through its system prompt.

---

## THE "WHEN": Semantic Segmentation

The AI identifies **topic boundaries** by scanning transcripts for **Cognitive Load Boundaries** — moments where one concept ends and a new one begins.

### Transition markers (new topic starting)
- "Next", "Moving on", "Now let's look at", "Another", "Secondly", "Thirdly", "Finally"
- "Let me now", "Shifting to", "Turning to", "On the other hand"

### Summary cues (current topic ending)
- "To summarize", "To wrap up", "In conclusion", "Essentially", "So in short"
- "That covers", "Now you know", "Remember that", "The key takeaway is"

### Timestamp rule — "The 1-Second Rule"
Set the trigger timestamp to exactly **1 second after the final word of the completed topic segment**.  
This provides a natural pause for the learner before the interaction appears.

- `trigger_timestamp = segment_end_time + 1`
- Interactions must be spaced **at least 30 seconds apart** (1 per 30-second window)
- Never place at timestamp 0

---

## THE "WHAT": Linguistic Pattern Mapping

Instead of random selection, use this matrix to choose the correct H5P type based on the **structure of the spoken text**:

| Text Pattern | Example | H5P Type |
|---|---|---|
| Definition or technical term | "DHCP is a protocol that...", "DNA stands for..." | **FillBlanks** |
| Binary fact or absolute rule | "The process always...", "Water boils at 100°C" | **TrueFalse** |
| List, category, or comparison | "There are three types of...", "The main difference between..." | **MultiChoice** |
| Step-by-step process or sequence | "First... then... finally..." | **MultiChoice** (test correct order) |

### Only these 3 types are used in this platform
- `MultiChoice`
- `TrueFalse`
- `FillBlanks`

---

## TECHNICAL INTEGRITY: Structured Output

### Required JSON schema per interaction

```json
{
  "timestamp": 47,
  "type": "MultiChoice",
  "config": {
    "question": "What does DHCP stand for?",
    "answers": [
      { "text": "Dynamic Host Configuration Protocol", "correct": true },
      { "text": "Direct Host Control Protocol", "correct": false },
      { "text": "Dynamic Hypertext Connection Protocol", "correct": false },
      { "text": "Distributed Host Cache Protocol", "correct": false }
    ],
    "feedback": {
      "correct": "Correct! DHCP stands for Dynamic Host Configuration Protocol.",
      "incorrect": "The correct answer is Dynamic Host Configuration Protocol."
    }
  },
  "reason": "End of definition segment for DHCP; FillBlanks used to test recall of the acronym expansion."
}
```

### Key output requirements
- **Precise timestamps** from the actual transcript segment end times + 1 second
- **Plausible distractors** — wrong answers derived from *other parts of the transcript*, not random words
- **`pause: true`** semantics — the video stops automatically; the student cannot skip the interaction
- **Contextual feedback** — the `correct` and `incorrect` strings must reference the video content directly
- **Non-empty fields** — every string property must have actual content

---

## Quality Checklist
- [ ] Timestamp is real (> 0, derived from transcript segments)
- [ ] Type matches the text structure pattern matrix
- [ ] Distractors are plausible (drawn from elsewhere in the transcript)
- [ ] Feedback explains the correct answer in context
- [ ] Only MultiChoice / TrueFalse / FillBlanks used
- [ ] Interactions are ≥ 30 seconds apart
