import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// GitHub API token (optional)
const githubToken = process.env.GITHUB_TOKEN || '';

// Extract owner and repo from GitHub URL
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

// Get all files from a repository
async function getRepositoryFiles(owner: string, repo: string) {
  try {
    const headers: Record<string, string> = {};
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    // Try main branch first, then master if main fails
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers });
      return response.data.tree
        .filter((item: any) => item.type === 'blob' && !item.path.includes('node_modules/') && !item.path.includes('.git/'))
        .map((item: any) => item.path);
    } catch (error) {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, { headers });
      return response.data.tree
        .filter((item: any) => item.type === 'blob' && !item.path.includes('node_modules/') && !item.path.includes('.git/'))
        .map((item: any) => item.path);
    }
  } catch (error) {
    console.error('Error fetching repository files:', error);
    throw new Error('Failed to fetch repository structure');
  }
}

// Get file content
async function getFileContent(owner: string, repo: string, path: string) {
  try {
    const headers: Record<string, string> = {};
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    
    if (response.data.encoding === 'base64') {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }
    
    return axios.get(response.data.download_url).then(res => res.data);
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    return '';
  }
}

// Approximate token count for a string
function countTokens(text: string): number {
  // GPT tokenizers generally count ~4 chars as 1 token
  // This is an approximation
  return Math.ceil(text.length / 4);
}

