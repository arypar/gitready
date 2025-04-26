'use client';

import { Card } from '@/components/ui/card';

export default function LoadingIndicator() {
  return (
    <Card className="w-full max-w-md mx-auto bg-[#0D1117]/80 border border-[#30363D] backdrop-blur-md rounded-md">
      <div className="p-6 flex flex-col items-center justify-center space-y-6">
        {/* Loading spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-transparent border-t-[#388BFD] rounded-full animate-spin" 
               style={{ animationDuration: '1s' }}></div>
          <div className="absolute inset-2 border-2 border-transparent border-l-[#388BFD]/60 rounded-full animate-spin" 
               style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#388BFD] rounded-full"></div>
          </div>
        </div>
        
        {/* Text */}
        <div className="space-y-2 text-center">
          <p className="text-[#E6EDF3] text-base font-medium">
            Analyzing repository
          </p>
          <p className="text-xs text-[#8B949E]">
            Processing code structure and generating documentation
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#161B22] rounded-full overflow-hidden">
          <div className="h-full bg-[#388BFD]/60 rounded-full animate-progress"></div>
        </div>
        
        {/* Animation keyframes */}
        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            20% { width: 20%; }
            40% { width: 45%; }
            60% { width: 65%; }
            80% { width: 85%; }
            95% { width: 95%; }
            100% { width: 98%; }
          }
          .animate-progress {
            animation: progress 20s ease-out forwards;
          }
        `}</style>
      </div>
    </Card>
  );
} 