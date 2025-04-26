'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  getStraightPath,
  BaseEdge,
  EdgeProps,
  NodeProps,
  Handle,
  Position,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

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

// File node component
function FileNode({ data, selected }: NodeProps) {
  // Extract file extension from filename
  const getFileExtension = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'js':
        return '📄 JS';
      case 'jsx':
        return '📄 JSX';
      case 'ts':
        return '📄 TS';
      case 'tsx':
        return '📄 TSX';
      case 'json':
        return '📄 JSON';
      case 'md':
        return '📄 MD';
      case 'css':
        return '📄 CSS';
      case 'html':
        return '📄 HTML';
      default:
        return '📄';
    }
  };
  
  const filename = data.filename;
  const extension = getFileExtension(filename);
  const fileIcon = getFileIcon(extension);
  const shortName = filename.split('/').pop() || filename;
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-md w-64 border transition-all duration-200 ${selected ? 'border-pink-500 scale-105' : 'border-gray-200'}`}
      onClick={data.onClick}
    >
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between font-medium text-gray-700">
        <div className="flex items-center">
          <span className="mr-2">{fileIcon}</span>
          <span className="truncate max-w-[150px]">{shortName}</span>
        </div>
        <span className="text-xs text-gray-400 uppercase">{extension}</span>
      </div>
      <div className="p-3 bg-gray-50 text-xs text-gray-600 font-mono h-24 overflow-hidden">
        <pre className="overflow-hidden line-clamp-5">
          {data.preview}
        </pre>
      </div>
      <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
        <span>{data.type}</span>
        <span>{data.lines} lines</span>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: '#888' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#888' }} />
    </div>
  );
}

// Custom edge component for dotted lines
function FlowEdge({ sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      style={{ 
        strokeWidth: 1.5, 
        stroke: '#aaa', 
        strokeDasharray: '5,5',
        opacity: 0.75
      }} 
    />
  );
}

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

export default function CodeWalkthrough({ sections }: CodeWalkthroughProps) {
  // Flatten all code files from all sections
  const allCodeFiles = useMemo(() => 
    sections.flatMap(section => 
      section.code ? section.code.map(codeFile => ({
        ...codeFile,
        sectionTitle: section.title,
        sectionContent: section.content
      })) : []
    ), [sections]
  );
  
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  
  // Toggle selection - clicking same file will deselect it
  const toggleFileSelection = (index: number) => {
    setSelectedFile(prev => prev === index ? null : index);
  };

  // Generate React Flow nodes and edges for the file diagram
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Use sample files or use allCodeFiles if available
    const filesToUse = allCodeFiles.length > 0 ? allCodeFiles : [
      {
        filename: 'src/components/App.tsx',
        language: 'tsx',
        content: 'import React from "react";\nimport { Header } from "./Header";\nimport { Footer } from "./Footer";\nimport { Main } from "./Main";\n\nexport function App() {\n  return (\n    <div className="app">\n      <Header />\n      <Main />\n      <Footer />\n    </div>\n  );\n}',
      },
      {
        filename: 'src/components/Header.tsx',
        language: 'tsx',
        content: 'import React from "react";\nimport { Logo } from "./Logo";\nimport { Navigation } from "./Navigation";\n\nexport function Header() {\n  return (\n    <header className="header">\n      <Logo />\n      <Navigation />\n    </header>\n  );\n}',
      },
      {
        filename: 'src/components/Footer.tsx',
        language: 'tsx',
        content: 'import React from "react";\n\nexport function Footer() {\n  return (\n    <footer className="footer">\n      <p>© 2023 My Company</p>\n    </footer>\n  );\n}',
      },
      {
        filename: 'src/components/Main.tsx',
        language: 'tsx',
        content: 'import React from "react";\nimport { Content } from "./Content";\nimport { Sidebar } from "./Sidebar";\n\nexport function Main() {\n  return (\n    <main className="main">\n      <Content />\n      <Sidebar />\n    </main>\n  );\n}',
      },
      {
        filename: 'src/components/Navigation.tsx',
        language: 'tsx',
        content: 'import React from "react";\n\nexport function Navigation() {\n  return (\n    <nav className="navigation">\n      <ul>\n        <li><a href="/">Home</a></li>\n        <li><a href="/about">About</a></li>\n        <li><a href="/contact">Contact</a></li>\n      </ul>\n    </nav>\n  );\n}',
      },
    ];

    // Create file relationship map (simple imports analysis)
    const fileRelationships: Record<string, string[]> = {};
    
    filesToUse.forEach(file => {
      const importMatches = file.content.match(/import.*from\s+['"](.+)['"]/g) || [];
      const importedFiles = importMatches.map(match => {
        const importPath = match.match(/from\s+['"](.+)['"]/)?.[1] || '';
        // Convert relative imports to full paths (simplified)
        if (importPath.startsWith('./')) {
          const dir = file.filename.split('/').slice(0, -1).join('/');
          return `${dir}/${importPath.substring(2)}`;
        }
        return importPath;
      });
      
      fileRelationships[file.filename] = importedFiles;
    });
    
    // Create nodes for each file
    filesToUse.forEach((file, index) => {
      const lines = file.content.split('\n').length;
      const preview = file.content.split('\n').slice(0, 5).join('\n');
      
      nodes.push({
        id: `file-${index}`,
        type: 'fileNode',
        position: { 
          x: 100 + (index % 3) * 300, 
          y: 100 + Math.floor(index / 3) * 200 
        },
        data: {
          filename: file.filename,
          preview: preview,
          type: getNodeType(file.filename),
          lines: lines,
          language: file.language,
          onClick: () => toggleFileSelection(index)
        }
      });
    });
    
    // Create edges based on imports
    filesToUse.forEach((file, sourceIndex) => {
      const imports = fileRelationships[file.filename] || [];
      
      imports.forEach(importPath => {
        // Find the target file index
        const targetIndex = filesToUse.findIndex(f => {
          const filename = f.filename;
          const basename = filename.split('/').pop() || '';
          const withoutExt = basename.replace(/\.[^.]+$/, '');
          
          return filename === importPath || 
                 importPath.includes(withoutExt) || 
                 filename.includes(importPath);
        });
        
        if (targetIndex !== -1 && targetIndex !== sourceIndex) {
          edges.push({
            id: `edge-${sourceIndex}-${targetIndex}`,
            source: `file-${sourceIndex}`,
            target: `file-${targetIndex}`,
            type: 'flowEdge',
            animated: true
          });
        }
      });
    });
    
    return { nodes, edges };
  }, [allCodeFiles]);
  
  // Determine node type based on filename
  function getNodeType(filename: string): string {
    if (filename.includes('component')) return 'Component';
    if (filename.includes('util')) return 'Utility';
    if (filename.includes('hook')) return 'Hook';
    if (filename.includes('context')) return 'Context';
    if (filename.includes('reducer')) return 'Reducer';
    if (filename.includes('action')) return 'Action';
    if (filename.includes('api')) return 'API';
    if (filename.includes('model')) return 'Model';
    if (filename.includes('type')) return 'Types';
    if (filename.includes('test')) return 'Test';
    if (filename.includes('page')) return 'Page';
    if (filename.includes('layout')) return 'Layout';
    return 'File';
  }
  
  // Setup React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Define node types
  const nodeTypes = useMemo(() => ({
    fileNode: FileNode,
  }), []);
  
  // Define edge types
  const edgeTypes = useMemo(() => ({
    flowEdge: FlowEdge,
  }), []);
  
  return (
    <div className="w-full">
      <div className={`w-full h-[500px] transition-all duration-500 ease-in-out ${selectedFile !== null ? 'flex items-start justify-between' : 'block'}`}>
        {/* React Flow visualization */}
        <div className={`${selectedFile !== null ? 'w-1/2' : 'w-full'} h-full transition-all duration-500 ease-in-out relative rounded-lg overflow-hidden border border-gray-200`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Straight}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: 'radial-gradient(circle, rgba(248,246,255,1) 0%, rgba(238,232,255,1) 100%)' }}
          >
            <Background color="#aaa" gap={12} size={1} />
            <Controls showInteractive={false} className="bg-white border-gray-200 text-gray-700" />
            <Panel position="top-center" className="bg-white/50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
              {selectedFile === null ? 'File Structure Flow Diagram' : 'Click on the same file again to close details'}
            </Panel>
          </ReactFlow>
        </div>
        
        {/* Selected file detail view */}
        <AnimatePresence>
          {selectedFile !== null && allCodeFiles[selectedFile] && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '48%' }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full overflow-auto"
            >
              <Card className="w-full h-full border border-[#30363D] bg-[#0D1117]/80 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[#30363D] bg-gradient-to-r from-[#161B22]/90 to-[#0D1117]/90">
                  <div className="flex items-center">
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
                
                <div className="p-5 bg-gradient-to-b from-[#0D1117]/95 to-[#0D1117]/80 overflow-auto">
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 