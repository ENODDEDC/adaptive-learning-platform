import { NextResponse } from 'next/server';
import Note from '@/models/Note';
import TurndownService from 'turndown';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');
  const format = searchParams.get('format');

  if (!contentId) {
    return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
  }

  const notes = await Note.find({ contentId }).sort({ createdAt: 'asc' });

  if (format === 'markdown') {
    const turndownService = new TurndownService();
    let markdownContent = `# Notes for Content ${contentId}\n\n`;
    notes.forEach(note => {
      if (note.contextualText) {
        markdownContent += `> ${note.contextualText}\n\n`;
      }
      markdownContent += `${turndownService.turndown(note.content)}\n\n---\n\n`;
    });

    return new NextResponse(markdownContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="notes-${contentId}.md"`,
      },
    });
  } else if (format === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;

    page.drawText(`Notes for Content ${contentId}`, {
        x: 50,
        y,
        font: boldFont,
        size: 24,
    });
    y -= 40;

    const turndownService = new TurndownService();
    for (const note of notes) {
        if (y < 100) {
            page = pdfDoc.addPage();
            y = height - 50;
        }

        if (note.contextualText) {
            page.drawText(`> ${note.contextualText.replace(/\s+/g, ' ').trim()}`, {
                x: 50,
                y,
                font,
                size: 12,
                color: rgb(0.5, 0.5, 0.5),
            });
            y -= 20;
        }

        const markdown = turndownService.turndown(note.content);
        const lines = markdown.split('\n');

        for (const line of lines) {
            if (y < 50) {
                page = pdfDoc.addPage();
                y = height - 50;
            }
            // Basic markdown handling
            if (line.startsWith('#')) {
                const level = line.indexOf(' ');
                page.drawText(line.substring(level + 1), { x: 50, y, font: boldFont, size: 20 - level * 2 });
            } else {
                page.drawText(line, { x: 50, y, font, size: 12 });
            }
            y -= 15;
        }
        
        y -= 10;
        page.drawLine({
            start: { x: 50, y },
            end: { x: width - 50, y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        });
        y-= 10;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="notes-${contentId}.pdf"`,
      },
    });
  }


  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}