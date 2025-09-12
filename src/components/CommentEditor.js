'use client';

import React, { useEffect, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkNode } from '@lexical/link';

// Minimal theme
const theme = {
  paragraph: 'mb-1',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  list: {
    ul: 'list-disc list-inside mb-1',
    ol: 'list-decimal list-inside mb-1',
  },
  listItem: 'mb-0.5',
  link: 'text-blue-600 underline hover:text-blue-800',
};

// Initial content plugin
function InitialContentPlugin({ initialValue }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialValue) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialValue, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().select();
      $insertNodes(nodes);
    });
  }, [editor, initialValue]);

  return null;
}

// Toolbar plugin
function CommentToolbarPlugin({ onSubmit }) {
  const [editor] = useLexicalComposerContext();

  const formatBold = useCallback(() => {
    editor.dispatchCommand('FORMAT_TEXT_COMMAND', 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand('FORMAT_TEXT_COMMAND', 'italic');
  }, [editor]);

  return (
    <div className="flex items-center gap-1 p-1 border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={formatBold}
        className="px-1.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={formatItalic}
        className="px-1.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded italic"
        title="Italic"
      >
        I
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onSubmit}
        className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        title="Submit Comment"
      >
        Post
      </button>
    </div>
  );
}

// Fixed ChangePlugin
function ChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState) => {
      if (!editor) return;

      editorState.read(() => {
        try {
          const htmlString = $generateHtmlFromNodes(editor);
          onChange?.(htmlString);
        } catch (err) {
          console.error('Failed to generate HTML:', err);
        }
      });
    },
    [editor, onChange]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

// Main CommentEditor
const CommentEditor = ({ value = '', onChange, placeholder = 'Write a comment...', onSubmit, className = '' }) => {
  const initialConfig = {
    namespace: 'CommentEditor',
    theme,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
    onError: (error) => console.error('Lexical error:', error),
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <CommentToolbarPlugin onSubmit={onSubmit} />
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[60px] max-h-[120px] p-2 outline-none prose prose-sm max-w-none overflow-y-auto"
                style={{ resize: 'none' }}
              />
            }
            placeholder={
              <div className="absolute top-[32px] left-2 text-gray-400 pointer-events-none text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ChangePlugin onChange={onChange} />
          <HistoryPlugin />
          <ListPlugin />
          <InitialContentPlugin initialValue={value} />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default CommentEditor;
