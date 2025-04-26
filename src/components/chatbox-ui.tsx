"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, AlertCircle, Github } from "lucide-react"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UrlType } from "@/services/api"
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ChatInputFormProps {
  onSubmit: (url: string, type: UrlType) => void;
  isLoading: boolean;
}

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' })
});

export default function ChatInputForm({ onSubmit, isLoading }: ChatInputFormProps) {
  const [input, setInput] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const placeholders = [
    "https://github.com/facebook/react",
    "https://github.com/vercel/next.js",
    "https://github.com/microsoft/TypeScript",
    "https://github.com/tailwindlabs/tailwindcss",
    "https://github.com/openai/whisper",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % placeholders.length)
        setIsPlaceholderVisible(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [placeholders.length])

  // Auto-detect URL type
  const detectUrlType = (url: string): UrlType | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('github.com')) {
        return 'github';
      } else {
        return 'docs';
      }
    } catch (e) {
      return null;
    }
  };

  const validateUrl = (url: string): boolean => {
    // Clear any existing error message
    setErrorMessage(null)
    
    // Trim the input to remove whitespace
    const trimmedUrl = url.trim()
    
    // Check if URL is too short
    if (trimmedUrl.length < 10) {
      setErrorMessage("Please enter a complete URL")
      return false
    }
    
    // Check if URL looks like a GitHub repository
    if (!trimmedUrl.includes('github.com') && !trimmedUrl.includes('docs')) {
      setErrorMessage("Please enter a GitHub repository URL or documentation link")
      return false
    }
    
    try {
      new URL(trimmedUrl);
      return true;
    } catch (e) {
      setErrorMessage("Please enter a valid URL")
      return false;
    }
  }

  const handleSend = () => {
    if (input.trim()) {
      if (validateUrl(input)) {
        const type = detectUrlType(input);
        if (type) {
          onSubmit(input.trim(), type);
          setInput("");
        } else {
          setErrorMessage("Could not determine URL type");
        }
      }
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Clear error when user starts typing again
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div 
        className="relative bg-[#21262D] rounded-full border border-[#30363D] shadow-md text-white"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2
        }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
          <Github className="w-5 h-5" />
        </div>
        <Input
          value={input}
          onChange={onInputChange}
          placeholder={placeholders[placeholderIndex]}
          className="pl-10 pr-12 py-6 text-base text-[#E6EDF3] bg-transparent border-none placeholder:text-[#6E7681] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
          style={{
            opacity: isPlaceholderVisible ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              size="icon"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors duration-200 rounded-full w-10 h-10"
              disabled={isLoading || !input}
              onClick={handleSend}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            className="flex items-center px-3 py-2 mt-2 bg-red-900/40 text-red-300 text-xs rounded-lg border border-red-600/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="text-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <p className="text-xs text-[#8B949E]">
          {isLoading ? 'Analysis in progress...' : 'Enter a GitHub repository URL or documentation link'}
        </p>
      </motion.div>
    </div>
  )
} 