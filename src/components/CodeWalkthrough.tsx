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

// Input node component
function InputNode({ data }: NodeProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-64 border border-gray-200">
      <div className="text-gray-700 font-medium mb-2">{data.label}</div>
      <div className="p-2">
        {data.type === 'color' && (
          <div className="flex items-center">
            <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: data.value }}></div>
            <span className="text-gray-600">{data.value}</span>
          </div>
        )}
        
        {data.type === 'radio' && (
          <div className="space-y-2">
            {data.options.map((option: string) => (
              <div key={option} className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 border flex items-center justify-center ${option === data.value ? 'border-pink-500' : 'border-gray-300'}`}>
                  {option === data.value && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
                </div>
                <span className="text-gray-600">{option}</span>
              </div>
            ))}
          </div>
        )}
        
        {data.type === 'slider' && (
          <div className="w-full pt-2">
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-pink-500 rounded-full relative" style={{ width: `${data.value * 100}%` }}>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 bg-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#888' }} />
    </div>
  );
}

// Output node component
function OutputNode({ data }: NodeProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-96 h-96 border border-gray-200">
      <div className="text-gray-700 font-medium mb-2">{data.label}</div>
      <div className="bg-white rounded p-2 flex items-center justify-center h-[calc(100%-2rem)]">
        {data.content}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: '#888' }} />
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

  // Create nodes for the flow diagram
  const initialNodes: Node[] = [
    {
      id: 'color-input',
      type: 'inputNode',
      position: { x: 100, y: 100 },
      data: { 
        label: 'shape color',
        type: 'color',
        value: '#ff0071'
      }
    },
    {
      id: 'shape-input',
      type: 'inputNode',
      position: { x: 100, y: 250 },
      data: { 
        label: 'shape type',
        type: 'radio',
        options: ['cube', 'pyramid'],
        value: 'cube'
      }
    },
    {
      id: 'zoom-input',
      type: 'inputNode',
      position: { x: 100, y: 400 },
      data: { 
        label: 'zoom level',
        type: 'slider',
        value: 0.3
      }
    },
    {
      id: 'output',
      type: 'outputNode',
      position: { x: 500, y: 200 },
      data: { 
        label: 'output',
        content: (
          <div className="grid grid-cols-6 gap-2">
            {Array(50).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="w-8 h-8 bg-pink-500"
                style={{
                  transform: `rotate(${Math.random() * 45}deg) scale(${0.8 + Math.random() * 0.4})`,
                  opacity: 0.7 + Math.random() * 0.3
                }}
              />
            ))}
          </div>
        )
      }
    }
  ];

  // Create edges connecting inputs to output
  const initialEdges: Edge[] = [
    {
      id: 'edge-color-output',
      source: 'color-input',
      target: 'output',
      type: 'flowEdge'
    },
    {
      id: 'edge-shape-output',
      source: 'shape-input',
      target: 'output',
      type: 'flowEdge'
    },
    {
      id: 'edge-zoom-output',
      source: 'zoom-input',
      target: 'output',
      type: 'flowEdge'
    }
  ];
  
  // Setup React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Define node types
  const nodeTypes = useMemo(() => ({
    inputNode: InputNode,
    outputNode: OutputNode,
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
              {selectedFile === null ? 'Standard ReactFlow Example' : 'Click on the same file again to close details'}
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