# PromptOps Frontend

AI prompt evaluation workspace built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + shadcn/ui
- React Router DOM

## Getting Started

```bash
# Use Node 22 (required)
source ~/.nvm/nvm.sh && nvm use 22

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── sidebar.tsx   # Notion-style sidebar
│   └── project-grid.tsx
├── hooks/
│   ├── use-projects.ts
│   ├── use-prompt-versions.ts
│   ├── use-model-configs.ts
│   ├── use-test-cases.ts
│   └── use-runs.ts
├── pages/
│   ├── home.tsx            # Project list
│   ├── project-workspace.tsx  # Main editor workspace
│   └── run-detail.tsx      # Run results view
└── lib/
    ├── config.ts
    └── utils.ts
```

## Features

- **Project Management** - Create and browse projects
- **Prompt Editor** - Edit prompts with version history
- **Test Cases** - Define inputs and expected outputs
- **Model Configs** - Configure models for evaluation
- **Run Evaluation** - Execute prompts against test cases and models
- **Run Inspection** - View detailed results per model

## API

Proxied to `http://192.168.1.20:8000` in development. See backend docs at `/docs`.

Key endpoints:
- `GET/POST /projects` - Project CRUD
- `GET/POST /projects/:id/prompt-versions` - Prompt versions
- `GET/POST /projects/:id/model-configs` - Model configs
- `GET/POST /projects/:id/test-cases` - Test cases
- `GET/POST /projects/:id/runs` - Evaluation runs
