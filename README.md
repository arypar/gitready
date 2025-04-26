# Code Onboarding Assistant

A Next.js application that helps developers understand codebases quickly by providing interactive walkthroughs using Claude AI. The application allows users to submit public GitHub repository URLs or API documentation links and generates structured, comprehensive explanations of the code or API.

## Features

- Analyze public GitHub repositories to understand code structure and architecture
- Process API documentation to create easy-to-understand guides
- Interactive UI with expandable sections for different aspects of the codebase
- Syntax-highlighted code examples with contextual explanations
- Powered by Claude 3.5 Sonnet for intelligent code analysis

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Anthropic API key (for Claude AI)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Choose between analyzing a GitHub repository or API documentation
2. Enter the public URL of the repository or API docs
3. Submit the form and wait for the analysis to complete
4. Browse through the generated interactive walkthrough with code snippets and explanations

## Tech Stack

- Next.js 14.x with App Router
- TypeScript
- Tailwind CSS
- Claude AI (Anthropic API)
- React Markdown for content display
- Syntax highlighting for code snippets

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
