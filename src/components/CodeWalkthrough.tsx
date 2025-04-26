'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Card } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Position,
  EdgeProps,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

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
  const ext = getFileExtension(data.filename);
  return (
    <div
      className={`bg-white rounded-lg shadow-md border transition-all duration-200 ${
        selected ? 'border-pink-500 scale-105' : 'border-gray-200'
      }`}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#888' }} />
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-xl">{getFileIcon(ext)}</span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {data.filename.split('/').pop()}
            </span>
            <span className="text-xs text-gray-500">{data.type}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase font-medium">{ext}</span>
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

    sample.forEach((file, idx) => {
      nodes.push({
        id: `n-${idx}`,
        type: 'fileNode',
        position: { x: 300, y: idx * 160 },
        data: {
          ...file,
          type: 'File',
          lines: file.content.split('\n').length,
          onClick: () => toggleFile(idx),
        },
      });
      if (idx < sample.length - 1) {
        edges.push({
          id: `e-${idx}`,
          source: `n-${idx}`,
          target: `n-${idx + 1}`,
          animated: true,
          type: 'flowEdge',
        } as Edge);
      }
    });

    return { nodes, edges };
  }, [allCodeFiles]);

  const nodeTypes = useMemo(() => ({ fileNode: FileNode }), []);
  const edgeTypes = useMemo(() => ({ flowEdge: FlowEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /* ---- 4. Render ------------------------------------------------ */
  return (
    <div className="w-full">
      <div
        className={`w-full h-[800px] transition-all duration-500 flex ${
          selectedFile !== null ? 'items-start justify-between' : 'block'
        }`}
      >
        {/* ---------- Left: dependency graph ---------- */}
        <div
          className={`transition-all duration-500 ${
            selectedFile !== null ? 'w-1/2' : 'w-full'
          }`}
        >
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
            <Controls showInteractive={false} className="bg-white" />
          </ReactFlow>
        </div>

        {/* ---------- Right: file detail ---------- */}
        <AnimatePresence>
          {selectedFile !== null && allCodeFiles[selectedFile] && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '48%' }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full overflow-auto"
            >
              <Card className="w-full h-full border bg-white rounded-lg overflow-hidden shadow-md">
                {/* header */}
                <div className="p-5 border-b border-gray-200 bg-white">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getFileIcon(
                        getFileExtension(allCodeFiles[selectedFile].filename)
                      )}
                    </span>
                    <h2 className="text-lg font-medium font-mono">
                      {allCodeFiles[selectedFile].filename.split('/').pop()}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    From section: {allCodeFiles[selectedFile].sectionTitle}
                  </p>
                </div>

                {/* markdown + code */}
                <div className="p-5 bg-white overflow-auto">
                  {allCodeFiles[selectedFile].sectionContent && (
                    <div className="prose max-w-none mb-6 text-black">
                      <ReactMarkdown>
                        {allCodeFiles[selectedFile].sectionContent}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-center bg-gray-100 text-xs px-3 py-2 rounded-t-md border border-b-0 border-gray-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="font-mono text-xs ml-2 cursor-help text-gray-700">
                            {allCodeFiles[selectedFile].filename.split('/').pop()}
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 bg-white border border-gray-300 text-gray-800">
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-medium text-blue-700">
                              Language: {allCodeFiles[selectedFile].language}
                            </h4>
                            <p className="text-xs text-gray-700">
                              Lines with blue background have comments.
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
