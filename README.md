# Thinkspace

**Speak an idea and watch it become an editable, connected 3D model.** Thinkspace extracts conceptual entities and relationships, lets you inspect their Markdown notes, evaluates a plan on request, and explores scenarios without overwriting the saved idea.

This README is the complete local setup and judging guide. The app runs in a browser; **Codex, ChatGPT Desktop, Docker, a database, and a hosted deployment are not required**.

## Quick start for judges

### 1. Prerequisites

- **Node.js 22 or newer, with npm.** [Download Node.js](https://nodejs.org/en/download). Verified locally with Node **26.7.0** and npm **11.19.0**.
- Git to clone the repository, or download and extract the repository ZIP.
- A browser with microphone and WebRTC support for voice input. Allow microphone access when prompted. Typed input also works.
- For **Live AI**: an internet connection and an OpenAI API key with available API quota and access to the models listed below. No key is included in this repository.

Check the installed tools:

```sh
node --version
npm --version
```

### 2. Get the project

```sh
git clone https://github.com/Angelosp07/thinkspace.git
cd thinkspace
```

Run all subsequent commands from this folder, which contains `package.json`. There are **no npm dependencies to install** and no build step is needed to run locally.

### 3. Configure Live AI

Create a plain-text file named **`.env.local`** next to `package.json`, and add:

```dotenv
OPENAI_API_KEY=replace_with_your_own_openai_api_key
```

Replace the placeholder with your actual key. See the [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart) for key setup. This file is ignored by Git and read only by the local server. Do not place the key in the browser's input box or commit it. The developer's temporary credentials are not part of the submission.

For a review without an API key, skip this step and follow [Review without an API key](#review-without-an-api-key) after starting the server.

### 4. Start the server

**macOS / Linux / Git Bash:**

```sh
PORT=3001 npm run dev
```

**Windows PowerShell:**

```powershell
$env:PORT = "3001"
npm run dev
```

Expected Terminal output:

```text
Thinkspace: http://localhost:3001
```

Open **[http://localhost:3001/](http://localhost:3001/)** on the same computer. Keep Terminal open while using the app. Press **Ctrl+C** in that Terminal to stop it.

`npm run dev` without a port setting defaults to **3000**, so use the address printed by the server. The app binds to `127.0.0.1`; opening it through a LAN address is not part of this local setup.

After changing source code or `.env.local`, stop and restart the server, then refresh the browser. There is no automatic hot reload.

### 5. Check readiness

- With a key configured, the app should show **Live AI** and **Ready for your idea**.
- Click **Start talking**, allow microphone access, and wait for **Listening · speak now** before speaking. Click **Stop talking** to finish. **Finishing…** means the mic is off while the final transcript arrives.
- The microphone meter should move when you speak. The idea-processing and illustration indicators update separately; illustrations can finish later than the graph.
- [http://localhost:3001/api/status](http://localhost:3001/api/status) shows configuration and model names without revealing the key. `configured: true` means a key was found; it does **not** verify model access, quota or authentication. The first live request checks those in practice.

## Models and configuration

| Setting | Default / purpose |
| --- | --- |
| `OPENAI_API_KEY` | Required for live speech, interpretation and generated images. Read from `.env.local` or the server environment. |
| `OPENAI_MODEL` | Optional; defaults to `gpt-5.4-mini` for conceptual interpretation through the Responses API. |
| `IMAGE_MODEL` | Optional; defaults to `gpt-image-2.5-flare` for sphere illustrations, using medium quality. |
| Speech model | `gpt-live-transcribe` over Realtime WebRTC. Currently configured in `transcriptionSession()` in `worker/index.js`, not through an environment variable. |
| `PORT` | Optional **shell environment** setting; defaults to `3000`. Set it in the start command, not in `.env.local`. |

Only `OPENAI_API_KEY` needs to be added for the default setup. Model access depends on the configured account; the app does not automatically substitute another model. Overrides must support the API parameters used in `worker/index.js`.

Live features use the configured account's API quota and may incur charges. **Project → Illustrate spheres** can be switched off before creating concepts to avoid image-generation requests. Images are optional: the graph, speech and notes work without them. Image jobs start concurrently, so a larger new graph can make several requests at once.

## Live judging walkthrough

Use **Live AI** for the full experience. Start with an empty canvas; if an older local idea is visible, use **Project → New canvas**. Speak or type each prompt below. Wait for the current thought to finish processing before proceeding to the next step; you do not need to wait for every image to finish.

### 1. Build the idea — Create mode

> I'm building a marketplace connecting students with restaurants that have surplus food. Students get cheaper meals, and restaurants recover money from food they would otherwise waste. We're considering delivery and campus collection.

Expect conceptual spheres and labelled connections, rather than one node per sentence. “Forming” spheres are provisional; the AI may refine or merge them when the transcript settles. Click a saved sphere to read its Markdown document.

### 2. Add concrete assumptions — stay in Create

> For an illustrative calculation, assume each basket costs twenty pounds. We take a twenty percent commission and charge two pounds for delivery. The courier costs us four pounds per order, payment processing costs fifty pence, and we pay no restaurant subsidy. Our target is a twenty percent contribution margin on platform revenue.

These are illustrative assumptions, not researched market data. Numerical values should be stored with their owning concepts.

### 3. Ask a grounded question — Advice mode

> Are we meeting our contribution margin target? Show me the calculation and highlight the relevant nodes.

The app's deterministic calculator should show:

| Calculation | Expected result |
| --- | --- |
| Platform revenue | £20 × 20% + £2 = **£6.00** |
| Variable cost | £4 courier + £0.50 processing + £0 subsidy = **£4.50** |
| Contribution profit | £6 − £4.50 = **£1.50 per order** |
| Contribution margin | £1.50 ÷ £6 = **25%**, above the 20% target |

If an input is missing, the app should report it rather than invent a number. Repeat the assumptions in Create mode, or use the sample project below to check the calculator independently of speech recognition.

### 4. Explore a scenario

> What if courier costs rise to six pounds per order? Show which parts of the idea are affected, without changing my saved model.

Expected result: **£6 revenue − £6.50 variable cost = a £0.50 loss per order**. The saved baseline stays unchanged until **Apply**. Choose **Discard** for this walkthrough before continuing. New speech waits while a scenario is awaiting Apply or Discard.

### 5. Evaluate and create a useful output

In **Advice**, choose **Evaluate my idea**, or say:

> Evaluate this plan. Show the most important untested assumptions and a small test for each.

Concern spheres are a separate review layer. Click one to see its evidence, unknowns and suggested test in Markdown. Use **Hide evaluation** to dismiss the layer.

Then switch to **Create** and say:

> Turn this idea into an editable one-week pilot plan. Include recruiting one restaurant, finding five students, testing collection, and measuring costs. Clearly identify our untested assumptions.

Click the plan sphere, choose **Edit document**, make a change and save it. **Download .md** exports the document.

### Optional: demonstrate concept correction and merging

If a misheard or duplicate concept exists, select that sphere, choose **Edit**, and explain the correction. For example:

> Holiday subscription was a transcription mistake. It is the same thing as Harvest subscription. Merge it into Harvest subscription and keep both connections.

Alternatively, rename a duplicate to the existing concept's name through **Edit document → Save document**. The merge retains both sets of notes and incoming/outgoing connections. Conflicting property values are documented and left unset until resolved. **Undo** reverses the change within the current page session. **Project → Merge duplicate concepts** repairs previously saved exact-name duplicates of the same kind.

## Review without an API key

The app can run without credentials. With no `OPENAI_API_KEY` set, it switches to **Demo** and disables live microphone input. This path uses scripted responses, not live AI.

1. Start the server using the same commands above.
2. Select **Demo** if it is not already selected.
3. To inspect incremental conceptual modeling, type **“Restaurants list surplus meals and students reserve them.”** and press **Send**. Then send **“Reservations have a pickup time.”**
4. For the financial example, choose **Project → Sample project**, then ask the margin question and £6-courier scenario from the walkthrough. The sample contains all required inputs.
5. Inspect and edit node documents, rotate the graph, export the project, or use **Project → Create pilot plan** for a scripted plan template.

Demo mode supports these bounded examples. It does not interpret arbitrary business ideas or generate illustrations. If using Demo while a live key is still configured, turn off **Illustrate spheres** to avoid optional image requests. There is no prerecorded microphone demonstration; the full voice workflow is demonstrated live.

## Controls, saving and recovery

- **Create** adds ideas; **Advice** asks questions or requests evaluation; **Edit** changes the selected saved concept. Evaluation is requested explicitly rather than added during ordinary dictation.
- **Graph navigation:** drag to rotate through 360°, Shift-drag to pan, and scroll/pinch to zoom. The small left rail provides Rotate, Pan, +, − and Fit. **More** reveals Reset view, Focus selected and direction buttons. Escape or clicking outside closes the extra controls.
- **Keyboard:** focus the canvas, then use arrows to pan, Shift+arrows to rotate, +/− to zoom, F to fit or R to reset.
- **Bottom card:** use its top-right arrow to collapse it; Start/Stop remains accessible. Fit uses the extra available canvas space.
- **Documents:** click a saved sphere to open its Markdown note; edit it or download it as `.md`.
- **Persistence:** the graph and finalized speech are saved in this browser's local storage. Images are cached separately in IndexedDB. The demonstrator's personal saved graph is not bundled in the repository.
- **Portable backup:** use **Project → Export project** for the saved baseline JSON, and **Import** to restore it. Individual concern notes can be downloaded separately; review overlays and images are not included in baseline JSON exports.
- **Failed interpretation:** the thought is retained and later speech waits in order. Use **Retry unsaved thought** after correcting the connection. Finalized unfinished work can be recovered after reload. If the last audio segment did not finish transcribing, review the partial text in the input and press Send.
- **Transcript export:** **Project → Download captured speech** exports the latest 300 finalized segments as Markdown.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| `node` or `npm` is not found | Install Node.js, reopen Terminal and check `node --version` / `npm --version`. |
| `package.json` cannot be found | Change into the cloned `thinkspace` folder before running npm commands. |
| `EADDRINUSE` on 3000 or 3001 | A server is already using that port. If it is this app, use its existing browser address. Stop the old server with Ctrl+C in its Terminal, or choose another port using the commands below. |
| Start talking is disabled / “OpenAI is not configured” | Add a real key to `.env.local` beside `package.json`, restart the server and refresh. The filename must not end in `.txt`. |
| API authentication, model-access or quota error | Check the key, account quota and access to the configured models. `configured: true` alone is not an access check. If speech access is unavailable, typed Live AI can still work with access to the interpretation model. |
| Mic permission denied or the meter does not move | Allow microphone access for localhost in the browser and operating system, check the selected audio input, then press Start talking again. |
| Speech connection fails while typed input works | Realtime speech also needs a working WebRTC connection. Check browser support and network restrictions; try another browser or network. |
| Words or names are misheard | Speak clearly, pause between thoughts, and use Edit to correct the affected concept. The current speech configuration is English. Typed input is an alternative. |
| “Finishing…” or “Finding the structure…” | The last transcript or interpretation is still arriving. Wait for it to settle; check the error message and retry control if the request fails. |
| Images fail or remain unavailable | The graph is still usable. Check image-model access/quota, retry the failed illustrations, or disable Illustrate spheres. |
| Graph feels crowded | Collapse the bottom card, use Fit, rotate the view, or select a concept and use More → Focus selected. |
| An old graph appears, or a graph seems missing | Storage belongs to a browser profile and origin, including its port. Use the same browser/address, import an exported project, or deliberately choose New canvas. |
| Code or key changes seem ignored | Stop and restart the server, then refresh. It does not hot reload. |

For an occupied port, try **3002** instead:

```sh
# macOS / Linux / Git Bash
PORT=3002 npm run dev
```

```powershell
# Windows PowerShell
$env:PORT = "3002"
npm run dev
```

Then open [http://localhost:3002/](http://localhost:3002/). A different port has separate browser storage.

## Verification commands

Run the local regression suite; it does not require a key or make billable OpenAI requests:

```sh
npm test
```

To produce and validate the optional Worker ESM build artifact:

```sh
npm run build
npm run validate
```

The build uses Bash: on Windows, run these two commands in Git Bash or WSL. They are **not required** for `npm run dev`. The build creates `dist/` using the tracked `.openai/hosting.json`; validation checks that the result exports `default.fetch`. These commands do not deploy anything.

Optional live checks use `.env.local`, send synthetic examples and consume API quota:

```sh
node scripts/eval-model.mjs
node scripts/eval-voice.mjs
node scripts/eval-capture.mjs
node scripts/eval-merge.mjs
```

Tests cover conceptual identity and merges, connection/Markdown preservation, speech ordering and retry recovery, mode boundaries, immutable scenarios, contribution calculations, image caching, navigation and genuine 3D layout. Live checks exercise model interpretation, Create/Advice/Edit, long-idea coverage and a subscription identity correction. They do not test a judge's physical microphone or network.

## Architecture and data handling

- `worker/index.js`: HTTP routes, Responses integration, Realtime SDP relay, image generation, shared graph validation/calculation/layout functions, and the embedded HTML/CSS/browser application.
- `scripts/dev.mjs`: dependency-free Node HTTP adapter; loads server configuration and listens on localhost.
- `scripts/test-*.mjs` and `scripts/test.mjs`: local regression checks; `scripts/eval-*.mjs`: optional live API checks.
- `scripts/build.sh` and `.openai/hosting.json`: optional Worker ESM packaging.

Microphone audio streams to OpenAI over WebRTC. Transcript text, the current graph and recent dialogue are sent to OpenAI for interpretation; concept titles and summaries inform optional image generation. The API key stays on the server. Graphs, notes, captured finalized speech and thumbnails are stored locally in the browser; there is no account system or multi-user database.

The pipeline is **live transcript → provisional mentions → contextual conceptual model → validated graph edits**. Nodes describe entities, actors, services, processes and other durable concepts; attributes hold details. Labelled edges retain relationship type and stated/inferred provenance. Semantic interpretation uses OpenAI; financial calculations and scenario isolation are implemented deterministically in code. Illustrations are decorative 2D thumbnails on spheres, not editable 3D assets.

## Current limits

English speech and heuristic interim previews can be imperfect. Model-selected concepts and relationships may need correction; labels and concept counts can vary between runs. Microphone/WebRTC compatibility is not verified across every browser and device. Projects are limited to 150 nodes and 500 edges; a single interpretation supports up to 30 changed nodes, and typed requests up to 6,000 characters. Dense graphs can overlap at some viewing angles. The calculator supports the documented marketplace contribution-margin example, not arbitrary financial analysis, fixed overhead or net profit. Browser storage is local, so export important work before changing browser/profile or clearing site data.

## Credits

Built during the 1 November 2026 hackathon with Codex. Codex contributed the speech/graph pipeline, conceptual editing and merging, server-side OpenAI integrations, 3D layout, UI, scenario calculator and regression checks. OpenAI Sites Worker ESM starter supplied the build/validation scaffolding. Sample businesses and financial figures are illustrative.

## Deploy to Vercel

The repository includes `vercel.json` and `api/index.js` so the UI and API run together on Vercel. Import this GitHub repository into Vercel using the **Other** framework preset and the repository root directory; keep the checked-in build settings. Add `OPENAI_API_KEY` as a server-side environment variable for Production (and Preview if needed). Optional model overrides are described above. Redeploy after changing environment variables. Local `.env.local` files are excluded from uploads.

Alternatively, from the repository directory:

```sh
npx vercel login
npx vercel
npx vercel env add OPENAI_API_KEY production
npx vercel --prod
```

Enter the key at the CLI prompt, never in source control. The first deployment works in Demo mode until the server key is configured. Live API requests consume that key's quota; only share a live deployment with the intended audience. Vercel serves HTTPS, which permits microphone access with browser permission. Saved local projects do not transfer automatically: export/import project JSON to move from localhost to the hosted origin. Image caches on the server are temporary; browser storage remains local to each visitor.
