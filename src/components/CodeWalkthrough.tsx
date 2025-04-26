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
  const ext = data.fileExt || getFileExtension(data.filename);
  const fileIcon = getFileIcon(ext);
  
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border transition-all duration-200 ${
        selected 
          ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
      }`}
      onClick={data.onClick}
      style={{ width: '220px' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#888' }} />
      
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-50 rounded-lg text-xl">
            {fileIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 truncate">
              {data.fileName || data.filename.split('/').pop()}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {data.filename}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-3 flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="flex flex-col items-center px-2 py-1 bg-gray-50 rounded-md">
            <span className="text-xs text-gray-500">Lines</span>
            <span className="font-medium text-sm">{data.lines}</span>
          </div>
          
          {data.hasAnnotations && (
            <div className="flex flex-col items-center px-2 py-1 bg-blue-50 rounded-md">
              <span className="text-xs text-blue-500">Notes</span>
              <span className="font-medium text-sm text-blue-600">
                {data.numAnnotations}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs px-2 py-1 bg-gray-100 rounded-full">
          <span className="font-mono">{ext.toUpperCase()}</span>
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
    <div className="bg-white overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300">
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
                <td className="text-right py-0 pr-4 pl-4 border-r border-gray-300 text-gray-600 select-none w-[1%] font-mono text-xs">
                  {n}
                </td>
                <td className="py-1 px-4 font-mono text-sm whitespace-pre">
                  <SyntaxHighlighter
                    language={language}
                    style={vs}
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
                <td className="w-[30%] pl-4 py-0 text-xs">
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
    const radius = Math.max(200, numFiles * 30);
    
    // Create nodes in a circle layout
    sample.forEach((file, idx) => {
      // For a circle layout:
      const angle = (idx / numFiles) * 2 * Math.PI;
      const x = 400 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);
      
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
          ...file,
          fileName,
          fileExt,
          type: 'File',
          lines: file.content.split('\n').length,
          hasAnnotations: file.annotations && file.annotations.length > 0,
          numAnnotations: file.annotations?.length || 0,
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
    
    // Add some default edges if no relationships were found
    if (edges.length === 0 && nodes.length > 1) {
      // Simple chain connection
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge-${i}`,
          source: `file-${i}`,
          target: `file-${i + 1}`,
          animated: true,
          type: 'flowEdge',
        } as Edge);
      }
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
      <div
        className={`w-full transition-all duration-500 flex flex-col ${
          selectedFile !== null ? 'h-[900px]' : 'h-[600px]'
        }`}
      >
        {/* Help text */}
        {nodes.length > 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">
              {selectedFile === null 
                ? 'Click on a file node to view its content and annotations' 
                : 'Viewing selected file. Click again to close or select another file.'}
            </p>
          </div>
        )}
        
        {/* Flow diagram */}
        <div className="w-full border rounded-lg shadow-md bg-gray-50 overflow-hidden" 
          style={{height: selectedFile !== null ? '40%' : '100%'}}>
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

        {/* Code display */}
        <AnimatePresence>
          {selectedFile !== null && allCodeFiles[selectedFile] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '58%' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full mt-4 overflow-hidden"
            >
              <Card className="h-full border bg-white rounded-lg overflow-hidden shadow-md">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getFileIcon(
                        getFileExtension(allCodeFiles[selectedFile].filename)
                      )}
                    </span>
                    <div>
                      <h2 className="text-lg font-medium font-mono">
                        {allCodeFiles[selectedFile].filename.split('/').pop()}
                      </h2>
                      <p className="text-sm text-gray-500">
                        From section: {allCodeFiles[selectedFile].sectionTitle}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex h-full overflow-hidden">
                  {/* Left side: section content */}
                  {allCodeFiles[selectedFile].sectionContent && (
                    <div className="w-1/3 p-4 border-r border-gray-200 overflow-auto">
                      <h3 className="text-lg font-medium mb-2">Section Description</h3>
                      <div className="prose max-w-none text-gray-800">
                        <ReactMarkdown>
                          {allCodeFiles[selectedFile].sectionContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* Right side: code with annotations */}
                  <div className="flex-1 overflow-auto">
                    <div className="p-4">
                      <div className="flex items-center bg-gray-100 text-xs px-3 py-2 rounded-t-md border border-b-0 border-gray-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />
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

                      <div className="border border-gray-300 rounded-b-md overflow-hidden">
                        <CodeRenderer
                          code={allCodeFiles[selectedFile].content}
                          language={allCodeFiles[selectedFile].language}
                          annotations={allCodeFiles[selectedFile].annotations}
                        />
                      </div>
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
