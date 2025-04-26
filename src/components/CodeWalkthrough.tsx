'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
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
        return '📜';
      case 'jsx':
        return '⚛️';
      case 'ts':
        return '📘';
      case 'tsx':
        return '⚛️';
      case 'json':
        return '🔧';
      case 'md':
        return '📝';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'py':
        return '🐍';
      case 'rb':
        return '💎';
      case 'php':
        return '🐘';
      case 'java':
        return '☕';
      case 'go':
        return '🐹';
      case 'rust':
      case 'rs':
        return '🦀';
      case 'c':
      case 'cpp':
      case 'h':
        return '⚙️';
      case 'sh':
        return '🐚';
      case 'yml':
      case 'yaml':
        return '📋';
      case 'svg':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
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
      className={`bg-white rounded-lg shadow-md border transition-all duration-200 ${selected ? 'border-pink-500 scale-105' : 'border-gray-200'}`}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#888' }} />
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-xl">{fileIcon}</span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{shortName}</span>
            <span className="text-xs text-gray-500">{data.type}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase font-medium">{extension}</span>
          <div className="mt-1 text-xs inline-flex items-center bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            <span className="font-medium">{data.lines}</span>
            <span className="ml-1 text-gray-500">lines</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#888' }} />
    </div>
  );
}

// Custom edge component for animated dotted lines
function FlowEdge({ sourceX, sourceY, targetX, targetY }: EdgeProps) {
  return (
    <path
      d={`M${sourceX} ${sourceY}L${targetX} ${targetY}`}
      className="react-flow__edge-path"
      strokeWidth={1.5}
      stroke="#aaa"
      strokeDasharray="6,6"
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
    <div className="bg-white overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <table className="min-w-full border-collapse">
        <tbody>
          {code.split('\n').map((line, lineIdx) => {
            const lineNumber = lineIdx + 1;
            const hasAnnotation = codeWithAnnotations.annotatedLines.has(lineNumber);
            const annotation = codeWithAnnotations.getAnnotationForLine(lineNumber);
            
            return (
              <tr key={lineIdx} className={hasAnnotation ? "bg-blue-50 backdrop-blur-sm" : "hover:bg-gray-50"}>
                <td className="text-right py-0 pr-4 pl-4 border-r border-gray-300 text-gray-600 select-none w-[1%] font-mono text-xs">
                  {lineNumber}
                </td>
                <td className="py-1 px-4 font-mono text-sm whitespace-pre text-gray-900">
                  {/* Direct code display */}
                  <pre className="m-0 p-0 text-gray-900 font-medium">{line}</pre>
                </td>
                <td className="w-[30%] pl-4 py-0 text-xs text-gray-900">
                  {hasAnnotation && (
                    <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-500 shadow-sm">
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
  
  // Helper function to get file icon
  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'js':
        return '📜';
      case 'jsx':
        return '⚛️';
      case 'ts':
        return '📘';
      case 'tsx':
        return '⚛️';
      case 'json':
        return '🔧';
      case 'md':
        return '📝';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'py':
        return '🐍';
      case 'rb':
        return '💎';
      case 'php':
        return '🐘';
      case 'java':
        return '☕';
      case 'go':
        return '🐹';
      case 'rust':
      case 'rs':
        return '🦀';
      case 'c':
      case 'cpp':
      case 'h':
        return '⚙️';
      case 'sh':
        return '🐚';
      case 'yml':
      case 'yaml':
        return '📋';
      case 'svg':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📄';
    }
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
      
      nodes.push({
        id: `file-${index}`,
        type: 'fileNode',
        position: { 
          x: 400, 
          y: 120 + index * 200 
        },
        data: {
          filename: file.filename,
          type: getNodeType(file.filename),
          lines: lines,
          language: file.language,
          onClick: () => toggleFileSelection(index)
        }
      });
    });
    
    // Create edges based on imports
    filesToUse.forEach((file, sourceIndex) => {
      // Skip the last file as it won't have a next file to connect to
      if (sourceIndex < filesToUse.length - 1) {
        edges.push({
          id: `edge-${sourceIndex}-${sourceIndex + 1}`,
          source: `file-${sourceIndex}`,
          target: `file-${sourceIndex + 1}`,
          animated: true,
          style: { stroke: '#aaa', strokeWidth: 1.5, strokeDasharray: '5,5' }
        });
      }
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
      <div className={`w-full h-[800px] transition-all duration-500 ease-in-out ${selectedFile !== null ? 'flex items-start justify-between' : 'block'}`}>
        {/* React Flow visualization */}
        <div className={`${selectedFile !== null ? 'w-1/2' : 'w-full'} h-full transition-all duration-500 ease-in-out relative`}>
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
            style={{ background: 'transparent' }}
          >
            <Background color="#ddd" gap={12} size={1} />
            <Controls showInteractive={false} className="bg-white border-gray-200 text-gray-700" />
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
              <Card className="w-full h-full border border-gray-200 bg-white backdrop-blur-md rounded-lg overflow-hidden shadow-md">
                <div className="p-5 border-b border-gray-200 bg-white">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getFileIcon(allCodeFiles[selectedFile].filename.split('.').pop() || '')}
                    </span>
                    <h2 className="text-lg font-medium text-gray-800 font-mono">
                      {allCodeFiles[selectedFile].filename.split('/').pop() || ''}
                    </h2>
                  </div>
                  {allCodeFiles[selectedFile].sectionTitle && (
                    <p className="mt-2 text-sm text-gray-500">
                      From section: {allCodeFiles[selectedFile].sectionTitle}
                    </p>
                  )}
                </div>
                
                <div className="p-5 bg-white overflow-auto">
                  {allCodeFiles[selectedFile].sectionContent && (
                    <div className="prose max-w-none mb-6 text-black prose-p:text-black prose-headings:text-black prose-a:text-blue-600 prose-code:text-blue-700 prose-strong:text-black text-sm">
                      <ReactMarkdown>{allCodeFiles[selectedFile].sectionContent}</ReactMarkdown>
                    </div>
                  )}
                  
                  <div className="relative">
                    <div className="flex justify-between items-center bg-gray-100 text-xs px-3 py-2 rounded-t-md border-t border-x border-gray-300">
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="font-mono text-xs ml-2 cursor-help text-gray-700">
                              {allCodeFiles[selectedFile].filename.split('/').pop() || ''}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72 bg-white border border-gray-300 text-gray-800">
                            <div className="flex flex-col space-y-1.5">
                              <h4 className="text-sm font-medium text-blue-700">
                                Language: {allCodeFiles[selectedFile].language}
                              </h4>
                              <p className="text-xs text-gray-700">
                                Look for comment bubbles next to important lines
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                    
                    <div className="relative border-x border-b border-gray-300 rounded-b-md overflow-hidden">
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