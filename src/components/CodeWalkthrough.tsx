'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Enhanced code type with line-specific annotations
interface CodeWithAnnotations {
  filename: string;
  language: string;
  content: string;
  annotations?: {
    line: number;
    comment: string;
  }[];
}

interface CodeWalkthroughProps {
  sections: {
    title: string;
    content: string;
    code?: CodeWithAnnotations[];
  }[];
}

export default function CodeWalkthrough({ sections }: CodeWalkthroughProps) {
  // Flatten all code files from all sections
  const allCodeFiles = sections.flatMap(section => 
    section.code ? section.code.map(codeFile => ({
      ...codeFile,
      sectionTitle: section.title,
      sectionContent: section.content
    })) : []
  );
  
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  // Function to add line numbers and highlight annotated lines
  const prepareCodeLines = (code: string, annotations?: { line: number; comment: string }[]) => {
    const lines = code.split('\n');
    const hasAnnotations = annotations && annotations.length > 0;
    
    return {
      code,
      lines,
      hasAnnotations,
      annotatedLines: annotations ? new Set(annotations.map(a => a.line)) : new Set(),
      getAnnotationForLine: (lineNum: number) => 
        annotations?.find(a => a.line === lineNum)?.comment || null
    };
  };

  // Custom renderer that combines syntax highlighting with annotations
  const CodeRenderer = ({ 
    code, 
    language, 
    annotations 
  }: { 
    code: string, 
    language: string, 
    annotations?: { line: number; comment: string }[] 
  }) => {
    const codeWithAnnotations = prepareCodeLines(code, annotations);
    
    return (
      <div className="bg-gradient-to-b from-[#0D1117] to-[#0D1117]/95 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-[#30363D] scrollbar-track-transparent">
        <table className="min-w-full border-collapse">
          <tbody>
            {code.split('\n').map((line, lineIdx) => {
              const lineNumber = lineIdx + 1;
              const hasAnnotation = codeWithAnnotations.annotatedLines.has(lineNumber);
              const annotation = codeWithAnnotations.getAnnotationForLine(lineNumber);
              
              return (
                <tr key={lineIdx} className={hasAnnotation ? "bg-[#1C2F45]/50 backdrop-blur-sm" : "hover:bg-[#161B22]/40"}>
                  <td className="text-right py-0 pr-4 pl-4 border-r border-[#30363D] text-[#6E7681] select-none w-[1%] font-mono text-xs">
                    {lineNumber}
                  </td>
                  <td className="py-0.5 px-4 font-mono text-sm whitespace-pre">
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{ 
                        margin: 0,
                        padding: 0, 
                        background: 'transparent',
                        fontSize: 'inherit',
                        lineHeight: '1.5'
                      }}
                      wrapLines={true}
                    >
                      {line}
                    </SyntaxHighlighter>
                  </td>
                  <td className="w-[30%] pl-4 py-0 text-xs text-[#58A6FF]">
                    {hasAnnotation && (
                      <div className="bg-[#1F2937]/80 p-2 rounded border-l-2 border-[#388BFD] shadow-sm backdrop-blur-sm">
                        {annotation}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const getFileColor = (filename: string) => {
    const ext = getFileExtension(filename);
    const colors: Record<string, string> = {
      js: '#F1E05A',
      jsx: '#61DAFB',
      ts: '#3178C6',
      tsx: '#3178C6',
      css: '#563D7C',
      html: '#E34C26',
      json: '#F1E05A',
      md: '#083FA1',
      py: '#3572A5',
      rb: '#701516',
      java: '#B07219',
      php: '#4F5D95',
      go: '#00ADD8',
      rs: '#DEA584',
      c: '#555555',
      cpp: '#F34B7D',
      cs: '#178600',
    };
    
    return colors[ext] || '#8B949E';
  };

  return (
    <div className="w-full">
      {/* Card deck */}
      <div ref={deckRef} className="relative w-full min-h-[220px]">
        {allCodeFiles.length === 0 ? (
          <div className="w-full text-center py-10 text-slate-700">
            No code files available
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="relative w-full h-[220px]">
              {/* Spread cards */}
              {allCodeFiles.map((file, index) => {
                // Calculate position for spread effect
                const totalWidth = deckRef.current?.clientWidth || 800;
                const cardWidth = Math.min(280, totalWidth / 4);
                const spreadWidth = Math.min(totalWidth - cardWidth, allCodeFiles.length * 40);
                const step = allCodeFiles.length > 1 ? spreadWidth / (allCodeFiles.length - 1) : 0;
                const xPos = (index * step) - (spreadWidth / 2) + (cardWidth / 2);
                
                // Calculate rotation for fan effect
                const maxRotation = 5;
                const midpoint = (allCodeFiles.length - 1) / 2;
                const rotationStep = allCodeFiles.length > 1 ? maxRotation * 2 / (allCodeFiles.length - 1) : 0;
                const rotation = (index - midpoint) * rotationStep;
                
                const isHovered = hoveredFile === index;
                const isSelected = selectedFile === index;
                const zIndex = isHovered || isSelected ? 50 : 10 + index;
                const yOffset = isHovered ? -20 : 0;
                
                const fileColor = getFileColor(file.filename);
                
                return (
                  <motion.div 
                    key={`file-${index}`}
                    className="absolute origin-bottom cursor-pointer"
                    style={{ 
                      left: `calc(50% + ${xPos}px)`,
                      zIndex, 
                      width: `${cardWidth}px`,
                      transform: `translateX(-50%) rotate(${rotation}deg)`,
                    }}
                    initial={{ y: 0 }}
                    animate={{ 
                      y: yOffset,
                      scale: isSelected ? 1 : isHovered ? 1.05 : 1,
                      filter: isHovered ? 'brightness(1.2)' : 'brightness(1)'
                    }}
                    transition={{ duration: 0.2 }}
                    onHoverStart={() => !isSelected && setHoveredFile(index)}
                    onHoverEnd={() => setHoveredFile(null)}
                    onClick={() => setSelectedFile(index)}
                  >
                    <div className={`w-full h-[180px] rounded-md shadow-lg border border-[#30363D] ${
                      isSelected ? 'bg-[#1C2F45]/90' : 'bg-[#161B22]/90'
                    } backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-200`}>
                      {/* Card header */}
                      <div className="h-10 px-3 border-b border-[#30363D] flex items-center justify-between bg-gradient-to-r from-[#161B22] to-[#0D1117]">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: fileColor }}></div>
                          <span className="font-mono text-xs text-[#E6EDF3] truncate max-w-[180px]">
                            {file.filename.split('/').pop()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8B949E]">{getFileExtension(file.filename)}</span>
                      </div>
                      
                      {/* Card preview */}
                      <div className="h-[140px] overflow-hidden p-3 bg-gradient-to-b from-[#161B22] to-[#0D1117]">
                        <pre className="text-[10px] font-mono text-[#8B949E] overflow-hidden line-clamp-[13]">
                          <code>{file.content.split('\n').slice(0, 15).join('\n')}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Selected file detail view */}
      <AnimatePresence>
        {selectedFile !== null && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="mt-10 relative"
          >
            <Card className="w-full mx-auto border border-[#30363D] bg-[#0D1117]/80 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute top-3 right-3 z-10">
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-full bg-[#161B22]/80 text-[#8B949E] border border-[#30363D] hover:bg-[#1C2F45]/80 hover:text-[#E6EDF3] transition-all duration-200"
                >
                  <X size={16} />
                </button>
              </div>
              
              {selectedFile !== null && allCodeFiles[selectedFile] && (
                <>
                  <div className="p-5 border-b border-[#30363D] bg-gradient-to-r from-[#161B22]/90 to-[#0D1117]/90">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2.5" 
                        style={{ backgroundColor: getFileColor(allCodeFiles[selectedFile].filename) }}
                      ></div>
                      <h2 className="text-lg font-medium text-[#E6EDF3] font-mono">
                        {allCodeFiles[selectedFile].filename}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm text-[#8B949E]">
                      From section: {allCodeFiles[selectedFile].sectionTitle}
                    </p>
                  </div>
                  
                  <div className="p-5 bg-gradient-to-b from-[#0D1117]/95 to-[#0D1117]/80">
                    <div className="prose prose-invert max-w-none mb-6 prose-p:text-[#C9D1D9] prose-headings:text-[#E6EDF3] prose-a:text-[#58A6FF] prose-code:text-[#79C0FF] prose-strong:text-[#E6EDF3] text-sm">
                      <ReactMarkdown>{allCodeFiles[selectedFile].sectionContent}</ReactMarkdown>
                    </div>
                    
                    <div className="relative">
                      <div className="flex justify-between items-center bg-[#161B22] text-xs px-3 py-2 rounded-t-md border-t border-x border-[#30363D]">
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F85149] mr-1.5"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-[#DAAA3F] mr-1.5"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-[#3FB950] mr-1.5"></div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className="font-mono text-xs ml-2 cursor-help text-[#8B949E]">
                                {allCodeFiles[selectedFile].filename}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72 bg-[#161B22] border border-[#30363D] text-[#C9D1D9]">
                              <div className="flex flex-col space-y-1.5">
                                <h4 className="text-sm font-medium text-[#58A6FF]">
                                  Language: {allCodeFiles[selectedFile].language}
                                </h4>
                                <p className="text-xs text-[#8B949E]">
                                  Look for comment bubbles next to important lines
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </div>
                      
                      <div className="relative border-x border-b border-[#30363D] rounded-b-md overflow-hidden">
                        <CodeRenderer
                          code={allCodeFiles[selectedFile].content}
                          language={allCodeFiles[selectedFile].language}
                          annotations={allCodeFiles[selectedFile].annotations}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual guide to instruct users */}
      {selectedFile === null && allCodeFiles.length > 0 && (
        <div className="absolute top-[120px] left-1/2 transform -translate-x-1/2 text-center text-slate-600 animate-pulse pointer-events-none">
          <div className="text-sm">Click on a file to view details</div>
        </div>
      )}
    </div>
  );
} 