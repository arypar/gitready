'use client';

import { motion } from 'framer-motion';
import './LoadingIndicator.css'; // Import CSS for the cube animation

export default function LoadingIndicator() {
  return (
    <div className="p-8 flex flex-col items-center justify-center space-y-6">
      {/* Rotating Cube Animation */}
      <div className="scene">
        <div className="cube-wrapper">
          <div className="cube">
            <div className="cube-faces cube-face-front"></div>
            <div className="cube-faces cube-face-back"></div>
            <div className="cube-faces cube-face-right"></div>
            <div className="cube-faces cube-face-left"></div>
            <div className="cube-faces cube-face-top"></div>
            <div className="cube-faces cube-face-bottom"></div>
          </div>
        </div>
      </div>
      
      {/* Text */}
      <div className="space-y-2 text-center">
        <p className="text-[#E6EDF3] text-lg font-semibold">
          Gitting your repo ready...
        </p>
        <p className="text-sm text-[#8B949E]">
          Parsing code structure and preparing your walkthrough.
        </p>
      </div>
      
      {/* Optional: Add a subtle progress-like element if desired */}
      {/* <div className="w-full h-1 bg-[#30363D] rounded-full overflow-hidden">
        <div className="h-full bg-purple-600 animate-pulse rounded-full"></div>
      </div> */}
    </div>
  );
} 