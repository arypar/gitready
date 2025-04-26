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
  // Group code files by filename to avoid duplication
  const groupedCodeFiles = sections.reduce((acc, section) => {
    if (!section.code) return acc;
    
    section.code.forEach(codeFile => {
      const existingIndex = acc.findIndex(item => item.filename === codeFile.filename);
      
      if (existingIndex >= 0) {
        // File already exists, add section reference
        acc[existingIndex].sections.push({
          title: section.title,
          content: section.content,
          annotations: codeFile.annotations || []
        });
      } else {
        // New file
        acc.push({
          ...codeFile,
          sections: [{
            title: section.title,
            content: section.content,
            annotations: codeFile.annotations || []
          }]
        });
      }
    });
    
    return acc;
  }, [] as Array<CodeWithAnnotations & { 
    sections: Array<{ 
      title: string; 
      content: string; 
      annotations: { line: number; comment: string; }[] 
    }> 
  }>);
  
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);
  const [gridView, setGridView] = useState<boolean>(false);
  const deckRef = useRef<HTMLDivElement>(null);

  // When changing selected file, reset to first section
  useEffect(() => {
    setSelectedSection(0);
  }, [selectedFile]);
  
  // Switch to grid view if there are many files
  useEffect(() => {
    if (groupedCodeFiles.length > 8) {
      setGridView(true);
    }
  }, [groupedCodeFiles.length]);

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
      <div className="bg-[#0D1117] overflow-auto max-h-[600px]">
        <table className="min-w-full border-collapse">
          <tbody>
            {code.split('\n').map((line, lineIdx) => {
              const lineNumber = lineIdx + 1;
              const hasAnnotation = codeWithAnnotations.annotatedLines.has(lineNumber);
              const annotation = codeWithAnnotations.getAnnotationForLine(lineNumber);
              
              return (
                <tr key={lineIdx} className={hasAnnotation ? "bg-[#1C2F45]" : ""}>
                  <td className="text-right py-0 pr-4 pl-4 border-r border-[#30363D] text-[#6E7681] select-none w-[1%] font-mono text-xs">
                    {lineNumber}
                  </td>
                  <td className="py-0 px-4 font-mono text-sm whitespace-pre">
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
                  <td className="w-[40%] pl-4 py-0">
                    {hasAnnotation && (
                      <div className="bg-[#388BFD]/10 p-2.5 rounded text-[#58A6FF] text-xs border-l-2 border-[#388BFD]">
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

  // Get an icon for the file type
  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    
    switch (ext) {
      case 'js':
        return '📄 JS';
      case 'jsx':
        return '⚛️ JSX';
      case 'ts':
        return '📘 TS';
      case 'tsx':
        return '⚛️ TSX';
      case 'py':
        return '🐍 PY';
      case 'rb':
        return '💎 RB';
      case 'go':
        return '🐹 GO';
      case 'java':
        return '☕ JAVA';
      case 'php':
        return '🐘 PHP';
      case 'c':
      case 'cpp':
      case 'h':
        return '⚙️ C/C++';
      case 'cs':
        return '🔷 C#';
      default:
        return '📄 CODE';
    }
  };

  return (
    <div className="relative mt-10 pb-10">
      {/* Virtual table surface */}
      <div className="relative w-full min-h-[500px] bg-gradient-to-b from-[#0D1117] to-[#161B22] rounded-lg p-10 border border-[#30363D] overflow-hidden shadow-2xl">
        {/* Slight glow/reflection effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#388BFD]/5 to-transparent"></div>
        
        {/* View toggle */}
        <div className="absolute top-5 right-5">
          <button
            onClick={() => setGridView(!gridView)}
            className="px-3 py-1 bg-[#161B22] text-[#8B949E] rounded-md border border-[#30363D] text-xs hover:bg-[#21262D]"
          >
            {gridView ? 'Card View' : 'Grid View'}
          </button>
        </div>
        
        {/* Card deck or Grid view */}
        <div ref={deckRef} className="relative w-full">
          {groupedCodeFiles.length === 0 ? (
            <div className="w-full text-center py-20 text-[#8B949E]">
              No code files available
            </div>
          ) : gridView ? (
            // Grid view for many files
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {groupedCodeFiles.map((file, index) => {
                const fileColor = getFileColor(file.filename);
                const sectionCount = file.sections.length;
                const isSelected = selectedFile === index;
                
                return (
                  <div 
                    key={`file-grid-${index}`}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#1C2F45] border-[#388BFD]' 
                        : 'bg-[#161B22]/90 border-[#30363D] hover:bg-[#21262D]'
                    }`}
                    onClick={() => setSelectedFile(index)}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: fileColor }}></div>
                      <div className="truncate font-mono text-xs text-[#E6EDF3]">
                        {file.filename.split('/').pop()}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-[#8B949E]">{getFileIcon(file.filename)}</span>
                      {sectionCount > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#388BFD]/20 text-[#58A6FF] rounded-full">
                          {sectionCount} parts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Card view (original fan display)
            <div className="w-full flex items-center justify-center">
              <div className="relative w-4/5 h-[220px]">
                {/* Spread cards */}
                {groupedCodeFiles.map((file, index) => {
                  // Calculate position for spread effect
                  const totalWidth = deckRef.current?.clientWidth || 800;
                  const cardWidth = Math.min(280, totalWidth / 4);
                  const spreadWidth = Math.min(totalWidth - cardWidth, groupedCodeFiles.length * 40);
                  const step = groupedCodeFiles.length > 1 ? spreadWidth / (groupedCodeFiles.length - 1) : 0;
                  const xPos = (index * step) - (spreadWidth / 2) + (cardWidth / 2);
                  
                  // Calculate rotation for fan effect
                  const maxRotation = 5;
                  const midpoint = (groupedCodeFiles.length - 1) / 2;
                  const rotationStep = groupedCodeFiles.length > 1 ? maxRotation * 2 / (groupedCodeFiles.length - 1) : 0;
                  const rotation = (index - midpoint) * rotationStep;
                  
                  const isHovered = hoveredFile === index;
                  const isSelected = selectedFile === index;
                  const zIndex = isHovered || isSelected ? 50 : 10 + index;
                  const yOffset = isHovered ? -20 : 0;
                  
                  const fileColor = getFileColor(file.filename);
                  const sectionCount = file.sections.length;
                  
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
                      } backdrop-blur-sm overflow-hidden`}>
                        {/* Card header */}
                        <div className="h-10 px-3 border-b border-[#30363D] flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: fileColor }}></div>
                            <span className="font-mono text-xs text-[#E6EDF3] truncate max-w-[180px]">
                              {file.filename.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {sectionCount > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#388BFD]/20 text-[#58A6FF] rounded-full">
                                {sectionCount} parts
                              </span>
                            )}
                            <span className="text-[10px] text-[#8B949E]">{getFileExtension(file.filename)}</span>
                          </div>
                        </div>
                        
                        {/* Card preview */}
                        <div className="h-[140px] overflow-hidden p-3">
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
              className="mt-12 relative"
            >
              <Card className="w-full mx-auto border border-[#30363D] bg-[#0D1117]/90 backdrop-blur-md rounded-md overflow-hidden">
                <div className="absolute top-3 right-3 z-10">
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-full bg-[#161B22]/80 text-[#8B949E] border border-[#30363D] hover:bg-[#1C2F45]/80 hover:text-[#E6EDF3]"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {selectedFile !== null && groupedCodeFiles[selectedFile] && (
                  <>
                    <div className="p-5 border-b border-[#30363D] bg-[#161B22]/70">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2.5" 
                          style={{ backgroundColor: getFileColor(groupedCodeFiles[selectedFile].filename) }}
                        ></div>
                        <h2 className="text-lg font-medium text-[#E6EDF3] font-mono">
                          {groupedCodeFiles[selectedFile].filename}
                        </h2>
                      </div>
                      
                      {/* Section tabs if there are multiple sections */}
                      {groupedCodeFiles[selectedFile].sections.length > 1 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {groupedCodeFiles[selectedFile].sections.map((section, idx) => (
                            <button
                              key={`section-${idx}`}
                              onClick={() => setSelectedSection(idx)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                selectedSection === idx 
                                  ? 'bg-[#388BFD] text-white' 
                                  : 'bg-[#21262D] text-[#8B949E] hover:bg-[#30363D]'
                              }`}
                            >
                              {section.title}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <p className="mt-2 text-sm text-[#8B949E]">
                        From section: {groupedCodeFiles[selectedFile].sections[selectedSection].title}
                      </p>
                    </div>
                    
                    <div className="p-5">
                      <div className="prose prose-invert max-w-none mb-6 prose-p:text-[#C9D1D9] prose-headings:text-[#E6EDF3] prose-a:text-[#58A6FF] prose-code:text-[#79C0FF] prose-strong:text-[#E6EDF3] text-sm">
                        <ReactMarkdown>{groupedCodeFiles[selectedFile].sections[selectedSection].content}</ReactMarkdown>
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
                                  {groupedCodeFiles[selectedFile].filename}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72 bg-[#161B22] border border-[#30363D] text-[#C9D1D9]">
                                <div className="flex flex-col space-y-1.5">
                                  <h4 className="text-sm font-medium text-[#58A6FF]">
                                    Language: {groupedCodeFiles[selectedFile].language}
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
                            code={groupedCodeFiles[selectedFile].content}
                            language={groupedCodeFiles[selectedFile].language}
                            annotations={groupedCodeFiles[selectedFile].sections[selectedSection].annotations}
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
        
        {/* Table reflection/shadow */}
        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#0D1117] to-transparent"></div>
      </div>
      
      {/* Visual guide to instruct users */}
      {selectedFile === null && groupedCodeFiles.length > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-[#8B949E] animate-pulse pointer-events-none">
          <div className="text-sm">Click on a file to view details</div>
        </div>
      )}
    </div>
  );
} 