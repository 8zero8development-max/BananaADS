# Banana Ads - AI Cinematography Agent

**Banana Ads** is a high-end, AI-powered cinematography agent designed to help brands create broadcast-quality advertisement concepts, storyboards, scripts, and video assets in minutes.

Built with **Google Gemini 3** and **Veo**, this application streamlines the creative production process from the initial brief to the final cinematic render. The system serves marketing professionals and brands who need to generate professional advertising content without traditional production resources.

## Core Value Proposition

BananaADS eliminates traditional advertising production barriers by automating brand research (AI-powered web search to determine target audience and tone), mood board generation (visual aesthetic references from product images), concept ideation (multiple creative directions with thumbnail previews), production asset generation (images, videos, and voiceovers created on-demand), and "No Fluff" product placement (actual uploaded product images integrated into AI-generated scenes, not hallucinated versions).

Users can transform a simple brand brief into a complete advertising campaign including AI-generated creative concepts (three distinct cinematic directions tailored to brand identity), photorealistic storyboards (scene-by-scene visual compositions with actual product integration), professional scripts (copy-written dialogue with AI polishing capabilities), neural voiceovers (high-quality text-to-speech in multiple voice profiles), and cinematic video clips (animated 720p video from static storyboard images).

## Features

- **Brand DNA Analysis:** Automatically researches your brand and product using Google Search grounding to determine the perfect target audience and tone.
- **AI Mood Boards:** Generates professional fashion/aesthetic mood boards based on your product image and brand vibe.
- **Creative Concept Generation:** Proposes 3 distinct cinematic directions (e.g., Emotional, High-Energy, Minimalist) tailored to your brief.
- **"No Fluff" Product Placement:** Generates photorealistic storyboard scenes that inject your *actual* product image into the generated visuals, ensuring brand consistency.
- **Script Writing & Polishing:** Writes full audio scripts for each scene and offers an "AI Polish" tool to punch up the copy.
- **Neural Voiceovers:** Generates professional voiceovers using Gemini's high-quality text-to-speech (TTS) models (Voices: Kore, Zephyr, Fenrir, etc.).
- **Cinematic Video Generation:** Uses the **Veo** model to animate static storyboard images into high-definition video clips.

## System Architecture

BananaADS follows a three-tier architecture pattern consisting of a React frontend, a service layer, and external AI platforms.

### Architecture Overview

```
+---------------------------------------------------------------------+
|                         React Frontend                               |
|  +-------------+  +-------------+  +-------------+                  |
|  |   App.tsx   |  | LandingPage |  |  UI Comps   |                  |
|  |   (State)   |  |             |  |             |                  |
|  +------+------+  +-------------+  +-------------+                  |
|         |                                                            |
|         v                                                            |
|  +-------------------------------------------------------------+    |
|  |                    Service Layer                             |    |
|  |  +-----------------------------------------------------+    |    |
|  |  |              GeminiService.ts                        |    |    |
|  |  |  - Brand Research    - Image Generation              |    |    |
|  |  |  - Script Writing    - Video Generation              |    |    |
|  |  |  - TTS Voiceovers    - Concept Generation            |    |    |
|  |  +-----------------------------------------------------+    |    |
|  +-------------------------------------------------------------+    |
+---------------------------------------------------------------------+
                                |
                                v
+---------------------------------------------------------------------+
|                    External AI Platforms                             |
|  +-------------+  +-------------+  +-------------+  +-----------+  |
|  | gemini-3-   |  | gemini-2.5- |  | gemini-2.5- |  | veo-3.1-  |  |
|  | pro-preview |  | flash-image |  | flash-tts   |  | fast-gen  |  |
|  | (Reasoning) |  | (Images)    |  | (Voice)     |  | (Video)   |  |
|  +-------------+  +-------------+  +-------------+  +-----------+  |
+---------------------------------------------------------------------+
```

The frontend layer handles all user interactions and state management through the App.tsx component, which acts as the master state container. The service layer abstracts all AI interactions through GeminiService, which routes requests to the appropriate Gemini model based on the task type. The external AI platforms provide the actual intelligence, with different models optimized for different tasks.

### Project Organization

```
BananaADS/
├── src/
│   ├── App.tsx                    # Master orchestrator component
│   ├── index.tsx                  # React application entry point
│   ├── types.ts                   # Core data models
│   ├── services/
│   │   └── geminiService.ts       # AI service abstraction layer
│   └── utils/
│       └── audioUtils.ts          # Audio decoding utilities
├── index.html                     # HTML shell with Banana animations
├── vite.config.ts                 # Build configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── metadata.json                  # Agent manifest
```

## Workflow State Machine