// Compress code by removing extra whitespace
function compressCode(code: string): string {
  // Replace multiple spaces with a single space
  let compressed = code.replace(/[ \t]+/g, ' ');
  
  // Remove spaces around common operators and separators
  compressed = compressed.replace(/\s*([{}()[\],;:.<>=+\-*/%|&^!])\s*/g, '$1');
  
  // Restore space after keywords
  const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const', 'class', 'import', 'export'];
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})([^ ])`, 'g');
    compressed = compressed.replace(regex, '$1 $2');
  });
  
  // Preserve newlines but remove empty lines
  compressed = compressed.replace(/\n\s*\n/g, '\n');
  
  return compressed;
}

// Function to track original line numbers when compressing code
function compressCodeWithLineMapping(code: string): { 
  compressed: string; 
  lineMap: Record<number, number>;  // maps compressed line number to original line number
} {
  const lines = code.split('\n');
  const compressedLines: string[] = [];
  const lineMap: Record<number, number> = {};
  
  let compressedLineNum = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip empty lines
    if (line.trim() === '') continue;
    
    // Add to compressed content
    compressedLines.push(line.replace(/[ \t]+/g, ' ').trim());
    
    // Map the compressed line number to original line number
    lineMap[compressedLineNum] = i;
    compressedLineNum++;
  }
  
  return {
    compressed: compressedLines.join('\n'),
    lineMap
  };
}

// Filter for important code files only
function filterImportantFiles(files: string[]): string[] {
  // Extensions for important code files
  const importantExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.java', '.php',
    '.c', '.cpp', '.h', '.cs'
  ];
  
  // Patterns for non-important files
  const excludePatterns = [
    'test', 'spec', '.test.', '.spec.',
    '.css', '.scss', '.html', '.md', '.json', 'README',
    'package.json', 'package-lock.json', 'yarn.lock',
    '.gitignore', '.eslintrc', '.prettierrc', 'tsconfig.json',
    'jest.config', 'cypress.config', '.env', 'Dockerfile'
  ];
  
  // First filter by extension
  const codeFiles = files.filter(file => {
    const extension = file.substring(file.lastIndexOf('.')).toLowerCase();
    return importantExtensions.includes(extension);
  });
  
  // Then remove excluded patterns
  return codeFiles.filter(file => {
    const fileLower = file.toLowerCase();
    return !excludePatterns.some(pattern => fileLower.includes(pattern));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // 1. Get repository information
    const { owner, repo } = extractRepoInfo(url);
    
    // 2. Get all files from the repository
    const allFiles = await getRepositoryFiles(owner, repo);
    
    // 3. Filter for important code files only
    let importantFiles = filterImportantFiles(allFiles);
    
    // Ensure we have at least 5 files for analysis, or error if not enough
    if (importantFiles.length < 3) {
      return NextResponse.json({ 
        error: 'Repository must have at least 3 important code files for analysis' 
      }, { status: 400 });
    }
    
    // 4. Limit to most important 5-7 files to keep analysis focused
    const filesToAnalyze = importantFiles.slice(0, 7);
    
    // 5. Get content of these files
    const fileContents = await Promise.all(
      filesToAnalyze.map(async (path) => {
        const content = await getFileContent(owner, repo, path);
        // Compress code and track line numbers
        const { compressed, lineMap } = compressCodeWithLineMapping(content);
        return { 
          path, 
          content,  // Store original content
          compressed, // Store compressed content
          lineMap  // Store line mapping
        };
      })
    );
    
    // 6. Filter out empty files
    let validFiles = fileContents.filter(file => file.content);
    
    // Calculate total token estimate
    const CLAUDE_TOKEN_LIMIT = 200000;
    const TOKEN_BUFFER = 20000; // Buffer for prompt and other content
    const MAX_AVAILABLE_TOKENS = CLAUDE_TOKEN_LIMIT - TOKEN_BUFFER;
    
    // Calculate current token count using compressed content
    let totalTokens = 0;
    for (const file of validFiles) {
      totalTokens += countTokens(file.compressed);
    }
    
    // If we exceed the limit, remove files until we're under
    if (totalTokens > MAX_AVAILABLE_TOKENS) {
      console.log(`Token count (${totalTokens}) exceeds limit. Removing files to fit within limit.`);
      
      // Sort by file size (descending)
      validFiles.sort((a, b) => countTokens(b.compressed) - countTokens(a.compressed));
      
      // Remove files until we're under the limit
      while (totalTokens > MAX_AVAILABLE_TOKENS && validFiles.length > 3) {
        const removedFile = validFiles.pop();
        if (removedFile) {
          totalTokens -= countTokens(removedFile.compressed);
          console.log(`Removed ${removedFile.path} (${countTokens(removedFile.compressed)} tokens). Remaining: ${totalTokens} tokens`);
        }
      }
      
      console.log(`Final token count: ${totalTokens}, Files: ${validFiles.length}`);
    }
    
    // 7. Generate prompt for Claude
    const promptHeader = `
    I have a GitHub repository at ${url}. Please analyze these most important files and create a code walkthrough with annotations.

    Here are the files:
    `;
    
    const filesContent = validFiles.map((file) => `
    File: ${file.path}
    
    \`\`\`
    ${file.compressed}
    \`\`\`
    `).join('\n\n');
    
    const promptFooter = `
    Create a JSON response with this exact structure:
    [
      {
        "title": "Project Overview",
        "content": "Brief overview of what this codebase does",
        "code": null
      },
      {
        "title": "Key File: [filename]",
        "content": "Explanation of the file's purpose and importance",
        "code": [
          {
            "filename": "path/to/file.ext",
            "language": "language-name",
            "annotations": [
              {
                "line": 3,
                "comment": "Clear, concise explanation of this important line"
              }
            ]
          }
        ]
      }
    ]
    
    Important guidelines:
    1. Focus on the ${validFiles.length} most important files only
    2. DO NOT include the file content in your response - we already have the content and will merge your annotations with it
    3. Each file should have 3-5 meaningful annotations that explain key aspects of the code
    4. Add annotations only to the most important lines of each file
    5. Write annotations in a clear, concise style suitable for displaying alongside code
    6. Annotations should be 1-3 sentences, written in a blue sidebar comment style
    7. IMPORTANT: The line numbers you provide should be based on the code I've shown you, which has been compressed
    8. Make sure your response is valid JSON with no trailing commas or syntax errors
    
    Return ONLY the JSON array.
    `;
    
    // Log token usage breakdown
    console.log("===== TOKEN USAGE BREAKDOWN =====");
    console.log(`Prompt header: ${countTokens(promptHeader)} tokens`);
    console.log(`Files content: ${countTokens(filesContent)} tokens`);
    console.log(`Prompt footer: ${countTokens(promptFooter)} tokens`);
    console.log(`Total prompt: ${countTokens(promptHeader + filesContent + promptFooter)} tokens`);
    
    // Log individual file token counts
    console.log("\n===== FILE TOKEN COUNTS =====");
    validFiles.forEach(file => {
      const fileTokens = countTokens(file.compressed);
      const percentage = (fileTokens / totalTokens * 100).toFixed(2);
      console.log(`${file.path}: ${fileTokens} tokens (${percentage}% of total)`);
    });
    
    const prompt = promptHeader + filesContent + promptFooter;
    
    // 8. Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: 0.1,
      system: "You are a code analysis assistant. Your task is to analyze code and return a properly formatted JSON response that exactly matches the structure requested. Do not include any text, explanation, or markdown formatting outside the JSON array.",
      messages: [
        { role: 'user', content: prompt }
      ],
    });
    
    // 9. Extract and parse Claude's response
    const contentBlock = response.content[0];
    if (!contentBlock || contentBlock.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format from Claude' }, { status: 500 });
    }
    
    // Log the raw response for debugging
    console.log("===== RAW CLAUDE RESPONSE START =====");
    console.log(contentBlock.text);
    console.log("===== RAW CLAUDE RESPONSE END =====");
    
    // 10. Parse the JSON response
    try {
      // Try to parse the response directly
      const responseText = contentBlock.text.trim();
      const jsonResponse = JSON.parse(responseText);
      
      // Process the response to add file content back in
      const processedResponse = jsonResponse.map((section: any) => {
        if (section.code) {
          section.code = section.code.map((codeItem: any) => {
            // Find the corresponding file in our original files
            const originalFile = validFiles.find(file => file.path === codeItem.filename || 
                                               file.path.endsWith(codeItem.filename));
            
            if (originalFile) {
              // Map the compressed line numbers back to original line numbers
              if (codeItem.annotations) {
                codeItem.annotations = codeItem.annotations.map((annotation: any) => {
                  // Get the original line number from the mapping
                  const originalLineNumber = originalFile.lineMap[annotation.line] !== undefined 
                    ? originalFile.lineMap[annotation.line] + 1 // +1 because lineMap is 0-indexed but annotations are 1-indexed
                    : annotation.line; // Fall back to the provided line if mapping doesn't exist
                  
                  return {
                    ...annotation,
                    line: originalLineNumber
                  };
                });
              }
              
              // Add the original file content
              return {
                ...codeItem,
                content: originalFile.content,
                language: codeItem.language || getLanguageFromFilename(originalFile.path)
              };
            }
            return codeItem;
          });
        }
        return section;
      });
      
      return NextResponse.json(processedResponse);
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      
      // If parsing failed, attempt to extract JSON from the response
      try {
        const text = contentBlock.text.trim();
        const jsonStartIndex = text.indexOf('[');
        const jsonEndIndex = text.lastIndexOf(']') + 1;
        
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const jsonText = text.substring(jsonStartIndex, jsonEndIndex);
          const parsedJson = JSON.parse(jsonText);
          
          // Process to add file content
          const processedResponse = parsedJson.map((section: any) => {
            if (section.code) {
              section.code = section.code.map((codeItem: any) => {
                // Find the corresponding file in our original files
                const originalFile = validFiles.find(file => file.path === codeItem.filename || 
                                                   file.path.endsWith(codeItem.filename));
                
                if (originalFile) {
                  // Map the compressed line numbers back to original line numbers
                  if (codeItem.annotations) {
                    codeItem.annotations = codeItem.annotations.map((annotation: any) => {
                      // Get the original line number from the mapping
                      const originalLineNumber = originalFile.lineMap[annotation.line] !== undefined 
                        ? originalFile.lineMap[annotation.line] + 1 // +1 because lineMap is 0-indexed but annotations are 1-indexed
                        : annotation.line; // Fall back to the provided line if mapping doesn't exist
                      
                      return {
                        ...annotation,
                        line: originalLineNumber
                      };
                    });
                  }
                  
                  // Add the original file content
                  return {
                    ...codeItem,
                    content: originalFile.content,
                    language: codeItem.language || getLanguageFromFilename(originalFile.path)
                  };
                }
                return codeItem;
              });
            }
            return section;
          });
          
          return NextResponse.json(processedResponse);
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
      // Return fallback response if all parsing fails
      return NextResponse.json([
        {
          title: "Parsing Error",
          content: "Unable to parse the AI analysis. This sometimes happens with complex codebases. Please try again or try with a different repository.",
          code: null
        }
      ]);
    }
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to determine language from filename
function getLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const extensionToLanguage: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'java': 'java',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sh': 'bash',
    'rs': 'rust'
  };
  
  return extension ? extensionToLanguage[extension] || 'plaintext' : 'plaintext';
} 