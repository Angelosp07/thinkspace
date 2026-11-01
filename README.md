# Thinkspace

A conversational 3D workspace: speak ideas, edit Markdown nodes, explore scenarios and generate editable plans.

## Run

Node 22+; no dependencies to install.

```sh
npm run dev
```

Open http://localhost:3000. OPENAI_API_KEY is read server-side from the ignored .env.local file. Optional OPENAI_MODEL defaults to gpt-5-mini. Never expose the key in browser code. The provisioned development key expires after 24 hours.

## Try it

Start blank and speak an idea, or choose **Watch an example** to see the growing canvas. **Create**, **Advice**, and **Edit** indicate what you want to do. Click a sphere for its floating Markdown document; edit the note directly or download it as `.md`. Edit by voice focuses changes on the selected saved concept.

**Advice** answers questions without changing your saved model. Choose **Evaluate my idea**, or explicitly ask for an evaluation, to add amber concern spheres. Each concern explains the evidence, unknowns, possible implications and a small test. This review is stored separately from the baseline and can be hidden. Changes to the baseline clear the old review. JSON export contains the baseline; individual concern notes can be downloaded as Markdown.

Ask “Are we meeting our contribution margin target?” for a deterministic calculation and input highlights. Ask “What if delivery costs rise to £6?” for an isolated scenario, then Apply or Discard. The Project menu includes sample data, a pilot-plan action, import/export and a new canvas. Replacing the canvas is reversible with Undo.

## Speech to conceptual model

Interim speech → tentative noun mentions and labelled relationship stems → contextual AI interpretation → identity reconciliation → saved concepts. Analysis is a separate, requested layer.

- Browser speech recognition is preferred where supported, so tentative spheres can appear as interim words arrive. Other browsers transcribe successive three-second audio segments; their previews begin when a transcript arrives. Typed input also previews concepts before Send.
- Immediate previews use a lightweight English noun-chunk recognizer. They are approximate, marked “forming”, and never sent as graph context, persisted or exported. Recognition corrections remove tentative mentions. Compound names can grow on the same sphere. The AI confirms, merges or replaces mentions; additional useful inferred concepts may emerge after interpretation.
- Spheres ease into view and labelled lines grow between them. A spoken relationship can start as a labelled stem before its target is mentioned. Matching concepts preserve their visual position through confirmation. Reduced-motion preferences are respected.
- Saved nodes contain a kind, summary, aliases, responsibilities and typed attribute definitions. Known values live separately in `properties`. Scalar details belong inside their owning concept.
- Edges retain association, composition, aggregation, generalization, dependency or constraint metadata, a domain verb, optional multiplicities and stated/inferred provenance. The canvas presents labelled directional lines; this is a conceptual workspace, not a full UML diagram editor.
- Both browser and worker use the same validation and edit functions. Exact, unambiguous titles/aliases provide identity reconciliation; duplicate deltas for one ID are consolidated. Unknown endpoints reject a delta. Ask/clarify cannot apply edits. Advice can only create concern overlays. Edit only changes the selected existing node. A result based on an obsolete project revision is rejected.
- Speech queues preserve their mode, selected node and project session. Hypothetical scenarios pause the queue until applied or discarded. Version 1 projects continue to load with defaults for new metadata.

For example, “a marketplace connecting students with restaurants that have surplus food” progressively reveals Marketplace, Students, Restaurants and Surplus food, with connects/has links. “Reservations have a pickup time” adds a detail to Reservation after interpretation. Potential concerns such as demand, affordability or profitability appear when evaluation is requested.

## Verification

```sh
npm test
npm run build
npm run validate
```

Tests check incremental entity mentions and relationship stems, identity reconciliation, attributes, mode boundaries, evaluation isolation, focused edits, context-preserving speech queues, backward compatibility, browser/server parity, deterministic financial scenarios and routes.

Optional live semantic check (uses the configured API key and sends only synthetic examples): `node scripts/eval-model.mjs`. The Create/Advice/Edit contract check is `node scripts/eval-voice.mjs`.

## Limits

This is a first working build. Demo mode supports a deliberately bounded restaurant/reservation example; unsupported statements ask for Live AI instead of being split into phrase-nodes. The financial calculator supports a specific platform contribution-margin model, not arbitrary business simulation or net profit. Graph uses software-projected XYZ geometry with orbit/zoom, sphere separation and curved relationship routing; dense graphs can still overlap. Interim extraction is an English heuristic; live semantic interpretation can still be imperfect. Microphone capture requires browser support and permission; physical microphone behavior has not been verified in this update. Project data stays in browser storage; there is no multi-user sync. Full context is sent for small projects (150 nodes maximum). Live AI may propose imperfect dependencies: inspect explanations and inputs. Image generation and Decisions classification are not yet wired. The app is not yet verified on all microphone/browser combinations.

## Built today / Codex

Created during the 1 November 2026 hackathon. Codex implemented graph rendering, node editing, voice/text routing, server-side Responses integration, scenario isolation, contribution calculations, plan artifacts, persistence, import/export and regression checks. Concrete contribution: Codex wrote tests proving hypothetical cost changes leave the saved baseline unchanged.

## Credits

OpenAI Sites Worker ESM starter supplied build/validation scaffolding. Uses browser Canvas and speech APIs; no third-party graph assets. Sample numbers and business assumptions are illustrative.