The application implements a linear workflow state machine that guides users through the advertisement creation process. The workflow progresses through three distinct stages, with each stage building upon the outputs of the previous one.

```
+---------------------------------------------------------------------+
|                        Workflow State Machine                        |
+---------------------------------------------------------------------+

    +--------------+      +--------------+      +------------------+
    |   BRIEFING   | ---> |   CONCEPTS   | ---> |  STORYBOARDING   |
    |   (Step 0)   |      |   (Step 1)   |      |    (Step 2)      |
    +--------------+      +--------------+      +------------------+
           |                     |                      |
           v                     v                      v
    +--------------+      +--------------+      +------------------+
    | - Brand Info |      | - 3 Concepts |      | - Script Gen     |
    | - Research   |      | - Thumbnails |      | - Scene Images   |
    | - Product    |      | - Selection  |      | - Videos         |
    |   Image      |      |              |      | - Voiceovers     |
    | - Mood Board |      |              |      | - Export         |
    +--------------+      +--------------+      +------------------+
```

**BRIEFING Stage:** Users collect brand information, run AI-powered research, upload product images, and generate mood boards. This stage establishes the foundation for all subsequent creative work.

**CONCEPTS Stage:** The AI generates three distinct creative directions based on the brief. Each concept includes a title, hook, summary, and thumbnail preview. Users select the concept that best fits their campaign goals.

**STORYBOARDING Stage:** The system generates scripts and auto-creates scene images. Users can trigger video generation and voiceovers for each scene, then export the complete campaign as an HTML dossier.

Each stage is sequential at the workflow level but allows parallel asset generation within stages.

## Component Architecture

The component hierarchy is designed with App.tsx as the central orchestrator, managing all application state and coordinating between UI components and the AI service layer.

### App Component Responsibilities

The App.tsx component serves as the master state container and workflow orchestrator. This single component manages all application state (brief, concepts, project, loading flags), implements the three-stage workflow state machine, handles all user interactions and AI service invocations, and conditionally renders UI based on the current AppStep. The application uses no intermediate state management library, relying instead on direct React state updates.

Key event handlers include:

- `handleResearchBrand()` - AI auto-fill brief with web research
- `handleStartBriefing()` - Generate 3 creative concepts
- `handleSelectConcept()` - Generate script, initialize scenes
- `generateSceneImage()` - Create storyboard image for scene
- `generateSceneVideo()` - Animate image to video (paid key required)
- `playVoiceover()` - Generate and play TTS audio
- `handlePolishScript()` - Refine scene audio script
- `handleExport()` - Download HTML campaign dossier

### GeminiService Layer

The GeminiService in `services/geminiService.ts` acts as the AI orchestration layer, abstracting interactions with four distinct Google Gemini models:

- `gemini-3-pro-preview` - Complex reasoning, brand research, script writing
- `gemini-2.5-flash-image` - All image generation (mood boards, concepts, storyboards)
- `gemini-2.5-flash-preview-tts` - Text-to-speech voiceover synthesis
- `veo-3.1-fast-generate-preview` - Cinematic video generation (paid tier only)

Key features include an exponential backoff retry mechanism for expensive operations (3 retries, 2s initial delay), Google Search grounding for brand research, structured JSON responses with schema validation, an image-to-video pipeline with polling for async video generation, and client-side audio decoding (base64 to AudioBuffer).

## Data Models

The application uses a progressive refinement data pipeline where each stage builds upon the previous one's output.

```
+---------------------------------------------------------------------+
|                      Data Model Relationships                        |
+---------------------------------------------------------------------+

    +--------------+      +--------------+      +------------------+
    |   AdBrief    | ---> |  AdConcept   | ---> |    AdProject     |
    |              |      |   (x3)       |      |                  |
    +--------------+      +--------------+      +------------------+
           |                                            |
           |                                            v
           |                                    +------------------+
           |                                    |     Scene[]      |
           |                                    |                  |
           |                                    +------------------+
           |
           v
    +--------------------------------------------------------------+
    |  AdBrief Fields:                                              |
    |  - brandName, productName                                     |
    |  - targetAudience, tone[], keyFeatures[]                      |
    |  - productImage?, logoImage?, moodBoard?                      |
    |  - researchSources[], creativeDirection?, voiceName?          |
    +--------------------------------------------------------------+
```

**AdBrief:** The initial requirements object containing brand name, product name, target audience, tone array, key features array, and optional product image, logo image, mood board, research sources, creative direction, and voice name.

**AdConcept:** A creative direction generated by AI with id, title, hook, summary, and optional thumbnail URL. Three concepts are generated per brief.

