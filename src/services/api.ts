import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export type UrlType = 'github' | 'docs';

export interface CodeWalkthroughSection {
  title: string;
  content: string;
  code?: {
    filename: string;
    language: string;
    content: string;
    annotations?: {
      line: number;
      comment: string;
    }[];
  }[];
}

export async function analyzeRepository(url: string): Promise<CodeWalkthroughSection[]> {
  try {
    const response = await axios.post(`${baseUrl}/api/analyze/repos`, { url });
    return response.data;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
}

export async function analyzeDocumentation(url: string): Promise<CodeWalkthroughSection[]> {
  try {
    const response = await axios.post(`${baseUrl}/api/analyze/docs`, { url });
    return response.data;
  } catch (error) {
    console.error('Error analyzing documentation:', error);
    throw error;
  }
} 