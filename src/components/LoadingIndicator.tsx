'use client';

import { motion } from 'framer-motion';
import './LoadingIndicator.css'; // Import CSS for the cube animation
import { useState, useEffect } from 'react'; // Import useState and useEffect

const loadingPhrases = [
  {
    title: "Gitting your repo ready...",
    subtitle: "Fetching files at lightspeed"
  },
  {
    title: "I'm gonna git your API key!",
    subtitle: "You better watch out"
  },
  {
    title: "Gitting some moneyyyyy",
    subtitle: "Collecting the bag"
  },
  {
    title: "Gitting a grip on reality",
    subtitle: "It be like that sometimes"
  },
  {
    title: "Gitting the final picture...",
    subtitle: "Git ready for a masterpiece!"
  }
];

export default function LoadingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedSubtitle, setDisplayedSubtitle] = useState('');

  // Cycle through phrases
  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % loadingPhrases.length);
    }, 4000); // Slightly longer interval for typing + reading time

    return () => clearInterval(phraseInterval);
  }, []);

  // Typewriter effect for the current phrase
  useEffect(() => {
    const currentPhrase = loadingPhrases[phraseIndex];
    let titleIndex = 0;
    let subtitleIndex = 0;
    setDisplayedTitle(''); // Reset displayed text when phrase changes
    setDisplayedSubtitle('');

    const typingSpeed = 50; // Milliseconds per character

    // Type out title
    const titleInterval = setInterval(() => {
      setDisplayedTitle(currentPhrase.title.substring(0, titleIndex + 1));
      titleIndex++;
      if (titleIndex === currentPhrase.title.length) {
        clearInterval(titleInterval);
        
        // Start typing subtitle after title is done
        const subtitleInterval = setInterval(() => {
          setDisplayedSubtitle(currentPhrase.subtitle.substring(0, subtitleIndex + 1));
          subtitleIndex++;
          if (subtitleIndex === currentPhrase.subtitle.length) {
            clearInterval(subtitleInterval);
          }
        }, typingSpeed);
        // Ensure subtitle interval is cleared on cleanup
        return () => clearInterval(subtitleInterval);
      }
    }, typingSpeed);

    // Cleanup function to clear intervals if the phrase changes mid-typing
    return () => {
      clearInterval(titleInterval);
      // Need a way to clear the subtitle interval if it was started
      // This is tricky because it's nested. A simpler approach might be better.
      // Let's refactor slightly.
    };
  }, [phraseIndex]);

  // --- Refactored Typewriter Effect ---
  useEffect(() => {
    const currentPhrase = loadingPhrases[phraseIndex];
    let titleIndex = 0;
    let subtitleIndex = 0;
    let subtitleTypingStarted = false;
    let titleIntervalId: NodeJS.Timeout | null = null;
    let subtitleIntervalId: NodeJS.Timeout | null = null;

    setDisplayedTitle('');
    setDisplayedSubtitle('');

    const typingSpeed = 50;

    titleIntervalId = setInterval(() => {
      setDisplayedTitle(currentPhrase.title.substring(0, titleIndex + 1));
      titleIndex++;
      if (titleIndex >= currentPhrase.title.length) {
        clearInterval(titleIntervalId!);
        titleIntervalId = null;
        subtitleTypingStarted = true;
        subtitleIntervalId = setInterval(() => {
          setDisplayedSubtitle(currentPhrase.subtitle.substring(0, subtitleIndex + 1));
          subtitleIndex++;
          if (subtitleIndex >= currentPhrase.subtitle.length) {
            clearInterval(subtitleIntervalId!);
            subtitleIntervalId = null;
          }
        }, typingSpeed);
      }
    }, typingSpeed);

    // Combined cleanup function
    return () => {
      if (titleIntervalId) clearInterval(titleIntervalId);
      if (subtitleIntervalId) clearInterval(subtitleIntervalId);
    };
  }, [phraseIndex]);

  return (
    <div className="p-12 flex flex-col items-center justify-center space-y-8">
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
      
      {/* Text - Updated with typewriter effect */}
      <div className="space-y-3 text-center min-h-[70px]"> {/* Added min-height */}
        <p className="text-[#E6EDF3] text-2xl font-semibold">
          {displayedTitle}
          <span className="animate-pulse">|</span> {/* Blinking cursor */}
        </p>
        <p className="text-lg text-[#8B949E]">
          {displayedSubtitle}
          {/* Add cursor to subtitle only when title is done and subtitle is typing/done */}
          {displayedTitle.length === loadingPhrases[phraseIndex].title.length && 
           <span className="animate-pulse">|</span>}
        </p>
      </div>
      
      {/* Optional: Add a subtle progress-like element if desired */}
      {/* <div className="w-full h-1 bg-[#30363D] rounded-full overflow-hidden">
        <div className="h-full bg-purple-600 animate-pulse rounded-full"></div>
      </div> */}
    </div>
  );
} 