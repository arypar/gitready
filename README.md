# GitReady 🐈‍⬛

GitReady uses AI to instantly generate visual code maps and explanations from GitHub repositories, helping developers git up to speed quickly.

## ✨ Features

*   **Visual Code Maps:** Interactive diagrams showing file relationships and dependencies (using React Flow).
*   **AI-Generated Explanations:** Code snippets annotated with explanations powered by Anthropic's AI.
*   **GitHub Repository Analysis:** Simply provide a GitHub URL to start the analysis.
*   **Dark Theme:** Sleek and modern user interface.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd pearvc-anthropic-hack 
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**

    Create a file named `.env` in the root of the project and add the following variables:

    ```env
    # Required: Your API key from Anthropic (https://console.anthropic.com/settings/keys)
    ANTHROPIC_API_KEY=your_anthropic_api_key_here

    # Required: The base URL where your Next.js app will run locally 
    # (usually http://localhost:3000)
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Optional: A GitHub Personal Access Token (PAT) 
    # Recommended to avoid rate limits when fetching repository data. 
    # Needs 'repo' scope if accessing private repositories.
    # Generate one here: https://github.com/settings/tokens
    GITHUB_TOKEN=your_github_pat_here 
    ```

    **Important:** Do **not** commit your `.env` file to version control. Add it to your `.gitignore` file if it's not already there.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) (or your configured `NEXT_PUBLIC_BASE_URL`) in your browser.

## 🛠️ Tech Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
*   **Visualization:** React Flow
*   **AI:** Anthropic API
*   **GitHub Interaction:** Octokit

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## 📄 License

This project is currently unlicensed.