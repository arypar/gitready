import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper to extract owner and repo from GitHub URL
function extractRepoInfo(url: string) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('github.com')) {
      throw new Error('Not a valid GitHub URL');
    }
    
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      throw new Error('Not a valid repository path');
    }
    
    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch (error) {
    throw new Error('Invalid GitHub URL');
  }
}

// Get repository structure using GitHub API
async function getRepositoryStructure(owner: string, repo: string) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
    return response.data.tree
      .filter((item: any) => item.type === 'blob' && !item.path.includes('node_modules/') && !item.path.includes('.git/'))
      .map((item: any) => item.path);
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    // Try master branch if main fails
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
      return response.data.tree
        .filter((item: any) => item.type === 'blob' && !item.path.includes('node_modules/') && !item.path.includes('.git/'))
        .map((item: any) => item.path);
    } catch (error) {
      console.error('Error fetching repository structure from master branch:', error);
      throw new Error('Failed to fetch repository structure');
    }
  }
}

// Get file content from GitHub
async function getFileContent(owner: string, repo: string, path: string) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
    
    // For binary files or large files, GitHub API returns a download_url
    if (response.data.encoding === 'base64') {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }
    
    // For larger files, fetch the raw content
    return axios.get(response.data.download_url).then(res => res.data);
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    return '';
  }
}

// Filter important files based on file extensions and paths
function filterImportantFiles(files: string[]) {
  const importantExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.java', '.php',
    '.c', '.cpp', '.h', '.cs', '.html', '.css', '.scss', '.md', '.json'
  ];
  
  const importantPatterns = [
    'README', 'package.json', 'requirements.txt', 'Gemfile', 'go.mod',
    'Dockerfile', '.gitignore', 'tsconfig.json', 'babel.config', 'vite.config',
    'webpack.config', 'jest.config', 'cypress.config'
  ];
  
  return files.filter(file => {
    const extension = file.substring(file.lastIndexOf('.'));
    const fileName = file.substring(file.lastIndexOf('/') + 1);
    
    return importantExtensions.includes(extension) || 
           importantPatterns.some(pattern => fileName.includes(pattern));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Extract owner and repo from GitHub URL
    const { owner, repo } = extractRepoInfo(url);
    
    // Get repository structure
    const files = await getRepositoryStructure(owner, repo);
    
    // Filter important files
    const importantFiles = filterImportantFiles(files);
    
    // Limit to 10 most important files to avoid overloading
    const limitedFiles = importantFiles.slice(0, 10);
    
    // Get content of important files
    const fileContents = await Promise.all(
      limitedFiles.map(async (path) => {
        const content = await getFileContent(owner, repo, path);
        return { path, content };
      })
    );
    
    // Filter out empty files
    const validFiles = fileContents.filter(file => file.content);
    
    // Generate prompt for Claude
    const prompt = `
    I have a GitHub repository at ${url}. Please analyze these key files and create an interactive walkthrough that explains the codebase for someone who's new to the project.
    
    Here are the important files from the repository:
    
    ${validFiles.map((file) => `
    File: ${file.path}
    
    \`\`\`
    ${file.content}
    \`\`\`
    `).join('\n\n')}
    
    Your task is to:
    1. Explain the overall architecture and structure of the codebase
    2. Identify the main components and how they interact
    3. Explain the most important files and their purpose
    4. Highlight any important patterns, frameworks, or libraries used
    5. Provide insights into how data flows through the application
    
    Format your response as a JSON array of sections. Each section should have:
    - title (string): The section title
    - content (string): Markdown formatted explanation 
    - code (optional array): Code snippets to highlight, each with:
      - filename (string): The file where the code is from
      - language (string): The programming language for syntax highlighting
      - content (string): The actual code snippet
    
    Example format:
    [
      {
        "title": "Project Overview",
        "content": "This is a React application that...",
        "code": null
      },
      {
        "title": "Core Components",
        "content": "The main components in this application are...",
        "code": [
          {
            "filename": "src/components/App.jsx",
            "language": "jsx",
            "content": "function App() {\\n  return <div>...</div>;\\n}"
          }
        ]
      }
    ]
    
    Make the walkthrough easy to understand for someone new to the codebase.
    `;
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: 0.2,
      system: "You're an expert software developer tasked with analyzing codebases and explaining them in a clear, structured way for new developers. Respond with valid JSON only.",
      messages: [
        { role: 'user', content: prompt }
      ],
    });
    
    // Parse the response to get the JSON content
    const content = response.content[0].text;
    let jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }
    
    // Parse the JSON content
    const jsonContent = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(jsonContent);
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 