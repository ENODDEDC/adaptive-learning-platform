'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Validates and fixes common Mermaid syntax errors
 * Last line of defense before rendering
 */
function sanitizeMermaidCode(code) {
  if (!code || typeof code !== 'string') return code;

  let sanitized = code;

  // Remove parentheses from node labels
  sanitized = sanitized.replace(/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g, '[$1- $2$3]');

  // Remove numbers from node IDs
  sanitized = sanitized.replace(/\b([A-Z])\d+\[/g, '$1[');

  // Truncate long labels
  sanitized = sanitized.replace(/\[([^\]]{50,})\]/g, (match, label) => {
    return `[${label.substring(0, 47)}...]`;
  });

  // Clean special characters from labels
  sanitized = sanitized.replace(/\[([^\]]+)\]/g, (match, label) => {
    const cleaned = label.replace(/[^a-zA-Z0-9\s\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    return `[${cleaned}]`;
  });

  if (sanitized !== code) {
    console.log('🔧 Client-side diagram sanitization applied');
  }

  return sanitized;
}

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chart) return;

    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: { useMaxWidth: true, htmlLabels: true },
          themeVariables: {
            primaryColor: '#ede9fe',
            primaryTextColor: '#5b21b6',
            primaryBorderColor: '#7c3aed',
            lineColor: '#7c3aed',
            secondaryColor: '#ddd6fe',
          }
        });

        // Clean the chart text — remove markdown code fences and sanitize
        const cleanChart = chart
          .replace(/```mermaid\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        // Apply sanitization to fix common syntax errors
        const sanitizedChart = sanitizeMermaidCode(cleanChart);

        const id = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;
        const result = await mermaid.render(id, sanitizedChart);

        if (!cancelled) {
          // Force SVG to fill container width
          const svgWithStyle = result.svg.replace('<svg ', '<svg style="width:100%;max-width:100%;height:auto;" ');
          setSvg(svgWithStyle);
        }
      } catch (e) {
        console.error('Mermaid render error:', e);
        if (!cancelled) setError(e.message || 'Could not render diagram');
      }
    };

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs text-red-600 font-medium">Diagram render failed</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">Show diagram code</summary>
          <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-x-auto">{chart}</pre>
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto rounded-lg bg-white p-2"
      style={{ minHeight: '200px' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
