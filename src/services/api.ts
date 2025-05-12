/* eslint-disable @typescript-eslint/no-unused-vars */
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
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function analyzeDocumentation(url: string): Promise<CodeWalkthroughSection[]> {
  // Documentation analysis feature has been removed
  // Return an explanatory message instead
  console.warn('Documentation analysis feature has been disabled');
  
  const demoSection: CodeWalkthroughSection = {
    title: "Documentation Analysis Unavailable",
    content: "The documentation analysis feature has been disabled in this version. Please use GitHub repository analysis instead.",
    code: undefined
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [demoSection];
} 