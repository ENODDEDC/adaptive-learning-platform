'use client';

import React, { useEffect, useRef } from 'react';

const MermaidFlowchart = ({ data, contentType = 'flowchart' }) => {
  const mermaidRef = useRef(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    // Skip Mermaid entirely and use the beautiful HTML fallback
    setIsLoading(false);
    if (mermaidRef.current && data) {
      mermaidRef.current.innerHTML = renderFallbackFlowchart(data);
    }
  }, [data, contentType]);

  const generateMermaidCode = (data, type) => {
    switch (type) {
      case 'flowchart':
        return generateFlowchartCode(data);
      case 'mindmap':
        return generateMindMapCode(data);
      case 'diagram':
        return generateDiagramCode(data);
      default:
        return generateFlowchartCode(data);
    }
  };

  const generateFlowchartCode = (data) => {
    let code = 'flowchart TD\n';
    
    // Add start node
    code += '    Start([Start: Crypto Idea]) --> A[Transaction Broadcast]\n';
    
    // Add main process steps
    data.sections.forEach((section, index) => {
      const nodeId = `step${index + 1}`;
      const nextNodeId = index < data.sections.length - 1 ? `step${index + 2}` : 'End';
      
      code += `    ${nodeId}[${section.title}]\n`;
      if (index < data.sections.length - 1) {
        code += `    ${nodeId} --> ${nextNodeId}\n`;
      }
    });
    
    // Add end node
    code += '    End([Block Creation Complete])\n';
    code += '    step' + data.sections.length + ' --> End\n';
    
    // Add styling
    code += '    classDef startEnd fill:#3B82F6,stroke:#1E40AF,stroke-width:3px,color:#fff\n';
    code += '    classDef process fill:#F3F4F6,stroke:#6B7280,stroke-width:2px,color:#1F2937\n';
    code += '    class Start,End startEnd\n';
    
    // Add class for each step
    for (let i = 1; i <= data.sections.length; i++) {
      code += `    class step${i} process\n`;
    }
    
    return code;
  };

  const generateMindMapCode = (data) => {
    let code = 'mindmap\n';
    code += '  root((Crypto & Blockchain))\n';
    
    data.sections.forEach((section, index) => {
      code += `    ${section.title}\n`;
      section.content.forEach((item, itemIndex) => {
        code += `      ${item}\n`;
      });
    });
    
    return code;
  };

  const generateDiagramCode = (data) => {
    let code = 'graph TD\n';
    
    data.sections.forEach((section, index) => {
      const nodeId = `node${index + 1}`;
      code += `    ${nodeId}[${section.title}]\n`;
      
      // Connect to next node
      if (index < data.sections.length - 1) {
        const nextNodeId = `node${index + 2}`;
        code += `    ${nodeId} --> ${nextNodeId}\n`;
      }
    });
    
    return code;
  };

  const renderFallbackFlowchart = (data) => {
    return `
      <div class="flowchart-fallback">
        <div class="flowchart-container">
          <div class="flowchart-step start">
            <div class="step-number">🚀</div>
            <div class="step-content">
              <h4>Start: Crypto Idea</h4>
              <p>User initiates a transaction request</p>
            </div>
          </div>
          <div class="arrow">↓</div>
          ${data.sections.map((section, index) => `
            <div class="flowchart-step">
              <div class="step-number">${index + 1}</div>
              <div class="step-content">
                <h4>${section.title}</h4>
                <ul>
                  ${section.content.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>
            ${index < data.sections.length - 1 ? '<div class="arrow">↓</div>' : ''}
          `).join('')}
          <div class="arrow">↓</div>
          <div class="flowchart-step end">
            <div class="step-number">✅</div>
            <div class="step-content">
              <h4>Block Creation Complete</h4>
              <p>Transaction successfully added to blockchain</p>
            </div>
          </div>
        </div>
        <style>
          .flowchart-fallback {
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
          }
          .flowchart-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }
          .flowchart-step {
            display: flex;
            align-items: center;
            gap: 15px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 2px solid #E5E7EB;
            min-width: 350px;
            transition: transform 0.2s ease;
          }
          .flowchart-step:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.15);
          }
          .flowchart-step.start {
            border-color: #10B981;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          }
          .flowchart-step.end {
            border-color: #3B82F6;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          }
          .step-number {
            background: #3B82F6;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            flex-shrink: 0;
          }
          .flowchart-step.start .step-number {
            background: #10B981;
          }
          .flowchart-step.end .step-number {
            background: #3B82F6;
          }
          .step-content h4 {
            margin: 0 0 10px 0;
            color: #1F2937;
            font-size: 18px;
            font-weight: 600;
          }
          .step-content p {
            margin: 0;
            color: #6B7280;
            font-size: 14px;
          }
          .step-content ul {
            margin: 0;
            padding-left: 20px;
            color: #6B7280;
            font-size: 14px;
          }
          .arrow {
            font-size: 28px;
            color: #3B82F6;
            font-weight: bold;
            animation: bounce 2s infinite;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        </style>
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flowchart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <div ref={mermaidRef} className="mermaid-content"></div>
      </div>
    );
  }

  return (
    <div className="mermaid-container">
      <div ref={mermaidRef} className="mermaid-content"></div>
    </div>
  );
};

export default MermaidFlowchart;
