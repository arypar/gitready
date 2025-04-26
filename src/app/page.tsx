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
  const [hasSentFirstQuery, setHasSentFirstQuery] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

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
        result = await analyzeDocumentation(url);
      }
      
      setWalkthrough(result);
      
      toast.success('Success', {
        description: 'Walkthrough generated successfully',
      });
    } catch (err) {
      console.error('Error analyzing URL:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      
      toast.error('Error', {
        description: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logo elements with emoji
  const logoTitle = (
    <div className="flex items-center gap-2">
      <div>
        <span className="text-black font-extrabold tracking-tight">Git</span>
        <span className="text-purple-600 font-extrabold tracking-tight">Freaky</span>
      </div>
      <motion.div 
        whileHover={{ rotate: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <span className="text-4xl">🐈‍⬛</span>
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-purple-50 font-sans overflow-hidden">
      {/* Background overlay for React Flow */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#0D1117] to-[#161B22] opacity-90"></div>
      {/* Demo Mode Toggle - Always visible at the top */}
      <div className="absolute top-2 right-4 z-50 flex items-center space-x-2">
        <span className="text-xs font-medium text-slate-700">Demo Mode</span>
        <CustomSwitch 
          checked={isDemoMode} 
          onCheckedChange={setIsDemoMode} 
        />
      </div>
      
      <AnimatePresence>
        {/* Initial centered content - Animates out on first message */}
        {!hasSentFirstQuery && !isTransitioning && (
          <motion.div 
            className="flex flex-col justify-center items-center absolute inset-0 z-10 bg-purple-50"
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
                <h1 className="text-4xl font-extrabold tracking-tight">{logoTitle}</h1>
              </motion.div>
              
              <motion.p 
                className="text-xl text-slate-600 text-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Understand any codebase with AI
              </motion.p>
            </motion.div>
            
            {/* Chat input for initial screen */}
            <div className="w-full max-w-xl px-4">
              <motion.div layoutId="chat-input">
                <ChatInputForm onSubmit={handleSubmit} isLoading={isLoading} />
              </motion.div>
            </div>
            
            {isDemoMode && (
              <div className="mt-2 text-center">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                  Demo Mode Active
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fixed form at the top - Animates in after first query */}
      <motion.div 
        className="sticky top-0 z-20 bg-purple-50 pt-6 pb-3 px-4 md:pt-8 mt-2 md:mt-0"
        initial={!hasSentFirstQuery && !isTransitioning ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-xl mx-auto">
          {/* Small logo - only visible after first query */}
          {(hasSentFirstQuery || isTransitioning) && (
            <motion.div 
              className="flex items-center justify-center gap-1 mb-2"
              layoutId="app-logo"
            >
              <h3 className="text-lg font-bold tracking-tight">{logoTitle}</h3>
            </motion.div>
          )}
          
          {/* Chat input for transitioned state */}
          {(hasSentFirstQuery || isTransitioning) && (
            <motion.div layoutId="chat-input">
              <ChatInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-28 pt-4">
        {/* Loading and Error Messages - Keep centered */}
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          {/* Loading Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
              >
                <LoadingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 p-4 bg-red-50 text-red-500 rounded-3xl border border-red-200"
              >
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          
        {/* Walkthrough Content - Full width */}
        <AnimatePresence>
          {!isLoading && walkthrough.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: showContent ? 1 : 0,
                transition: {
                  opacity: { duration: 0.3, delay: 0.05 }
                }
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full mt-8 px-4 md:px-6 lg:px-8"
            >
              <CodeWalkthrough sections={walkthrough} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
