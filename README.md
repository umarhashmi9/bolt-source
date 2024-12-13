
# Bolt.diy
[![GitHub](https://img.shields.io/badge/GitHub-Bolt.diy-181717?style=for-the-badge&logo=github)](https://github.com/stackblitz-labs/bolt.diy)
[![Discourse](https://img.shields.io/badge/Discourse-Community-blue?style=for-the-badge&logo=discourse)](https://thinktank.ottomator.ai/)
[![X](https://img.shields.io/badge/@bolt__diy-1DA1F2?style=for-the-badge&logo=x)](https://x.com/bolt_diy)
[![Bluesky](https://img.shields.io/badge/Bluesky-bolt.diy-3178C6?style=for-the-badge)](https://bsky.app/profile/bolt.diy)

> AI-Powered Full-Stack Web Development in Your Browser (Previously known as oTToDev)

[![Bolt.new Preview](./public/social_preview_index.jpg)](https://bolt.new)

## 🚀 Overview

Bolt.diy is the official open-source version of Bolt.new that empowers you to choose your preferred LLM for each prompt. Build, test, and deploy full-stack applications directly in your browser—no local setup required.

### Supported LLM Providers
- OpenAI
- Anthropic
- Ollama
- OpenRouter
- Gemini
- LMStudio
- Mistral
- xAI
- HuggingFace
- DeepSeek
- Groq
- TogatherAI
- And more via Vercel AI SDK!

📚 For detailed information, visit the [Bolt.diy Documentation](https://stackblitz-labs.github.io/bolt.diy/).

## 🌟 What Makes Bolt Different?

Unlike traditional AI coding assistants, Bolt.diy offers:

### 🔧 Full-Stack Development in Browser
- Install and run npm packages
- Execute Node.js servers
- Interact with third-party APIs
- Deploy to production from chat ( pending)
- Share via URL ( pending )

### 🤖 Complete AI Environment Control
- Full filesystem access
- Node server management
- Package manager integration
- Terminal access
- Browser console control

## 🛠️ Installation

### Prerequisites
1. [Git](https://git-scm.com/downloads)
2. [Node.js](https://nodejs.org/en/download/)
3. [Docker](https://www.docker.com/) (optional, for containerized setup)

### Option 1: Standard Setup

1. Clone the repository:
```bash
# For stable version (recommended)
git clone -b stable https://github.com/stackblitz-labs/bolt.diy

# For latest development version
git clone https://github.com/stackblitz-labs/bolt.diy.git
```

2. Configure environment:
   - Rename `.env.example` to `.env.local`
   - Add your API keys:
     ```env
     GROQ_API_KEY=XXX
     OPENAI_API_KEY=XXX
     ANTHROPIC_API_KEY=XXX
     ...

     # Optional configurations
     VITE_LOG_LEVEL=debug
     OLLAMA_API_BASE_URL=http://localhost:11434
     DEFAULT_NUM_CTX=8192
     ...
     ```

3. Install dependencies:
```bash
pnpm install
```

4. Start development server:
```bash
pnpm run dev
```

### Option 2: Docker Setup

```bash
# Development build
npm run dockerbuild
# OR
docker build . --target bolt-ai-development

# Production build
npm run dockerbuild:prod
# OR
docker build . --target bolt-ai-production

# Run with Docker Compose
docker-compose --profile development up  # For development
docker-compose --profile production up   # For production
```

## 🎯 Available Scripts

```bash
# Development
pnpm run dev          # Start development server with hot reloading
pnpm run build        # Build the project for production
pnpm run preview      # Build and preview production locally

# Testing & Quality
pnpm test            # Run tests once
pnpm run test:watch  # Run tests in watch mode
pnpm run lint:fix    # Fix linting and formatting issues

# Docker
pnpm run dockerbuild        # Build development Docker image
pnpm run dockerbuild:prod   # Build production Docker image
pnpm run dockerrun         # Run Docker container with local environment

# Type Checking
pnpm run typecheck    # Run TypeScript type checking
```


## 🤝 Community

Join our community: https://thinktank.ottomator.ai

Originally started by [Cole Medin](https://www.youtube.com/@ColeMedin), Bolt.diy has grown into a community-driven project.

## ✅ Completed Features & Contributors


- ✅ OpenRouter Integration (@coleam00)
- ✅ Gemini Integration (@jonathands)
- ✅ Autogenerate Ollama models from what is downloaded (@yunatamos)
- ✅ Filter models by provider (@jasonm23)
- ✅ Download project as ZIP (@fabwaseem)
- ✅ Improvements to the main Bolt.new prompt in `app\lib\.server\llm\prompts.ts` (@kofi-bhr)
- ✅ DeepSeek API Integration (@zenith110)
- ✅ Mistral API Integration (@ArulGandhi)
- ✅ "Open AI Like" API Integration (@ZerxZ)
- ✅ Ability to sync files (one way sync) to local folder (@muzafferkadir)
- ✅ Containerize the application with Docker for easy installation (@aaronbolton)
- ✅ Publish projects directly to GitHub (@goncaloalves)
- ✅ Ability to enter API keys in the UI (@ali00209)
- ✅ xAI Grok Beta Integration (@milutinke)
- ✅ LM Studio Integration (@karrot0)
- ✅ HuggingFace Integration (@ahsan3219)
- ✅ Bolt terminal to see the output of LLM run commands (@thecodacus)
- ✅ Streaming of code output (@thecodacus)
- ✅ Ability to revert code to earlier version (@wonderwhy-er)
- ✅ Cohere Integration (@hasanraiyan)
- ✅ Dynamic model max token length (@hasanraiyan)
- ✅ Better prompt enhancing (@SujalXplores)
- ✅ Prompt caching (@SujalXplores)
- ✅ Load local projects into the app (@wonderwhy-er)
- ✅ Together Integration (@mouimet-infinisoft)
- ✅ Mobile friendly (@qwikode)
- ✅ Better prompt enhancing (@SujalXplores)
- ✅ Attach images to prompts (@atrokhym)
- ✅ Detect package.json and commands to auto install and run preview for folder and git import (@wonderwhy-er)

## 🔄 Upcoming Features

- ⬜ **HIGH PRIORITY** - Prevent Bolt from rewriting files as often (file locking and diffs)
- ⬜ **HIGH PRIORITY** - Better prompting for smaller LLMs (code window sometimes doesn't start)
- ⬜ **HIGH PRIORITY** - Run agents in the backend as opposed to a single model call
- ⬜ Deploy directly to Vercel/Netlify/other similar platforms
- ⬜ Have LLM plan the project in a MD file for better results/transparency
- ⬜ VSCode Integration with git-like confirmations
- ⬜ Upload documents for knowledge - UI design templates, a code base to reference coding style, etc.
- ⬜ Voice prompting
- ⬜ Azure Open AI API Integration
- ⬜ Perplexity Integration
- ⬜ Vertex AI Integration

## 📖 Additional Resources
- [Contributing Guide](CONTRIBUTING.md)
- [Project Roadmap](https://roadmap.sh/r/ottodev-roadmap-2ovzo)
- [FAQ](FAQ.md)

> **Note**: Never commit your `.env.local` file to version control. It's already included in .gitignore.