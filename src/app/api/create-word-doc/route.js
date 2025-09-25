import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Parse the content and create document sections
    const sections = parseContentToSections(content, title);

    // Create a new document with proper page size (8.5 x 11 inches)
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 12240, // 8.5 inches in twentieths of a point (8.5 * 1440)
              height: 15840, // 11 inches in twentieths of a point (11 * 1440)
            },
            margin: {
              top: 1440,    // 1 inch margins
              right: 1440,  // 1 inch margins
              bottom: 1440, // 1 inch margins
              left: 1440,   // 1 inch margins
            },
          },
        },
        children: sections,
      }],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the document as a downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.docx"`,
      },
    });

  } catch (error) {
    console.error('Error creating Word document:', error);
    return NextResponse.json(
      { error: 'Failed to create Word document' },
      { status: 500 }
    );
  }
}

function cleanMarkdownText(text) {
  // Remove ALL markdown formatting symbols
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '') // Remove italic markers
    .replace(/`/g, '') // Remove code markers
    .replace(/~/g, '') // Remove strikethrough markers
    .replace(/#{1,6}\s*/g, '') // Remove heading markers
    .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet point markers
    .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
    .trim();
}

function parseContentToSections(content, title) {
  const sections = [];

  // Add title
  if (title) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cleanMarkdownText(title),
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: {
          after: 400,
        },
      })
    );
  }

  // Split content into lines and process
  const lines = content.split('\n');
  let currentParagraph = [];
  let currentList = [];
  let isInList = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      // Empty line - end current paragraph or list if it has content
      if (currentParagraph.length > 0) {
        sections.push(createParagraph(currentParagraph.join(' ')));
        currentParagraph = [];
      }
      if (isInList && currentList.length > 0) {
        sections.push(...createList(currentList));
        currentList = [];
        isInList = false;
      }
      continue;
    }

    // Handle bullet points and lists
    if (trimmedLine.match(/^[-*•]\s+/) || trimmedLine.startsWith('• ')) {
      // End current paragraph if exists
      if (currentParagraph.length > 0) {
        sections.push(createParagraph(currentParagraph.join(' ')));
        currentParagraph = [];
      }

      const cleanText = cleanMarkdownText(trimmedLine);
      currentList.push(cleanText);
      isInList = true;
      continue;
    }

    // Handle numbered lists
    if (trimmedLine.match(/^\d+\.\s+/)) {
      // End current paragraph or unordered list if exists
      if (currentParagraph.length > 0) {
        sections.push(createParagraph(currentParagraph.join(' ')));
        currentParagraph = [];
      }
      if (isInList && currentList.length > 0) {
        sections.push(...createList(currentList));
        currentList = [];
        isInList = false;
      }

      const cleanText = cleanMarkdownText(trimmedLine);
      sections.push(createNumberedListItem(cleanText));
      continue;
    }

    // End current list if we're starting a regular paragraph or heading
    if (isInList && currentList.length > 0) {
      sections.push(...createList(currentList));
      currentList = [];
      isInList = false;
    }

    if (isHeading(trimmedLine)) {
      // Heading - end current paragraph and add heading
      if (currentParagraph.length > 0) {
        sections.push(createParagraph(currentParagraph.join(' ')));
        currentParagraph = [];
      }
      sections.push(createHeading(trimmedLine));
    } else {
      // Regular content - add to current paragraph
      currentParagraph.push(cleanMarkdownText(trimmedLine));
    }
  }

  // Add any remaining content
  if (currentParagraph.length > 0) {
    sections.push(createParagraph(currentParagraph.join(' ')));
  }
  if (isInList && currentList.length > 0) {
    sections.push(...createList(currentList));
  }

  return sections;
}

function isHeading(line) {
  // Check if line looks like a heading (starts with #, is all caps, ends with :, etc.)
  return (
    line.startsWith('#') ||
    line.match(/^[A-Z\s]+:?\s*$/) ||
    line.match(/^\d+\.\s+[A-Z]/) ||
    (line.length < 100 && line.endsWith(':'))
  );
}

function createHeading(text) {
  // Remove markdown heading symbols and clean text
  const cleanText = cleanMarkdownText(text);

  return new Paragraph({
    children: [
      new TextRun({
        text: cleanText,
        bold: true,
        size: 24,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: {
      before: 400,
      after: 200,
    },
  });
}

function createParagraph(text) {
  const cleanText = cleanMarkdownText(text);

  return new Paragraph({
    children: [
      new TextRun({
        text: cleanText,
        size: 22,
      }),
    ],
    spacing: {
      after: 200,
    },
  });
}

function createList(listItems) {
  // Create multiple paragraphs for list items with bullet points
  return listItems.map((item, index) =>
    new Paragraph({
      children: [
        new TextRun({
          text: `• ${item}`,
          size: 22,
        }),
      ],
      spacing: {
        after: 100,
      },
      indent: {
        left: 400, // Indent list items
      },
    })
  );
}

function createNumberedListItem(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: 22,
      }),
    ],
    spacing: {
      after: 100,
    },
    indent: {
      left: 400, // Indent numbered items
    },
  });
}