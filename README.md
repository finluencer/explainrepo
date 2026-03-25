# explainrepo

Understand any codebase instantly from your terminal.

```
explainrepo map        → repo tree + dependency graph
explainrepo overview   → entry point, project type, key areas, flow
explainrepo find "..."  → locate relevant files for any query
```

---

## Install

```bash
npm install -g explainrepo
```

Or run without installing:

```bash
npx explainrepo <command>
```

---

## Commands

### `map`

Prints the full repo file tree and dependency graph starting from the detected entry point.

```bash
explainrepo map
```

```
Repo Structure
────────────────────────────────────────
my-app/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── services/
│   │   └── authService.js
│   └── index.js
└── package.json

Dependency Graph
────────────────────────────────────────
Entry: src/index.js

src/index.js
  └─ src/controllers/authController.js
src/controllers/authController.js
  └─ src/services/authService.js
```

---

### `overview`

Summarizes the project — entry point, type, key areas, and execution flow.

```bash
explainrepo overview
```

```
✔ Entry Point
  src/index.js

✔ Project Type
  Node/Unknown

✔ Key Areas
  - Routes: src/routes
  - Services: src/services

✔ Flow
  index.js → app.js → router → authController

✔ Stats
  Scanned: 84 files  |  Graph: 12 nodes
```

---

### `find <query>`

Locates the most relevant files for any natural language query using keyword stemming, naming convention variants, proximity scoring, and fuzzy matching — no AI required.

```bash
explainrepo find "where is OTP verified"
explainrepo find "payment invoice logic"
explainrepo find "user authentication"
explainrepo find "verify otp" --limit 10
```

```
Query: verify otp
────────────────────────────────────────
1. src/services/otpService.js
   in name: otp  |  in content: verify, otp  |  defines it  |  nearby +8  |  all terms found

2. src/controllers/authController.js
   in content: verify, otp  |  identifier match  |  all terms found

3. src/routes/auth.js
   in content: otp  |  identifier match
```

**Options**

| Flag | Description | Default |
|------|-------------|---------|
| `-n, --limit <number>` | Number of results to show | `5` |

---

## How search works

`find` is entirely deterministic — no AI, no API calls, works offline.

For any query it:

1. **Strips stop words** — removes "where", "is", "the", etc.
2. **Normalizes stems** — `"verified"` → `"verify"`, `"authentication"` → `"authenticate"`
3. **Generates naming variants** — `["verify", "otp"]` → `verifyOtp`, `verifyOTP`, `verify_otp`, `VERIFY_OTP`, `otpVerify`, etc.
4. **Scores each file** by:
   - keyword in file name (+5)
   - naming variant in file name (+4)
   - keyword in file content (+2)
   - naming variant in content (+3)
   - function/class definition detected (+5)
   - proximity — both keywords within 10 lines (+8), 30 lines (+4), 100 lines (+2)
   - all keywords present in one file (bonus)
   - file role — services rank higher than utils
5. **Returns top N results** with a human-readable match summary

---

## What gets scanned

- Files: `.js` `.ts` `.jsx` `.tsx` `.mjs` `.cjs`
- Respects `.gitignore`
- Skips: `node_modules`, `dist`, `build`, `.next`, test files, files > 500KB, binary files, symlinks

---

## Requirements

- Node.js >= 16

---

## License

MIT
