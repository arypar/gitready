'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import UrlForm from '@/components/UrlForm';
import LoadingIndicator from '@/components/LoadingIndicator';
import CodeWalkthrough from '@/components/CodeWalkthrough';
import ThreeBackground from '@/components/background/ThreeBackground';
import { analyzeRepository, analyzeDocumentation, CodeWalkthroughSection, UrlType } from '@/services/api';
import { Switch } from '@/components/ui/switch';

// Demo data for testing purposes
const DEMO_WALKTHROUGH: CodeWalkthroughSection[] = [
  {
    title: "Project Overview",
    content: "This project is a modern web application built with React, featuring a clean architecture and well-organized code structure. The application follows industry best practices for state management, routing, and component design.",
    code: undefined
  },
  {
    title: "Key Components",
    content: "The application is built with a component-based architecture, with several key components that handle different aspects of the functionality:\n\n- **App**: The root component that sets up routing and global context\n- **UserContext**: Manages user authentication state\n- **Dashboard**: Main interface after login\n- **APIService**: Handles all API communication",
    code: [
      {
        filename: "src/components/App.jsx",
        language: "jsx",
        content: "import React from 'react';\nimport { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport { UserProvider } from '../context/UserContext';\nimport Dashboard from './Dashboard';\nimport Login from './Login';\nimport NotFound from './NotFound';\n\nfunction App() {\n  return (\n    <UserProvider>\n      <BrowserRouter>\n        <Routes>\n          <Route path=\"/\" element={<Login />} />\n          <Route path=\"/dashboard\" element={<Dashboard />} />\n          <Route path=\"*\" element={<NotFound />} />\n        </Routes>\n      </BrowserRouter>\n    </UserProvider>\n  );\n}\n\nexport default App;",
        annotations: [
          { line: 3, comment: "The UserProvider wraps the entire app to provide global user state" },
          { line: 10, comment: "All components are wrapped in UserProvider for authentication context" },
          { line: 13, comment: "Login is the default landing page" },
          { line: 14, comment: "Dashboard is protected and requires authentication" },
          { line: 15, comment: "NotFound handles all unmatched routes" }
        ]
      }
    ]
  },
  {
    title: "Data Flow",
    content: "The application follows a unidirectional data flow pattern using React Context API for state management:\n\n1. User actions trigger events in components\n2. Event handlers call methods from service classes\n3. Services make API calls and return data\n4. Context providers update global state\n5. Components re-render with new data\n\nThis pattern ensures predictable state updates and makes debugging easier.",
    code: [
      {
        filename: "src/services/APIService.js",
        language: "javascript",
        content: "import axios from 'axios';\n\nconst API_URL = process.env.REACT_APP_API_URL;\n\nclass APIService {\n  constructor() {\n    this.client = axios.create({\n      baseURL: API_URL,\n      timeout: 10000,\n      headers: {\n        'Content-Type': 'application/json'\n      }\n    });\n  }\n\n  setAuthToken(token) {\n    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;\n  }\n\n  async login(credentials) {\n    try {\n      const response = await this.client.post('/auth/login', credentials);\n      const { token, user } = response.data;\n      this.setAuthToken(token);\n      return { token, user };\n    } catch (error) {\n      throw this.handleError(error);\n    }\n  }\n\n  handleError(error) {\n    if (error.response) {\n      return new Error(error.response.data.message || 'An error occurred');\n    }\n    return new Error('Network error');\n  }\n}\n\nexport default new APIService();",
        annotations: [
          { line: 7, comment: "Creates a configured axios instance for all API calls" },
          { line: 9, comment: "Sets a timeout to prevent indefinite waiting" },
          { line: 16, comment: "Method to set the auth token for authenticated requests" },
          { line: 20, comment: "Login method handles authentication with the backend" },
          { line: 24, comment: "Token is saved and used for subsequent requests" },
          { line: 31, comment: "Centralized error handling for consistent responses" }
        ]
      }
    ]
  },
  {
    title: "Authentication Flow",
    content: "The application uses JWT (JSON Web Tokens) for authentication:\n\n1. User submits login credentials\n2. Server validates credentials and returns a JWT\n3. Token is stored in memory and local storage\n4. Token is included in all subsequent API requests\n5. Protected routes check for valid token before rendering\n\nThis approach provides secure, stateless authentication that works well with the React application architecture.",
    code: [
      {
        filename: "src/context/UserContext.jsx",
        language: "jsx",
        content: "import React, { createContext, useState, useEffect } from 'react';\nimport APIService from '../services/APIService';\n\nexport const UserContext = createContext();\n\nexport const UserProvider = ({ children }) => {\n  const [user, setUser] = useState(null);\n  const [isLoading, setIsLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    // Check for saved token on app load\n    const token = localStorage.getItem('auth_token');\n    if (token) {\n      APIService.setAuthToken(token);\n      fetchUserProfile();\n    } else {\n      setIsLoading(false);\n    }\n  }, []);\n\n  const fetchUserProfile = async () => {\n    try {\n      const userData = await APIService.getUserProfile();\n      setUser(userData);\n    } catch (err) {\n      setError(err.message);\n      logout();\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const login = async (credentials) => {\n    setIsLoading(true);\n    try {\n      const { token, user } = await APIService.login(credentials);\n      localStorage.setItem('auth_token', token);\n      setUser(user);\n      return user;\n    } catch (err) {\n      setError(err.message);\n      throw err;\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const logout = () => {\n    localStorage.removeItem('auth_token');\n    setUser(null);\n    APIService.setAuthToken(null);\n  };\n\n  return (\n    <UserContext.Provider value={{ user, isLoading, error, login, logout }}>\n      {children}\n    </UserContext.Provider>\n  );\n};",
        annotations: [
          { line: 4, comment: "Creates the context that will be used throughout the app" },
          { line: 7, comment: "State for storing the authenticated user information" },
          { line: 11, comment: "Effect runs on app initialization to check for existing token" },
          { line: 13, comment: "Retrieves token from localStorage for persistence" },
          { line: 22, comment: "Function to fetch user profile with the stored token" },
          { line: 34, comment: "Login function handles the authentication process" },
          { line: 38, comment: "Stores token in localStorage for session persistence" },
          { line: 50, comment: "Logout function clears all authentication data" },
          { line: 56, comment: "Provider makes auth functions and state available to all components" }
        ]
      }
    ]
  }
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [walkthrough, setWalkthrough] = useState<CodeWalkthroughSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleSubmit = async (url: string, type: UrlType) => {
    try {
      // If we're already loading, don't submit again
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      // Clear previous walkthrough results before showing new ones
      setWalkthrough([]);
      
      // If demo mode is enabled, return the demo data after a brief delay
      if (isDemoMode) {
        console.log("Demo mode active, showing demo data");
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setWalkthrough(DEMO_WALKTHROUGH);
        setIsLoading(false);
        return;
      } 
      
      // For real API calls
      toast.success('Analyzing...', {
        description: `Processing ${type === 'github' ? 'repository' : 'documentation'} at ${url}`,
      });
      
      // Real API call
      let result: CodeWalkthroughSection[];
      
      if (type === 'github') {
        result = await analyzeRepository(url);
      } else {
        // Documentation analysis will return a friendly message from the API service
        result = await analyzeDocumentation(url);
        
        // Show a toast notification about docs feature being disabled
        if (result.length === 1 && result[0].title === "Documentation Analysis Unavailable") {
          toast.warning('Documentation Analysis Disabled', {
            description: 'The documentation analysis feature has been disabled. Please use GitHub repository analysis instead.',
          });
        }
      }
      
      setWalkthrough(result);
      
      toast.success('Success', {
        description: 'Walkthrough generated successfully',
      });
    } catch (err) {
      console.error('Error analyzing URL:', err);
      let errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Check if error is about repository size
      if (err instanceof Error && 
          err.message.includes('Repository must have at least 5 files')) {
        errorMsg = 'Repository must have at least 5 files for meaningful analysis';
      }
      
      setError(errorMsg);
      
      toast.error('Error', {
        description: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThreeBackground />
      
      <main className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[20vh] mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold text-[#E6EDF3] tracking-tight leading-tight text-center">
              Onboard.me
            </h1>
            <p className="mt-4 text-base md:text-lg text-[#8B949E] max-w-2xl text-center font-normal">
              Quickly understand any codebase with AI-powered analysis and documentation
            </p>
          </div>
          
          {/* Demo Mode Toggle */}
          <div className="absolute top-6 right-6 flex items-center space-x-2">
            <span className="text-xs text-[#8B949E]">Demo Mode</span>
            <Switch 
              checked={isDemoMode} 
              onCheckedChange={setIsDemoMode} 
              className="data-[state=checked]:bg-[#388BFD]" 
            />
          </div>
          
          <div className="relative max-w-2xl mx-auto mb-20">
            {/* Subtle glow behind the input */}
            <div className="absolute -inset-10 bg-[#388BFD]/5 blur-3xl rounded-full opacity-30 -z-10"></div>
            <UrlForm onSubmit={handleSubmit} isLoading={isLoading} />
            
            {isDemoMode && (
              <div className="mt-2 text-center">
                <span className="text-xs px-2 py-1 bg-[#388BFD]/10 text-[#388BFD] rounded-full">
                  Demo Mode Active
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="max-w-2xl mx-auto mt-8 p-4 bg-[#F85149]/10 text-[#F85149] rounded-md border border-[#F85149]/30">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="mt-16">
              <LoadingIndicator />
            </div>
          )}
          
          {!isLoading && walkthrough.length > 0 && (
            <div className="mt-16">
              <CodeWalkthrough sections={walkthrough} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
