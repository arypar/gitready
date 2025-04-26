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
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
}

interface CodeWalkthroughProps {
  sections: {
    title: string;
    content: string;
    code?: CodeWithAnnotations[];
  }[];
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
      className={`bg-white rounded-lg shadow-md border transition-all duration-200 ${selected ? 'border-pink-500 scale-105' : 'border-gray-200 hover:border-blue-300'}`}
      onClick={data.onClick}
      style={{ width: 'auto', minWidth: '220px' }} // Adjust width styling
    >
      <Handle type="target" position={Position.Top} style={{ background: '#888' }} />
      
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-xl">{fileIcon}</span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{shortName}</span>
            <span className="text-xs text-gray-500">{nodeType}</span>
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
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#888' }}
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
    <div className="bg-white overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <table className="min-w-full border-collapse">
        <tbody>
          {lines.map((ln, idx) => {
            const n = idx + 1;
            const ann = annotatedLines.has(n) ? getAnnotation(n) : null;
            return (
              <tr
                key={idx}
                className={
                  ann ? 'bg-blue-50 backdrop-blur-sm' : 'hover:bg-gray-50'
                }
              >
                <td className="text-right py-0 pr-4 pl-4 border-r border-gray-300 text-gray-500 select-none w-[1%] font-mono text-xs">
                  {n}
                </td>
                <td className="py-0.5 px-4 font-mono text-sm whitespace-pre">
                  <SyntaxHighlighter
                    language={language}
                    style={vs}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      background: 'transparent',
                      fontSize: 'inherit',
                      lineHeight: 1.5,
                      color: '#1a202c'
                    }}
                    wrapLines
                  >
                    {ln}
                  </SyntaxHighlighter>
                </td>
                <td className="w-[30%] pl-4 py-0 text-xs text-gray-800">
                  {ann && (
                    <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-500 shadow-sm">
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

export default function CodeWalkthrough({ sections }: CodeWalkthroughProps) {
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

    // Calculate positions in a circular or force-directed layout
    const numFiles = sample.length;
    
    // Create nodes in a vertical layout
    sample.forEach((file, idx) => {
      const x = 400; // Fixed horizontal position
      const y = 120 + idx * 180; // Vertical stacking with spacing
      
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
    
    // Restore simple sequential edges
    edges.length = 0; // Clear existing edges
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}-${i + 1}`,
        source: `file-${i}`,
        target: `file-${i + 1}`,
        animated: true,
        type: 'flowEdge', // Ensure custom edge type is used
        style: { stroke: '#aaa', strokeWidth: 1.5, strokeDasharray: '5,5' } // Restore original styling
      });
    }

    return { nodes, edges };
  }, [allCodeFiles, toggleFile]);

  const nodeTypes = useMemo(() => ({ fileNode: FileNode }), []);
  const edgeTypes = useMemo(() => ({ flowEdge: FlowEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /* ---- 4. Render ------------------------------------------------ */
  return (
    <div className="w-full">
      {/* Container for Flow and Expanded View */}
      <div className={`w-full h-[800px] transition-all duration-500 ease-in-out ${selectedFile !== null ? 'flex items-start justify-between' : 'block'}`}>
        {/* Flow diagram container */}
        <div className={`${selectedFile !== null ? 'w-1/2' : 'w-full'} h-full transition-all duration-500 ease-in-out relative border rounded-lg shadow-md bg-gray-50 overflow-hidden`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Straight}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.2}
            maxZoom={2}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background color="#ddd" gap={12} size={1} />
            <Controls showInteractive={false} className="bg-white" />
          </ReactFlow>
        </div>

        {/* Code display (Expanded View) */}
        <AnimatePresence>
          {selectedFile !== null && allCodeFiles[selectedFile] && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '48%' }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full overflow-auto"
            >
              <Card className="w-full h-full border border-gray-200 bg-white rounded-lg overflow-hidden shadow-md">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getFileIcon(
                        getFileExtension(allCodeFiles[selectedFile].filename)
                      )}
                    </span>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-medium text-gray-800 font-mono">
                        {allCodeFiles[selectedFile].filename.split('/').pop() || ''}
                      </h2>
                      <p className="text-sm text-gray-500">
                        From section: {allCodeFiles[selectedFile].sectionTitle}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 bg-white overflow-auto" style={{ height: 'calc(100% - 73px)' }}> {/* Adjust height calculation based on header */}
                  {allCodeFiles[selectedFile].sectionContent && (
                    <div className="prose max-w-none mb-6 text-black prose-p:text-black prose-headings:text-black prose-a:text-blue-600 prose-code:text-blue-700 prose-strong:text-black text-sm">
                      <ReactMarkdown>{allCodeFiles[selectedFile].sectionContent}</ReactMarkdown>
                    </div>
                  )}
                  
                  {/* Code with annotations */}
                  <div className="relative">
                    <div className="flex justify-between items-center bg-gray-100 text-xs px-3 py-2 rounded-t-md border-t border-x border-gray-300">
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="font-mono text-xs ml-2 cursor-help text-gray-700">
                              {allCodeFiles[selectedFile].filename}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72 bg-white border border-gray-300 text-gray-800">
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-medium text-blue-700">
                                Language: {allCodeFiles[selectedFile].language}
                              </h4>
                              <p className="text-xs text-gray-700">
                                {allCodeFiles[selectedFile].annotations?.length ? 
                                  `${allCodeFiles[selectedFile].annotations.length} annotations in this file` : 
                                  'No annotations in this file'}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                    
                    <div className="border border-t-0 border-gray-300 rounded-b-md overflow-hidden">
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
