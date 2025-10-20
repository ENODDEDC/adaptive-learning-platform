import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pdfUrl } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    console.log('Getting page count for PDF:', pdfUrl);

    try {
      // Method 1: Try with pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      console.log(`PDF page count detected: ${pageCount} pages`);

      return NextResponse.json({
        success: true,
        totalPages: pageCount,
        method: 'pdf-lib'
      });

    } catch (pdfLibError) {
      console.warn('pdf-lib failed, trying pdf-parse:', pdfLibError.message);
      
      try {
        // Method 2: Fallback to pdf-parse
        const pdfParse = (await import('pdf-parse')).default;
        
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const data = await pdfParse(Buffer.from(pdfBuffer));
        
        console.log(`PDF page count detected with pdf-parse: ${data.numpages} pages`);

        return NextResponse.json({
          success: true,
          totalPages: data.numpages,
          method: 'pdf-parse'
        });

      } catch (parseError) {
        console.error('Both pdf-lib and pdf-parse failed:', parseError);
        
        // Method 3: Try to estimate from PDF structure
        try {
          const pdfResponse = await fetch(pdfUrl);
          const pdfText = await pdfResponse.text();
          
          // Look for page count indicators in PDF structure
          const pageMatches = pdfText.match(/\/Count\s+(\d+)/g);
          if (pageMatches && pageMatches.length > 0) {
            const counts = pageMatches.map(match => parseInt(match.match(/\d+/)[0]));
            const maxCount = Math.max(...counts);
            
            console.log(`PDF page count estimated from structure: ${maxCount} pages`);
            
            return NextResponse.json({
              success: true,
              totalPages: maxCount,
              method: 'structure-analysis'
            });
          }
          
          throw new Error('Could not determine page count');
          
        } catch (structureError) {
          console.error('Structure analysis also failed:', structureError);
          
          // Final fallback
          return NextResponse.json({
            success: true,
            totalPages: 1,
            method: 'fallback',
            warning: 'Could not determine actual page count'
          });
        }
      }
    }

  } catch (error) {
    console.error('PDF page count API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to get page count: ${error.message}`,
        totalPages: 1 // Fallback
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}