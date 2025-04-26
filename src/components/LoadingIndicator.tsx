'use client';

import { motion } from 'framer-motion';

export default function LoadingIndicator() {
  return (
    <motion.div 
      className="w-full max-w-md mx-auto bg-white rounded-3xl bubble-shadow overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 flex flex-col items-center justify-center space-y-6">
        {/* Loading dots */}
        <div className="flex justify-center items-center space-x-2 my-4">
          <span className="h-3 w-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="h-3 w-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="h-3 w-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        
        {/* Text */}
        <div className="space-y-2 text-center">
          <p className="text-slate-800 text-base font-medium">
            Analyzing repository
          </p>
          <p className="text-xs text-slate-500">
            Processing code structure and generating documentation
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600/70 rounded-full animate-progress"></div>
        </div>
      </div>
    </motion.div>
  );
} 