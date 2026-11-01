# Thinkspace

A conversational 3D workspace: speak ideas, edit Markdown nodes, explore scenarios and generate editable plans.

## Run

Node 22+; no dependencies to install.

```sh
npm run dev
```

Open http://localhost:3000. OPENAI_API_KEY is read server-side from the ignored .env.local file. Optional OPENAI_MODEL defaults to gpt-5.4-mini. Never expose the key in browser code. The provisioned development key expires after 24 hours.

## Try it

Start blank and speak an idea to see the growing canvas. **Create**, **Advice**, and **Edit** indicate what you want to do. Click a sphere for its floating Markdown document; edit the note directly or download it as `.md`. Edit by voice focuses changes on the selected saved concept.

**Advice** answers questions without changing your saved model. Choose **Evaluate my idea**, or explicitly ask for an evaluation, to add amber concern spheres. Each concern explains the evidence, unknowns, possible implications and a small test. This review is stored separately from the baseline and can be hidden. Changes to the baseline clear the old review. JSON export contains the baseline; individual concern notes can be downloaded as Markdown.

Ask “Are we meeting our contribution margin target?” for a deterministic calculation and input highlights. Ask “What if delivery costs rise to £6?” for an isolated scenario, then Apply or Discard. The Project menu includes sample data, a pilot-plan action, import/export and a new canvas. Replacing the canvas is reversible with Undo.

## Speech to conceptual model

Interim speech → tentative noun mentions and labelled relationship stems → contextual AI interpretation → identity reconciliation → saved concepts. Analysis is a separate, requested layer.

- Speech recognition uses OpenAI Realtime transcription (`gpt-live-transcribe`) over WebRTC. The browser only captures audio, measures microphone levels, detects pauses and draws the canvas. Transcript deltas update forming spheres while you speak; completed segments enter the ordered conceptual interpretation queue. The server relays the SDP handshake and keeps the API key private. Medium transcription delay gives a little more audio context, and saved concept names/aliases are supplied as vocabulary hints at connection time. There is no browser speech-recognition or recording-chunk fallback.
- Click **Start talking**, allow microphone access, and wait for **Listening · speak now**. Click **Stop talking** to turn the microphone off. During setup, **Cancel connection** cancels immediately; **Finishing…** indicates the microphone is off while the last words arrive. The microphone, idea-processing and image-generation indicators are independent. The input meter shows whether audio is reaching the app. Pauses of about 1.1 seconds commit utterances; continuous speech commits at 20 seconds. **Stop talking** keeps the connection open briefly to receive the last words. Connection failures are visible; unfinished words stay in the input for review. Typed input also previews concepts before Send.
- Immediate previews use a lightweight English noun-chunk recognizer. They are approximate, marked “forming”, and never sent as graph context, persisted or exported. Recognition corrections remove tentative mentions. Compound names can grow on the same sphere. The AI confirms, merges or replaces mentions; additional useful inferred concepts may emerge after interpretation.
- Spheres ease into view and labelled lines grow between them. A spoken relationship can start as a labelled stem before its target is mentioned. Matching concepts preserve their visual position through confirmation. Reduced-motion preferences are respected.
- Saved nodes contain a kind, summary, aliases, responsibilities and typed attribute definitions. Known values live separately in `properties`. Scalar details belong inside their owning concept.
- Edges retain association, composition, aggregation, generalization, dependency or constraint metadata, a domain verb, optional multiplicities and stated/inferred provenance. The canvas presents labelled directional lines; this is a conceptual workspace, not a full UML diagram editor.
- Both browser and worker use the same validation and edit functions. Exact, unambiguous titles/aliases provide identity reconciliation; duplicate deltas for one ID are consolidated. Unknown endpoints reject a delta. Ask/clarify cannot apply edits. Advice can only create concern overlays. Edit changes the selected existing node, with an identity-merge exception: a confirmed duplicate can merge into an existing canonical concept. Matching names/declared aliases reconcile after manual edits; AI can identify a same-concept correction through an explicit source/target merge. Similarity alone is not identity. Merges retain both notes, aliases, responsibilities and incoming/outgoing connections, deduplicate repeated edges, remove merge-created self-links, and remap document dependencies and queued selections. Conflicting property values are documented and unset until resolved. Undo restores the pre-merge graph. Project → Merge duplicate concepts repairs previously saved exact-name duplicates of the same kind. A result based on an obsolete project revision is rejected.
- Long thoughts can produce up to 30 changed concepts, without the old six-concept instruction or twelve-preview cutoff. IDs are constrained to safe ASCII in the response schema while display names retain accents.
- Speech queues preserve their mode, selected node and project session. If interpretation fails, the thought remains visible and later speech waits behind it. **Retry unsaved thought** resumes in order. Finalized speech and unfinished work are saved with the matching baseline for recovery after reload; **Project → Download captured speech** exports the latest 300 finalized segments locally. Unconfirmed partial speech still needs review in the input. Hypothetical scenarios pause the queue until applied or discarded. Version 1 projects continue to load with defaults for new metadata.

