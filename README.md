
# Banana Ads 🍌 - AI Cinematography Agent

**Banana Ads** is a high-end, AI-powered cinematography agent designed to help brands create broadcast-quality advertisement concepts, storyboards, scripts, and video assets in minutes.

Built with **Google Gemini 3** and **Veo**, this application streamlines the creative production process from the initial brief to the final cinematic render.

## ✨ Features

*   **🍌 Brand DNA Analysis:** Automatically researches your brand and product using Google Search grounding to determine the perfect target audience and tone.
*   **🎨 AI Mood Boards:** Generates professional fashion/aesthetic mood boards based on your product image and brand vibe.
*   **💡 Creative Concept Generation:** Proposes 3 distinct cinematic directions (e.g., Emotional, High-Energy, Minimalist) tailored to your brief.
*   **📸 "No Fluff" Product Placement:** Generates photorealistic storyboard scenes that inject your *actual* product image into the generated visuals, ensuring brand consistency.
*   **📝 Script Writing & Polishing:** Writes full audio scripts for each scene and offers an "AI Polish" tool to punch up the copy.
*   **🗣️ Neural Voiceovers:** Generates professional voiceovers using Gemini's high-quality text-to-speech (TTS) models (Voices: Kore, Zephyr, Fenrir, etc.).
*   **🎥 Cinematic Video Generation:** Uses the **Veo** model to animate static storyboard images into high-definition video clips.

## 🚀 Getting Started

### Prerequisites

1.  A Google Cloud Project or Google AI Studio account.
2.  A **Gemini API Key**.

### API Key Tiers

This application is designed to work primarily on the **Free Tier**, with one exception:

| Feature | Free Tier Key | Paid Key (Billing Enabled) |
| :--- | :---: | :---: |
| Brand Research | ✅ | ✅ |
| Script Writing | ✅ | ✅ |
| Storyboard Images | ✅ | ✅ |
| Voiceovers (TTS) | ✅ | ✅ |
| **Cinematic Video (Veo)** | ❌ | ✅ |

*Note: To use the Video Generation feature, you must use an API key from a Google Cloud Project with billing enabled.*

### Installation

1.  **Clone the repository** (or download files).
2.  **Install dependencies** (assuming a React environment):
    ```bash
    npm install
    # or
    yarn install
    ```
    *Core dependencies: `react`, `react-dom`, `@google/genai`, `tailwindcss`.*

3.  **Run the Application**:
    ```bash
    npm start
    ```

## 🛠️ Usage Guide

### 1. The Briefing Room
*   Enter your **Brand Name** and **Product Name**.
*   Click **"Auto-fill Brief with AI Research"** to let Gemini browse the web and fill in your target audience and key selling points.
*   **Upload a Product Image:** This is critical. The app uses this image to ensure your actual product appears in the generated storyboards.
*   Generate a **Mood Board** to visualize the aesthetic.

### 2. Concept Selection
*   The AI will pitch 3 unique creative directions.
*   It generates a "Key Visual" for each concept using your product image.
*   Select the concept that best fits your campaign goals.

### 3. Production Studio (Storyboarding)
*   **Visuals:** Click "Generate Image" for each scene. The AI preserves your product's look while placing it in the cinematic context.
*   **Audio:** Click the speaker icon to generate the voiceover for that scene.
*   **Video:** (Paid Key Only) Click "Animate Cinematic Video" to turn the static scene into a 720p video clip using Veo.
*   **Export:** Use the "Export Ad" button in the navbar to download a full HTML creative dossier of your campaign.

## 🍌 The "Banana" Progress System
The app features custom "Banana Progress Thingys" (animated indicators) to track your journey from the initial brief (Green Banana) to the ripe, final production (Yellow/Orange Banana).

## Tech Stack
*   **Frontend:** React 19, Tailwind CSS
*   **AI Models:**
    *   `gemini-3-pro-preview` (Reasoning & Scripting)
    *   `gemini-2.5-flash-image` (Image Generation & Vision)
    *   `gemini-2.5-flash-preview-tts` (Text-to-Speech)
    *   `veo-3.1-fast-generate-preview` (Video Generation)
*   **SDK:** `@google/genai`

---
*Built with Gemini.*
