'use client';

import { motion } from 'framer-motion';
import './LoadingIndicator.css'; // Import CSS for the cube animation
import { useState, useEffect } from 'react'; // Import useState and useEffect

const loadingPhrases = [
  {
    title: "Gitting your repo ready...",
    subtitle: "Fetching files faster than a git commit!"
  },
  {
    title: "Gitting the AI warmed up...",
    subtitle: "It's gitting smarter by the second!"
  },
  {
    title: "Gitting dependency insights...",
    subtitle: "Hope this doesn\'t cause merge conflicts... Git it?"
  },
  {
    title: "Gitting code intel...",
    subtitle: "Almost ready to show you the code story. Git excited!"
  },
  {
    title: "Gitting the final picture...",
    subtitle: "Git ready for a masterpiece!"
  }
];

export default function LoadingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle through phrases every 3.5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % loadingPhrases.length);
    }, 3500);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const currentPhrase = loadingPhrases[phraseIndex];

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
      
      {/* Text - Updated to cycle */}
      <div className="space-y-2 text-center">
        <p className="text-[#E6EDF3] text-lg font-semibold">
          {currentPhrase.title}
        </p>
        <p className="text-sm text-[#8B949E]">
          {currentPhrase.subtitle}
        </p>
      </div>
      
      {/* Optional: Add a subtle progress-like element if desired */}
      {/* <div className="w-full h-1 bg-[#30363D] rounded-full overflow-hidden">
        <div className="h-full bg-purple-600 animate-pulse rounded-full"></div>
      </div> */}
    </div>
  );
} 