'use client';

import { useEffect, useRef, useState } from 'react';

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

        // Clean the chart text — remove any markdown code fences if present
        const cleanChart = chart
          .replace(/```mermaid\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const id = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;
        const result = await mermaid.render(id, cleanChart);

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