For example, “a marketplace connecting students with restaurants that have surplus food” progressively reveals Marketplace, Students, Restaurants and Surplus food, with connects/has links. “Reservations have a pickup time” adds a detail to Reservation after interpretation. Potential concerns such as demand, affordability or profitability appear when evaluation is requested.

## Appearance

A dark workspace with soft blue controls and pastel pink accents. Floating panels use quiet borders, restrained shadows and clear status treatments. A compact icon rail sits at the left edge; its More button reveals secondary navigation controls. The popover closes with Escape or a click outside.

## Navigate the graph

Drag to rotate a full 360° horizontally or vertically. Choose **Pan**, hold **Shift** while dragging, or use the four direction buttons to move around. The wheel/pinch gesture zooms around your cursor; two-finger touch also pans. **+ / −** adjust zoom, **Fit graph** shows all concepts, **Reset** restores the default angle, and **Focus** centers the selected concept. With the canvas focused, arrows pan, Shift+arrows rotate, +/- zoom, F fits and R resets.

Use the arrow at the top right of the bottom card to collapse/expand it. The collapsed card retains microphone status and a Start/Stop button, and the preference survives reloads. Fitting uses the newly available canvas area. Camera actions do not edit saved concepts or relationships. Layout follows connections in a spherical 3D volume: springs act along all three axes, one-connection concepts sit on the outer side of their parent, and disconnected components are packed as separate spatial groups. Leaf placement avoids other spheres and softens front-view label overlap without flattening the graph. Relationship changes update placement; movement eases into place. Positions are display-only. Any particular viewing angle can still produce overlap.

## Sphere illustrations

Confirmed concepts automatically receive an illustration from `gpt-image-2.5-flare` at `quality: medium` (optional server override: `IMAGE_MODEL`). All missing illustrations start concurrently, including newly added concepts while other requests are running. The browser reduces each compressed JPEG to a 256px thumbnail and fades it into the sphere. Draft mentions and unapplied scenario nodes do not trigger generation. There is no automatic retry or more expensive model fallback.

Thumbnails are cached separately in IndexedDB by style/quality version, model, kind and normalized title. Repeated speech/detail edits reuse them; changing a title/kind requests a new illustration. The server also shares concurrent identical requests and keeps a bounded memory cache. Images are not graph facts, AI context or part of JSON exports. Clearing browser storage can require regeneration. **Project → Illustrate spheres** pauses new image jobs; a failed image shows a retry button and error detail on hover. A pending request can finish after pausing.

## Verification

```sh
npm test
npm run build
npm run validate
```

Tests check incremental entity mentions and relationship stems, identity reconciliation, attributes, mode boundaries, evaluation isolation, focused edits, context-preserving speech queues, streaming deltas and ordered completions, stop/drain behavior, server-only authentication and SDP relay errors, backward compatibility, browser/server parity, deterministic financial scenarios and routes.

Optional live semantic check (uses the configured API key and sends only synthetic examples): `node scripts/eval-model.mjs`. The Create/Advice/Edit contract check is `node scripts/eval-voice.mjs`. Long-dictation concept coverage and retention are checked by `node scripts/eval-capture.mjs`. A synthetic spoken identity correction is checked by `node scripts/eval-merge.mjs`.

## Limits

This is a first working build. Demo mode supports a deliberately bounded restaurant/reservation example; unsupported statements ask for Live AI instead of being split into phrase-nodes. The financial calculator supports a specific platform contribution-margin model, not arbitrary business simulation or net profit. Graph uses software-projected XYZ geometry with full rotation, panning, zoom and curved relationship routing; dense graphs and edge-on views can still overlap. Interim extraction is an English heuristic; live semantic interpretation can still be imperfect. Microphone capture requires browser support and permission; physical microphone behavior has not been verified in this update. Project data stays in browser storage; there is no multi-user sync. Full context is sent for small projects (150 nodes maximum). Live AI may propose imperfect dependencies: inspect explanations and inputs. Illustrations are decorative 2D images with a miniature clay style, not editable 3D models. Decisions classification is not yet wired. The app is not yet verified on all microphone/browser combinations.

## Built today / Codex

Created during the 1 November 2026 hackathon. Codex implemented graph rendering, node editing, voice/text routing, server-side Responses integration, scenario isolation, contribution calculations, plan artifacts, persistence, import/export and regression checks. Concrete contribution: Codex wrote tests proving hypothetical cost changes leave the saved baseline unchanged.

## Credits

OpenAI Sites Worker ESM starter supplied build/validation scaffolding. Uses OpenAI Responses and Realtime transcription with browser Canvas, WebRTC and microphone APIs; no third-party graph assets. Sample numbers and business assumptions are illustrative.
