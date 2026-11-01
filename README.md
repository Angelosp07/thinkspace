# Thinkspace

A conversational 3D workspace: speak ideas, edit Markdown nodes, explore scenarios and generate editable plans.

## Run

Node 22+; no dependencies to install.

```sh
npm run dev
```

Open http://localhost:3000. OPENAI_API_KEY is read server-side from the ignored .env.local file. Optional OPENAI_MODEL defaults to gpt-5-mini. Never expose the key in browser code. The provisioned development key expires after 24 hours.

## Try it

Start blank and describe an idea, or load the illustrative food-service sample. Select nodes to edit Markdown and JSON properties. Ask “What if delivery costs rise to £6?” to preview a scenario, then Apply or Discard. Create an editable plan. JSON export preserves the project; Markdown import adds a sourced node. Local browser storage persists the current project.

One Talk control uses browser speech recognition where supported; other browsers transcribe successive 4.5-second audio segments. Typed input always works. Live speech in the browser recognition path updates after completed speech segments; MediaRecorder mode updates automatically as segments are transcribed. Provisional concepts appear during interim browser recognition and are replaced by saved AI interpretations. Speech is queued during AI work. Optional spoken answers use the browser voice engine.

## Verification

```sh
npm test
npm run build
npm run validate
```

Tests check contribution-margin calculations, immutable scenarios, duplicate imports, missing inputs, question isolation and routes.

## Limits

This is a first working build. Demo mode uses a deliberately labelled scripted parser. The financial calculator supports a specific platform contribution-margin model, not arbitrary business simulation or net profit. Graph uses software-projected XYZ geometry with orbit/zoom; labels can overlap on dense graphs. Project data stays in browser storage; there is no multi-user sync. Full context is sent for small projects (150 nodes maximum). Live AI may propose imperfect dependencies: inspect explanations and inputs. Image generation and Decisions classification are not yet wired. The app is not yet verified on all microphone/browser combinations.

## Built today / Codex

Created during the 1 November 2026 hackathon. Codex implemented graph rendering, node editing, voice/text routing, server-side Responses integration, scenario isolation, contribution calculations, plan artifacts, persistence, import/export and regression checks. Concrete contribution: Codex wrote tests proving hypothetical cost changes leave the saved baseline unchanged.

## Credits

OpenAI Sites Worker ESM starter supplied build/validation scaffolding. Uses browser Canvas and speech APIs; no third-party graph assets. Sample numbers and business assumptions are illustrative.