**AdProject:** The master container for a complete campaign, linking the brief, selected concept, and scenes array with a status field.

**Scene:** An individual ad segment with scene number, visual prompt, audio script, and optional image URL and video URL. Each scene tracks multiple async operations via boolean flags (isGeneratingImage, isGeneratingVideo, isGeneratingVoice, isPolishingScript).

## Key Architectural Decisions

### Centralized State Management

The application deliberately avoids external state management libraries like Redux or Zustand in favor of React's built-in useState hooks centralized in App.tsx. This decision simplifies the codebase for a single-page application where all state transitions follow a predictable linear workflow. The trade-off is that all state logic lives in one large component, but this is acceptable given the application's scope.

### Asset Storage Strategy

Generated assets (images, videos, audio) are stored as data URLs or blob URLs in component state rather than being persisted to a backend. This approach eliminates the need for server-side storage infrastructure and keeps the application entirely client-side (except for AI API calls). The export feature generates a self-contained HTML file with embedded assets.

### AI Model Selection Strategy

Different Gemini models are selected based on task requirements. The `gemini-3-pro-preview` model handles complex reasoning tasks like brand research and script writing where quality matters most. The `gemini-2.5-flash-image` model handles all image generation for speed and cost efficiency. The `gemini-2.5-flash-preview-tts` model provides high-quality text-to-speech. The `veo-3.1-fast-generate-preview` model handles video generation but requires a paid API key.

### Retry Mechanism

The GeminiService implements exponential backoff for expensive AI operations with 3 retries and a 2-second initial delay. This handles rate limiting errors (429, 503, RESOURCE_EXHAUSTED) gracefully without failing immediately.

## Getting Started

### Prerequisites

1. A Google Cloud Project or Google AI Studio account.
2. A **Gemini API Key**.

### API Key Tiers

This application is designed to work primarily on the **Free Tier**, with one exception:

| Feature | Free Tier Key | Paid Key (Billing Enabled) |
| :--- | :---: | :---: |
| Brand Research | Yes | Yes |
| Script Writing | Yes | Yes |
| Storyboard Images | Yes | Yes |
| Voiceovers (TTS) | Yes | Yes |
| **Cinematic Video (Veo)** | No | Yes |

*Note: To use the Video Generation feature, you must use an API key from a Google Cloud Project with billing enabled.*

### Installation

1. **Clone the repository** (or download files).
2. **Install dependencies**:
    ```bash
    npm install
    ```
    *Core dependencies: `react`, `react-dom`, `@google/genai`, `tailwindcss`.*

3. **Run the Application**:
    ```bash
    npm run dev
    ```

### Environment Variables

- `GEMINI_API_KEY` - Required for all AI features (injected as `process.env.API_KEY`)

## Usage Guide

### 1. The Briefing Room
- Enter your **Brand Name** and **Product Name**.
- Click **"Auto-fill Brief with AI Research"** to let Gemini browse the web and fill in your target audience and key selling points.
- **Upload a Product Image:** This is critical. The app uses this image to ensure your actual product appears in the generated storyboards.
- Generate a **Mood Board** to visualize the aesthetic.

### 2. Concept Selection
- The AI will pitch 3 unique creative directions.
- It generates a "Key Visual" for each concept using your product image.
- Select the concept that best fits your campaign goals.

### 3. Production Studio (Storyboarding)
- **Visuals:** Click "Generate Image" for each scene. The AI preserves your product's look while placing it in the cinematic context.
- **Audio:** Click the speaker icon to generate the voiceover for that scene.
- **Video:** (Paid Key Only) Click "Animate Cinematic Video" to turn the static scene into a 720p video clip using Veo.
- **Export:** Use the "Export Ad" button in the navbar to download a full HTML creative dossier of your campaign.

## The "Banana" Progress System

The app features custom "Banana Progress Thingys" (animated indicators) to track your journey from the initial brief (Green Banana) to the ripe, final production (Yellow/Orange Banana). The BananaPro component displays AI agent personas with different roles (default, research, artist, director, cameraman, voice, writer) and provides visual feedback during AI operations through custom CSS animations including wiggle, scan, bounce, write, pulse, and vibrate effects.

## Tech Stack

- **Frontend:** React 19, Tailwind CSS
- **Build Tool:** Vite
- **AI Models:**
    - `gemini-3-pro-preview` (Reasoning & Scripting)
    - `gemini-2.5-flash-image` (Image Generation & Vision)
    - `gemini-2.5-flash-preview-tts` (Text-to-Speech)
    - `veo-3.1-fast-generate-preview` (Video Generation)
- **SDK:** `@google/genai`

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

---
*Built with Gemini.*
