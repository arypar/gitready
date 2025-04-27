'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactFlow, { 
  Node, 
  Edge, 
  NodeProps, 
  EdgeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* ----------------------------- Types ------------------------------ */
/* ------------------------------------------------------------------ */

interface CodeWithAnnotations {
  filename: string;
  language: string;
  content: string;
  annotations?: {
    line: number;
    comment: string;
  }[];
  relationships?: {
    imports?: string[];
    importedBy?: string[];
    functionallyRelatedTo?: string[];
  };
}

interface CodeWalkthroughProps {
  sections: {
    title: string;
    content: string;
    code?: CodeWithAnnotations[];
  }[];
  repositorySummary?: string | null;
}

/* ------------------------------------------------------------------ */
/* ------------------------- Helper utils --------------------------- */
/* ------------------------------------------------------------------ */

const getFileExtension = (name: string) => {
  const p = name.split('.');
  return p.length > 1 ? p[p.length - 1].toLowerCase() : '';
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

const prepareCodeLines = (
  code: string,
  annotations?: { line: number; comment: string }[]
) => {
  return {
    lines: code.split('\n'),
    annotatedLines: new Set(annotations?.map((a) => a.line) ?? []),
    getAnnotation: (lineNum: number) =>
      annotations?.find((a) => a.line === lineNum)?.comment ?? null,
  };
};

// Function to parse imports from code content
const parseImports = (code: string): string[] => {
  const imports: Set<string> = new Set();
  // Corrected Regex: Handle different quotes, optional semicolons, require/import
  const importRegex = /(?:import(?:.|\n)*?from\s+|(?:require\s*\())(['"`])([.\/\w-]+)\1/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    // Extract module name (index 2), remove relative paths for simplicity
    const modulePath = match[2]; 
    const moduleName = modulePath.split('/').pop();
    if (moduleName) { 
      imports.add(moduleName);
    }
  }
  return Array.from(imports);
};

// Function to create relationship-based edges
const createRelationshipEdges = (nodes: Node[], codeFiles: any[]): Edge[] => {
  const edges: Edge[] = [];
  const addedEdges = new Set<string>();
  const fileIdMap = new Map<string, string>(); // Maps filename to node id
  
  // Build a map of filenames to node ids
  nodes.forEach((node) => {
    const filename = node.data.filename;
    const shortName = filename.split('/').pop();
    if (shortName) {
      fileIdMap.set(shortName, node.id);
      // Also map the full path
      fileIdMap.set(filename, node.id);
    }
  });
  
  // Create edges based on file relationships
  codeFiles.forEach((file) => {
    if (!file.relationships) return;
    
    const sourceId = fileIdMap.get(file.filename);
    if (!sourceId) return;
    
    // Handle imports
    if (file.relationships.imports) {
      file.relationships.imports.forEach((importedFile: string) => {
        const targetId = fileIdMap.get(importedFile);
        if (targetId && targetId !== sourceId) {
          const edgeKey = `${sourceId}-${targetId}`;
          if (!addedEdges.has(edgeKey)) {
            addedEdges.add(edgeKey);
            edges.push({
              id: `edge-import-${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              animated: true,
              type: 'flowEdge',
              style: { stroke: '#58A6FF', strokeWidth: 2 }, // Blue for imports
              label: 'imports',
              labelStyle: { fill: '#58A6FF', fontSize: 10 },
              labelBgStyle: { fill: '#21262D', fillOpacity: 0.8 }
            });
          }
        }
      });
    }
    
    // Handle imported by
    if (file.relationships.importedBy) {
      file.relationships.importedBy.forEach((importingFile: string) => {
        const targetId = fileIdMap.get(importingFile);
        if (targetId && targetId !== sourceId) {
          const edgeKey = `${targetId}-${sourceId}`; // Note: direction is reversed
          if (!addedEdges.has(edgeKey)) {
            addedEdges.add(edgeKey);
            edges.push({
              id: `edge-importedby-${targetId}-${sourceId}`,
              source: targetId, // Importer is source
              target: sourceId, // This file is target
              animated: false,
              type: 'flowEdge',
              style: { stroke: '#3FB950', strokeWidth: 1.5 }, // Green for imported by
              label: 'uses',
              labelStyle: { fill: '#3FB950', fontSize: 10 },
              labelBgStyle: { fill: '#21262D', fillOpacity: 0.8 }
            });
          }
        }
      });
    }
    
    // Handle functionally related
    if (file.relationships.functionallyRelatedTo) {
      file.relationships.functionallyRelatedTo.forEach((relatedFile: string) => {
        const targetId = fileIdMap.get(relatedFile);
        if (targetId && targetId !== sourceId) {
          // Create a consistent key regardless of order
          const nodes = [sourceId, targetId].sort();
          const edgeKey = `${nodes[0]}-${nodes[1]}-related`;
          
          if (!addedEdges.has(edgeKey)) {
            addedEdges.add(edgeKey);
            edges.push({
              id: `edge-related-${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              animated: false,
              type: 'flowEdge',
              style: { 
                stroke: '#A371F7', 
                strokeWidth: 1.5,
                strokeDasharray: '5,5'
              }, // Purple dashed for related
              label: 'related',
              labelStyle: { fill: '#A371F7', fontSize: 10 },
              labelBgStyle: { fill: '#21262D', fillOpacity: 0.8 }
            });
          }
        }
      });
    }
  });
  
  return edges;
};

/* ------------------------------------------------------------------ */
/* --------------------- Custom render components ------------------- */
/* ------------------------------------------------------------------ */

/* --------- Node used inside React-Flow graph ---------- */
function FileNode({ data, selected }: NodeProps) {
  const extension = data.fileExt || getFileExtension(data.filename);
  const fileIcon = getFileIcon(extension);
  const shortName = data.fileName || data.filename.split('/').pop();

  // Restore getNodeType logic if needed (using data.type for now)
  // const nodeType = getNodeType(data.filename);
  const nodeType = data.type || 'File';

  return (
    <div
      className={`bg-[#161B22] rounded-lg shadow-md border transition-all duration-200 ${selected ? 'border-blue-600 scale-105 ring-2 ring-blue-900' : 'border-[#30363D] hover:border-blue-700'}`}
      onClick={data.onClick}
      style={{ width: 'auto', minWidth: '220px' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#666' }} />
      
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-xl">{fileIcon}</span>
          <div className="flex flex-col">
            <span className="font-medium text-[#E6EDF3]">{shortName}</span>
            <span className="text-xs text-[#8B949E]">{nodeType}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-[#6E7681] uppercase font-medium">{extension}</span>
          <div className="mt-1 text-xs inline-flex items-center bg-[#21262D] px-2 py-0.5 rounded-full text-[#8B949E]">
            <span className="font-medium text-[#C9D1D9]">{data.lines}</span>
            <span className="ml-1">lines</span>
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#666' }}
      />
    </div>
  );
}

/* -------------- Edge with dotted animation -------------- */
function FlowEdge({ sourceX, sourceY, targetX, targetY }: EdgeProps) {
  return (
    <path
      d={`M${sourceX} ${sourceY} L ${targetX} ${targetY}`}
      stroke="#aaa"
      strokeWidth={1.5}
      strokeDasharray="6 6"
      className="react-flow__edge-path"
    />
  );
}

/* --------- Code table with inline annotations --------- */
function CodeRenderer({
  code,
  language,
  annotations,
}: {
  code: string;
  language: string;
  annotations?: { line: number; comment: string }[];
}) {
  const { lines, annotatedLines, getAnnotation } = useMemo(
    () => prepareCodeLines(code, annotations),
    [code, annotations]
  );

  return (
    <div className="bg-[#0D1117] overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-[#30363D] scrollbar-track-[#161B22]">
      <table className="min-w-full border-collapse">
        <tbody>
          {lines.map((ln, idx) => {
            const n = idx + 1;
            const ann = annotatedLines.has(n) ? getAnnotation(n) : null;
            return (
              <tr
                key={idx}
                className={
                  ann ? 'bg-[#1C2F45]/70' : 'hover:bg-[#161B22]/50'
                }
              >
                <td className="text-right py-0 pr-4 pl-4 border-r border-[#30363D] text-[#6E7681] select-none w-[1%] font-mono text-xs">
                  {n}
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
                      lineHeight: 1.5,
                    }}
                    wrapLines
                  >
                    {ln}
                  </SyntaxHighlighter>
                </td>
                <td className="w-2/5 pl-4 py-0 text-xs text-[#58A6FF]">
                  {ann && (
                    <div className="bg-[#1F2937]/80 p-2 rounded border-l-2 border-[#388BFD] shadow-sm">
                      {ann}
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
}

/* ------------------------------------------------------------------ */
/* --------------------------- Main comp ---------------------------- */
/* ------------------------------------------------------------------ */

function CodeWalkthroughFlow({ sections, repositorySummary }: CodeWalkthroughProps) {
  /* ---- 1. Flatten every code file across all input sections ---- */
  const allCodeFiles = useMemo(
    () =>
      sections.flatMap((s) =>
        (s.code ?? []).map((c) => ({
          ...c,
          sectionTitle: s.title,
          sectionContent: s.content,
        }))
      ),
    [sections]
  );

  /* ---- 2. Select / highlight state ---- */
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const toggleFile = (i: number) =>
    setSelectedFile((prev) => (prev === i ? null : i));

  /* ---- 3. Build React-Flow nodes / edges ---- */
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const sample = allCodeFiles.length
      ? allCodeFiles
      : [
          {
            filename: 'src/components/App.tsx',
            language: 'tsx',
            content: `import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function App() { return ( <div><Header/><Footer/></div> ); }`,
          },
        ];

    const numFiles = sample.length;
    const numColumns = 3; // Set number of columns
    const colWidth = 300; // Increased width for more horizontal spacing
    const rowHeight = 200; // Height of node + spacing
    
    sample.forEach((file, idx) => {
      const col = idx % numColumns;
      const row = Math.floor(idx / numColumns);
      const x = 100 + col * colWidth; // Position based on column
      const y = 100 + row * rowHeight; // Position based on row
      
      // Extract file extension and name
      const pathParts = file.filename.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fileExt = getFileExtension(fileName);
      
      // Find import statements to build dependency graph
      const content = file.content || '';
      const importLines = content
        .split('\n')
        .filter(line => line.includes('import ') && line.includes('from '));
      
      // Create a more informative node
      nodes.push({
        id: `file-${idx}`,
        type: 'fileNode',
        position: { x, y },
        data: {
          filename: file.filename,
          language: file.language,
          content: file.content,
          sectionTitle: (file as any).sectionTitle,
          sectionContent: (file as any).sectionContent,
          annotations: (file as any).annotations,
          fileName,
          fileExt,
          type: 'File',
          lines: file.content.split('\n').length,
          hasAnnotations: (file as any).annotations && (file as any).annotations.length > 0,
          numAnnotations: (file as any).annotations?.length || 0,
          onClick: () => toggleFile(idx),
        },
      });
      
      // Try to find relationships between files through imports
      if (importLines.length > 0) {
        sample.forEach((targetFile, targetIdx) => {
          if (idx === targetIdx) return; // Skip self-reference
          
          const targetFileName = targetFile.filename.split('/').pop() || '';
          const targetBaseName = targetFileName.split('.')[0];
          
          // Check if this file imports the target file
          const hasImport = importLines.some(line => 
            line.includes(`from './${targetBaseName}'`) || 
            line.includes(`from "${targetBaseName}"`) ||
            line.includes(`from './${targetFileName}'`) ||
            line.includes(`from "${targetFileName}"`)
          );
          
          if (hasImport) {
            edges.push({
              id: `edge-${idx}-${targetIdx}`,
              source: `file-${idx}`,
              target: `file-${targetIdx}`,
              animated: true,
              type: 'flowEdge',
              style: { stroke: '#5096ff' },
            } as Edge);
          }
        });
      }
    });
    
    // Restore simple sequential edges for now (layout is complex)
    edges.length = 0; // Clear existing edges
    
    // Generate random connections
    const numConnections = Math.min(nodes.length * 2, Math.floor(nodes.length * (nodes.length - 1) / 2)); // Limit total number of edges
    const addedEdges = new Set(); // Track edges we've already added
    
    // Create random connections
    for (let i = 0; i < numConnections; i++) {
      // Get two random node indices
      const sourceIdx = Math.floor(Math.random() * nodes.length);
      let targetIdx;
      
      // Make sure target is different from source
      do {
        targetIdx = Math.floor(Math.random() * nodes.length);
      } while (targetIdx === sourceIdx);
      
      // Create a unique edge identifier (always put smaller index first for consistency)
      const minIdx = Math.min(sourceIdx, targetIdx);
      const maxIdx = Math.max(sourceIdx, targetIdx);
      const edgeKey = `${minIdx}-${maxIdx}`;
      
      // Only add if this edge doesn't already exist
      if (!addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        
        // Random colors
        const colors = ['#58A6FF', '#79C0FF', '#3FB950', '#A371F7', '#F778BA', '#DAAA3F', '#F85149'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        edges.push({
          id: `edge-${sourceIdx}-${targetIdx}`,
          source: `file-${sourceIdx}`,
          target: `file-${targetIdx}`,
          animated: Math.random() > 0.7, // Randomly animate some edges
          type: 'flowEdge',
          style: { 
            stroke: color, 
            strokeWidth: 1.5, 
            strokeDasharray: Math.random() > 0.5 ? '5,5' : undefined 
          }
        });
      }
    }
    
    // Ensure all nodes have at least one connection
    for (let i = 0; i < nodes.length; i++) {
      // Check if this node has any connections
      const hasConnection = edges.some(edge => 
        edge.source === `file-${i}` || edge.target === `file-${i}`
      );
      
      // If not, add a connection to a random node
      if (!hasConnection && nodes.length > 1) {
        let targetIdx;
        do {
          targetIdx = Math.floor(Math.random() * nodes.length);
        } while (targetIdx === i);
        
        edges.push({
          id: `edge-${i}-${targetIdx}`,
          source: `file-${i}`,
          target: `file-${targetIdx}`,
          animated: true,
          type: 'flowEdge',
          style: { stroke: '#DAAA3F', strokeWidth: 1.5 }
        });
      }
    }

    return { nodes, edges };
  }, [allCodeFiles]);

  const nodeTypes = useMemo(() => ({ fileNode: FileNode }), []);
  const edgeTypes = useMemo(() => ({ flowEdge: FlowEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();

  // Effect to fit view when selection changes
  useEffect(() => {
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.1, duration: 300 });
    }, 550); 
    return () => clearTimeout(timer);
  }, [selectedFile, reactFlowInstance]);

  // Calculate parsed imports at the top level
  const parsedImportsElement = useMemo(() => {
    if (selectedFile === null || !allCodeFiles[selectedFile]?.content) {
      return null;
    }
    const imports = parseImports(allCodeFiles[selectedFile].content);
    if (imports.length > 0) {
      return (
        <div className="mt-4 pt-3 border-t border-[#30363D]">
          <h4 className="text-xs font-semibold text-[#8B949E] uppercase mb-2 flex items-center">
            <FileCode size={14} className="mr-1.5" />
            References
          </h4>
          <p className="text-xs text-[#8B949E]">
            This file appears to use code from: {imports.map((imp, i) => (
              <code key={i} className="text-xs bg-[#2d333b] text-[#79c0ff] px-1 py-0.5 rounded mx-0.5">{imp}</code>
            ))}{imports.length > 3 ? ', and others.' : '.'}
          </p>
        </div>
      );
    }
    return null;
  }, [selectedFile, allCodeFiles]); // Depend on selection and files

  /* ---- 4. Render ------------------------------------------------ */
  return (
    <div className="w-full bg-[#0D1117] text-[#C9D1D9] rounded-lg p-4 flex flex-col space-y-4">
      {/* Repository Summary Section */} 
      {repositorySummary && (
        <motion.div 
          className="p-4 bg-[#161B22] border border-[#30363D] rounded-lg shadow-md mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-[#E6EDF3] mb-2">Repository Overview</h2>
          <p className="text-sm text-[#8B949E]">{repositorySummary}</p>
        </motion.div>
      )}
      
      {/* Container for Flow and Expanded View */}
      <div className={`w-full transition-all duration-500 ease-in-out ${selectedFile !== null ? 'flex items-start justify-between h-[800px]' : 'block h-[600px]'}`}>
        {/* Flow diagram container */}
        <div className={`${selectedFile !== null ? 'w-1/2 pr-2' : 'w-full'} h-full transition-all duration-500 ease-in-out relative border border-[#30363D] rounded-lg shadow-md bg-[#161B22] overflow-hidden`}>
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
            <Background color="#444" gap={16} size={1} />
            <Controls showInteractive={false} className="bg-[#21262D] border-[#30363D] text-[#C9D1D9]" />
          </ReactFlow>
        </div>

        {/* Code display (Expanded View) */}
        <AnimatePresence>
          {selectedFile !== null && allCodeFiles[selectedFile] && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '49%' }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full overflow-auto pl-2"
            >
              <Card className="w-full h-full border border-[#30363D] bg-[#161B22] rounded-lg overflow-hidden shadow-md">
                {/* Header */}
                <div className="p-5 border-b border-[#30363D] bg-[#21262D] flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getFileIcon(
                        getFileExtension(allCodeFiles[selectedFile].filename)
                      )}
                    </span>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-medium text-[#E6EDF3] font-mono">
                        {allCodeFiles[selectedFile].filename.split('/').pop() || ''}
                      </h2>
                      <p className="text-sm text-[#8B949E]">
                        From section: {allCodeFiles[selectedFile].sectionTitle}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-full text-[#8B949E] hover:bg-[#30363D] hover:text-[#C9D1D9]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 bg-[#161B22] overflow-auto" style={{ height: 'calc(100% - 73px)' }}>
                  {allCodeFiles[selectedFile].sectionContent && (
                    <div className="prose prose-invert max-w-none mb-6 text-[#C9D1D9] prose-p:text-[#C9D1D9] prose-headings:text-[#E6EDF3] prose-a:text-[#58A6FF] prose-code:text-[#79C0FF] prose-strong:text-[#E6EDF3] text-sm">
                      <ReactMarkdown>{allCodeFiles[selectedFile].sectionContent}</ReactMarkdown>
                      
                      {/* Display Parsed Imports (using the pre-calculated element) */}
                      {parsedImportsElement}
                    </div>
                  )}
                  
                  {/* Code with annotations */}
                  <div className="relative">
                    <div className="flex justify-between items-center bg-[#21262D] text-xs px-3 py-2 rounded-t-md border-t border-x border-[#30363D]">
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
                          <HoverCardContent className="w-72 bg-[#21262D] border border-[#30363D] text-[#C9D1D9]">
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-medium text-[#58A6FF]">
                                Language: {allCodeFiles[selectedFile].language}
                              </h4>
                              <p className="text-xs text-[#8B949E]">
                                {allCodeFiles[selectedFile].annotations?.length ? 
                                  `${allCodeFiles[selectedFile].annotations.length} annotations in this file` : 
                                  'No annotations in this file'}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                    
                    <div className="border border-t-0 border-[#30363D] rounded-b-md overflow-hidden">
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

// Wrap the component with ReactFlowProvider
export default function CodeWalkthroughWrapper(props: CodeWalkthroughProps) {
  return (
    <ReactFlowProvider>
      <CodeWalkthroughFlow {...props} />
    </ReactFlowProvider>
  );
}
