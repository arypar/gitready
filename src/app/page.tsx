'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import ChatInputForm from '@/components/chatbox-ui';
import LoadingIndicator from '@/components/LoadingIndicator';
import CodeWalkthrough from '@/components/CodeWalkthrough';
import { analyzeRepository, analyzeDocumentation, CodeWalkthroughSection, UrlType } from '@/services/api';
import { Switch } from '@/components/ui/switch';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  const [repositorySummary, setRepositorySummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSentFirstQuery, setHasSentFirstQuery] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);

  // When transitioning state or walkthrough changes, manage visibility of content
  useEffect(() => {
    if (isTransitioning) {
      setShowContent(false);
    } else if (hasSentFirstQuery && walkthrough.length > 0) {
      // Delay showing content until the transition animation completes
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, hasSentFirstQuery, walkthrough]);

  const handleSubmit = async (url: string, type: UrlType) => {
    try {
      // If we're already loading, don't submit again
      if (isLoading) return;
      
      if (!hasSentFirstQuery) {
        // Start transition animation
        setIsTransitioning(true);
        
        // Wait for animation to complete before changing the state
        setTimeout(() => {
          setHasSentFirstQuery(true);
          setIsTransitioning(false);
        }, 600);
      }
      
      setIsLoading(true);
      setError(null);
      setRepositorySummary(null);
      setAnalyzedUrl(url);
      
      // Clear previous walkthrough results before showing new ones
      setWalkthrough([]);
      
      // For real API calls
      toast.success('Gitting Ready...', {
        description: `Processing ${type === 'github' ? 'repository' : 'documentation'} at ${url}`,
      });
      
      // Real API call
      let resultSections: CodeWalkthroughSection[];
      let resultSummary: string | null = null;
      
      if (type === 'github') {
        // Assume analyzeRepository might return an object with sections and summary
        const response = await analyzeRepository(url) as any; // Use type assertion
        // Check if response has sections and summary structure or is just sections array
        if (response && Array.isArray(response.sections)) {
          resultSections = response.sections;
          resultSummary = response.summary || null;
        } else if (Array.isArray(response)) {
          // Handle case where only sections are returned (original behavior)
          resultSections = response;
        } else {
          throw new Error("Unexpected API response format");
        }
      } else {
        // Documentation analysis will return a friendly message from the API service
        resultSections = await analyzeDocumentation(url);
        
        // Show a toast notification about docs feature being disabled
        if (resultSections.length === 1 && resultSections[0].title === "Documentation Analysis Unavailable") {
          toast.warning('Documentation Analysis Disabled', {
            description: 'The documentation analysis feature has been disabled. Please use GitHub repository analysis instead.',
          });
        }
      }
      
      setWalkthrough(resultSections);
      setRepositorySummary(resultSummary);
      
      toast.success('Ready!', {
        description: 'Walkthrough generated successfully. Git ready!',
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

  // Helper to extract repo name from URL
  const getRepoNameFromUrl = (url: string | null): string => {
    if (!url) return 'Repository';
    try {
      const path = new URL(url).pathname.split('/');
      // Handle URLs like github.com/org/repo or github.com/org/repo/...
      if (path.length >= 3 && path[1] && path[2]) {
        return `${path[1]} / ${path[2]}`;
      }
    } catch (e) {
      // Fallback if URL parsing fails
    }
    return url.split('/').slice(-2).join('/') || 'Repository'; // Simple fallback
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1117] text-[#C9D1D9] font-sans overflow-hidden">
      {/* Background overlay for React Flow */}
      <div className="fixed inset-0 z-[-1] bg-[#0D1117] opacity-90"></div>
      
      <AnimatePresence>
        {/* Initial centered content - Animates out on first message */}
        {!hasSentFirstQuery && !isTransitioning && (
          <motion.div 
            className="flex flex-col justify-center items-center absolute inset-0 z-10 bg-[#0D1117]"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            <motion.div 
              className="mb-6 mt-[-80px]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div 
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                layoutId="app-logo"
              >
                <h1 className="text-4xl font-extrabold tracking-tight">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[#E6EDF3] font-extrabold tracking-tight">Git</span>
                      <span className="text-purple-400 font-extrabold tracking-tight">Ready</span>
                    </div>
                    <motion.div 
                      whileHover={{ rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <span className="text-4xl">🐈‍⬛</span>
                    </motion.div>
                  </div>
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-xl text-[#8B949E] text-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Understand any codebase with AI
              </motion.p>
            </motion.div>
            
            {/* Chat input for initial screen */}
            <div className="w-full max-w-xl px-4">
              <ChatInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content area (appears after first query) */}
      <div className="flex flex-col flex-grow p-4 md:p-6 space-y-4">
        {/* Top section: Logo and Repo Name (No Input Form) */}
        {(hasSentFirstQuery || isTransitioning) && (
          <motion.div 
            className="flex flex-col items-center w-full mb-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */} 
            <motion.div layoutId="app-logo">
              <h1 className="text-2xl font-extrabold tracking-tight">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[#E6EDF3] font-extrabold tracking-tight">Git</span>
                    <span className="text-purple-400 font-extrabold tracking-tight">Ready</span>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <span className="text-3xl">🐈‍⬛</span>
                  </motion.div>
                </div>
              </h1>
            </motion.div>
            
            {/* Display Repo Name Link Below Logo */}
            <a 
              href={analyzedUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-1 bg-[#21262D] border border-[#30363D] rounded-lg shadow-sm hover:bg-[#30363D] transition-colors duration-200"
            >
              <h2 className="text-lg font-medium text-[#A0AEC0] hover:text-[#E6EDF3]">
                {getRepoNameFromUrl(analyzedUrl)}
              </h2>
            </a>
          </motion.div>
        )}

        {/* Bottom section: Loading/Error/Walkthrough */}
        <div className="flex-grow flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingIndicator />
              </motion.div>
            )}
            {!isLoading && error && (
              <motion.div 
                key="error"
                className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg border border-red-600/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </motion.div>
            )}
            {!isLoading && !error && walkthrough.length > 0 && showContent && (
              <motion.div 
                key="walkthrough"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CodeWalkthrough sections={walkthrough} repositorySummary={repositorySummary} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Another Repo Button */}
        {!isLoading && walkthrough.length > 0 && showContent && (
          <div className="flex justify-center mt-6 pb-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
            >
              Search Another Repository
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
