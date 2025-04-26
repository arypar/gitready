import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function fetchDocumentation(url: string) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching documentation:', error);
    throw new Error('Failed to fetch documentation');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Fetch documentation content
    const documentation = await fetchDocumentation(url);
    
    // Generate prompt for Claude
    const prompt = `
    I have API documentation available at this URL: ${url}
    
    Here's the content of the documentation:
    
    \`\`\`
    ${typeof documentation === 'string' ? documentation : JSON.stringify(documentation, null, 2)}
    \`\`\`
    
    Please create an interactive walkthrough that explains this API for a developer who wants to use it. 
    
    Your task is to:
    1. Explain the overall purpose and structure of the API
    2. Identify the key endpoints and how to use them
    3. Explain authentication mechanisms if present
    4. Highlight common request/response patterns
    5. Show example API calls where appropriate
    
    Format your response as a JSON array of sections. Each section should have:
    - title (string): The section title
    - content (string): Markdown formatted explanation 
    - code (optional array): Code snippets to highlight, each with:
      - filename (string): A descriptive name for the snippet (e.g. "Authentication Example")
      - language (string): The programming language for syntax highlighting (e.g. "javascript", "bash", "json")
      - content (string): The actual code snippet
    
    Example format:
    [
      {
        "title": "API Overview",
        "content": "This API allows you to...",
        "code": null
      },
      {
        "title": "Authentication",
        "content": "To authenticate with this API, you need to...",
        "code": [
          {
            "filename": "Authentication Example",
            "language": "javascript",
            "content": "fetch('https://api.example.com/resource', {\\n  headers: {\\n    'Authorization': 'Bearer YOUR_TOKEN'\\n  }\\n})"
          }
        ]
      }
    ]
    
    Make the walkthrough clear and easy to understand for someone new to the API.
    `;
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: 0.2,
      system: "You're an expert API documentation analyst. Your job is to read API documentation and explain it in a clear, structured way for developers. Respond with valid JSON only.",
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
    console.error('Error analyzing documentation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 