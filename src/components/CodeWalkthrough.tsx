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
      {/* Walkthrough container - uses a layout that shifts files left when a file is selected */}
      <div ref={deckRef} className="relative w-full mb-10">
        {allCodeFiles.length === 0 ? (
          <div className="w-full text-center py-10 text-slate-700">
            No code files available
          </div>
        ) : (
          <div className={`w-full flex items-start transition-all duration-500 ease-in-out ${selectedFile !== null ? 'justify-between' : 'justify-center'}`}>
            {/* Files grid - shifts left and becomes narrower when a file is selected */}
            <motion.div 
              className="relative"
              animate={{ 
                width: selectedFile !== null ? '40%' : '100%',
                maxWidth: selectedFile !== null ? '500px' : '1200px',
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-wrap justify-center gap-4 my-8">
                {/* Simple grid layout for files */}
                {allCodeFiles.map((file, index) => {
                  // Find section for this file
                  const sectionIndex = sections.findIndex(s => 
                    s.title === (file.sectionTitle || ''));
                  
                  // Color based on section
                  const colors = ['#8A2BE2', '#FF1493', '#00CED1', '#32CD32'];
                  const color = colors[Math.max(0, sectionIndex) % colors.length];
                  
                  const isHovered = hoveredFile === index;
                  const isSelected = selectedFile === index;
                  
                  return (
                    <motion.div 
                      key={`file-${index}`}
                      className="cursor-pointer"
                      style={{ width: selectedFile !== null ? '160px' : '240px' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: isSelected ? 1.05 : isHovered ? 1.02 : 1,
                        width: selectedFile !== null ? '160px' : '240px',
                        boxShadow: isSelected || isHovered ? '0 8px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.2)'
                      }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onHoverStart={() => !isSelected && setHoveredFile(index)}
                      onHoverEnd={() => setHoveredFile(null)}
                      onClick={() => setSelectedFile(index)}
                    >
                      <div className={`rounded-md border-2 overflow-hidden ${
                        isSelected ? 'bg-[#1C2F45]/90' : 'bg-[#161B22]/90'
                      } backdrop-blur-sm`}
                      style={{ borderColor: color }}>
                        {/* Card header */}
                        <div className="px-3 py-2 border-b border-[#30363D] flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                            <span className="font-mono text-xs text-[#E6EDF3] truncate max-w-[140px]">
                              {file.filename.split('/').pop()}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8B949E]">{getFileExtension(file.filename)}</span>
                        </div>
                        
                        {/* Card preview */}
                        <div className={`overflow-hidden p-2 transition-all duration-300 ${selectedFile !== null ? 'h-[60px]' : 'h-[80px]'}`}>
                          <pre className="text-[9px] font-mono text-[#8B949E] overflow-hidden line-clamp-4">
                            <code>{file.content.split('\n').slice(0, 4).join('\n')}</code>
                          </pre>
                        </div>
                        
                        {/* Section reference */}
                        {file.sectionTitle && (
                          <div className="px-3 py-1 text-[10px] border-t border-[#30363D] bg-[#0D1117] text-[#8B949E]">
                            {file.sectionTitle}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
            
            {/* Selected file detail view - slides in from right */}
            <AnimatePresence>
              {selectedFile !== null && (
                <motion.div
                  initial={{ opacity: 0, x: 100, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '55%' }}
                  exit={{ opacity: 0, x: 100, width: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative max-w-[800px]"
                >
                  <Card className="w-full border border-[#30363D] bg-[#0D1117]/80 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
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
                          {allCodeFiles[selectedFile].sectionTitle && (
                            <p className="mt-2 text-sm text-[#8B949E]">
                              From section: {allCodeFiles[selectedFile].sectionTitle}
                            </p>
                          )}
                        </div>
                        
                        <div className="p-5 bg-gradient-to-b from-[#0D1117]/95 to-[#0D1117]/80">
                          {allCodeFiles[selectedFile].sectionContent && (
                            <div className="prose prose-invert max-w-none mb-6 prose-p:text-[#C9D1D9] prose-headings:text-[#E6EDF3] prose-a:text-[#58A6FF] prose-code:text-[#79C0FF] prose-strong:text-[#E6EDF3] text-sm">
                              <ReactMarkdown>{allCodeFiles[selectedFile].sectionContent}</ReactMarkdown>
                            </div>
                          )}
                          
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
          </div>
        )}
      </div>
      
      {/* Visual guide to instruct users */}
      {selectedFile === null && allCodeFiles.length > 0 && (
        <div className="text-center text-slate-600 mt-4 pointer-events-none">
          <div className="text-sm">Click on a file to view details</div>
        </div>
      )}
    </div>
  );
} 