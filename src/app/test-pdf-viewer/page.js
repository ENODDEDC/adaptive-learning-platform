'use client';

import { useState } from 'react';
import PdfPreviewWithAI from '../../components/PdfPreviewWithAI';

export default function TestPDFViewer() {
  const [selectedPDF, setSelectedPDF] = useState('');

  // Sample PDF URLs for testing
  const samplePDFs = [
    {
      title: 'Sample Educational PDF',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: 'Basic PDF for testing viewer functionality'
    },
    {
      title: 'Research Paper Sample',
      url: 'https://arxiv.org/pdf/1706.03762.pdf',
      description: 'Attention Is All You Need - Transformer paper'
    }
  ];

  const handlePDFSelect = (pdfUrl, title) => {
    setSelectedPDF({ url: pdfUrl, title });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Viewer Test</h1>
          <p className="text-gray-600 mb-6">
            Test the enhanced PDF viewer with AI Learning Modes integration
          </p>

          {!selectedPDF && (
            <div className="grid gap-4 md:grid-cols-2">
              {samplePDFs.map((pdf, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handlePDFSelect(pdf.url, pdf.title)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pdf.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {pdf.description}
                  </p>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Open PDF
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedPDF && (
            <div className="mb-4">
              <button
                onClick={() => setSelectedPDF('')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to PDF Selection
              </button>
            </div>
          )}
        </div>

        {selectedPDF && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Testing Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click any AI Learning Mode button to test individual loading states</li>
                <li>• Each button should show its own loading spinner when clicked</li>
                <li>• Only the clicked button should show loading, not multiple buttons</li>
                <li>• Test with different learning modes to verify isolation</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '75vh' }}>
              <PdfPreviewWithAI
                content={{
                  title: selectedPDF.title,
                  filePath: selectedPDF.url,
                  originalName: selectedPDF.title
                }}
                pdfUrl={selectedPDF.url}
                notes={[]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}