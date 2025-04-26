'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
import { nanoid } from 'nanoid';

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

// Custom node to display file info
function FileNode({ data, selected }: NodeProps) {
  const { title, filename, language, color, content, onClick } = data;
  
  // Extract file extension from filename
  const getFileExtension = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  const extension = getFileExtension(filename);
  
  return (
    <div 
      className={`w-64 rounded-md border-2 overflow-hidden transition-all duration-300 shadow-lg ${
        selected ? 'scale-105 bg-[#1C2F45]/95' : 'bg-[#161B22]/95'
      }`}
      style={{ borderColor: color, backdropFilter: 'blur(4px)' }}
      onClick={onClick}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-transparent" />
      
      {/* Card header */}
      <div className="px-3 py-2 border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
          <span className="font-mono text-xs text-[#E6EDF3] truncate max-w-[140px]">
            {filename.split('/').pop()}
          </span>
        </div>
        <span className="text-[10px] text-[#8B949E]">{extension}</span>
      </div>
      
      {/* Card preview */}
      <div className="h-[80px] overflow-hidden p-2">
        <pre className="text-[9px] font-mono text-[#8B949E] overflow-hidden line-clamp-4">
          <code>{content.split('\n').slice(0, 4).join('\n')}</code>
        </pre>
      </div>
      
      {/* Section reference */}
      <div className="px-3 py-1 text-[10px] border-t border-[#30363D] bg-[#0D1117] text-[#8B949E] font-medium">
        {title}
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-transparent" />
    </div>
  );
}

// Custom node to display section info
function SectionNode({ data }: NodeProps) {
  const { title, description, color } = data;
  
  return (
    <div 
      className="w-64 rounded-md border-2 overflow-hidden shadow-lg bg-[#161B22]/95 backdrop-blur-sm"
      style={{ borderColor: color, backdropFilter: 'blur(4px)' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-transparent" />
      
      {/* Section header */}
      <div className="px-4 py-3 border-b border-[#30363D] flex items-center">
        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
      </div>
      
      {/* Section description */}
      <div className="p-3 text-[11px] text-[#8B949E] max-h-24 overflow-hidden">
        <div className="line-clamp-6">
          {description}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-transparent" />
    </div>
  );
}

// Custom edge that centers the connection
function CodeFlowEdge({ sourceX, sourceY, targetX, targetY, style = {}, markerEnd }: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={{ ...style, strokeWidth: 2, stroke: style.stroke || '#30363D' }} 
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
  // Section colors - define at the top level so they're available throughout
  const sectionColors: { [key: string]: string } = {
    "Key Components": "#FF1493",
    "Data Flow": "#00CED1",
    "Authentication Flow": "#32CD32",
    "Project Overview": "#8A2BE2"
  };

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

  // Generate React Flow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map();
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Add section nodes first
    sections.forEach((section, sectionIndex) => {
      if (!section.code || section.code.length === 0) return;
      
      const color = sectionColors[section.title] || 
        ["#FF1493", "#00CED1", "#32CD32", "#8A2BE2"][sectionIndex % 4];
      
      const sectionId = `section-${sectionIndex}`;
      nodeMap.set(section.title, sectionId);
      
      nodes.push({
        id: sectionId,
        type: 'sectionNode',
        position: { x: 100, y: 100 + sectionIndex * 200 },
        data: {
          title: section.title,
          description: section.content,
          color
        }
      });
    });
    
    // Add file nodes and connect to sections
    allCodeFiles.forEach((file, fileIndex) => {
      if (!file.sectionTitle) return;
      
      const sectionIndex = sections.findIndex(s => s.title === file.sectionTitle);
      const color = sectionColors[file.sectionTitle] || 
        ["#FF1493", "#00CED1", "#32CD32", "#8A2BE2"][Math.max(0, sectionIndex) % 4];
      
      const fileId = `file-${fileIndex}`;
      const sectionId = nodeMap.get(file.sectionTitle);
      
      if (!sectionId) return;
      
      // Add file node
      nodes.push({
        id: fileId,
        type: 'fileNode',
        position: { 
          x: 500, 
          y: 100 + sectionIndex * 200 + (fileIndex % 3) * 120
        },
        data: {
          title: file.sectionTitle,
          filename: file.filename,
          language: file.language,
          content: file.content,
          color,
          onClick: () => toggleFileSelection(fileIndex)
        }
      });
      
      // Connect section to file
      edges.push({
        id: `edge-${sectionId}-${fileId}`,
        source: sectionId,
        target: fileId,
        type: 'codeFlowEdge',
        style: { stroke: color },
        animated: true
      });
    });
    
    return { nodes, edges };
  }, [sections, allCodeFiles]);
  
  // Setup React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Define node types
  const nodeTypes = useMemo(() => ({
    fileNode: FileNode,
    sectionNode: SectionNode,
  }), []);
  
  // Define edge types
  const edgeTypes = useMemo(() => ({
    codeFlowEdge: CodeFlowEdge,
  }), []);
  
  return (
    <div className="w-full">
      <div className={`w-full h-[500px] transition-all duration-500 ease-in-out ${selectedFile !== null ? 'flex items-start justify-between' : 'block'}`}>
        {/* React Flow visualization */}
        <div className={`${selectedFile !== null ? 'w-1/2' : 'w-full'} h-full transition-all duration-500 ease-in-out relative backdrop-blur-sm rounded-lg overflow-hidden border border-[#30363D]/30`}>
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
            <Background color="#30363D" gap={16} size={1} />
            <Controls showInteractive={false} className="bg-[#161B22] border-[#30363D] text-white" />
            <Panel position="top-center" className="bg-[#161B22]/50 text-[#8B949E] text-xs px-2 py-1 rounded border border-[#30363D]">
              {selectedFile === null ? 'Click on a file to view details' : 'Click on the same file again to close details'}
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
                    <div 
                      className="w-3 h-3 rounded-full mr-2.5" 
                      style={{ 
                        backgroundColor: 
                          allCodeFiles[selectedFile].sectionTitle ?
                          (sectionColors[allCodeFiles[selectedFile].sectionTitle] || "#FF1493") : 
                          "#8B949E"
                      }}
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