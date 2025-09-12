'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, FORMAT_TEXT_COMMAND } from 'lexical';
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkNode } from '@lexical/link';

// Editor theme configuration
const theme = {
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  heading: {
    h1: 'text-2xl font-bold mb-4',
    h2: 'text-xl font-bold mb-3',
    h3: 'text-lg font-bold mb-2',
  },
  list: {
    ul: 'list-disc list-inside mb-2',
    ol: 'list-decimal list-inside mb-2',
  },
  listItem: 'mb-1',
  link: 'text-blue-600 underline hover:text-blue-800',
};

// Plugin to set initial HTML content
function InitialContentPlugin({ initialValue }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log('🔍 EDITOR: InitialContentPlugin useEffect triggered - initialValue length:', initialValue?.length, 'initialValue:', initialValue?.substring(0, 50));
    if (initialValue) {
      console.log('🔍 EDITOR: initialValue is truthy, processing...');
      editor.read(() => {
        const currentHtml = $generateHtmlFromNodes(editor);
        console.log('🔍 EDITOR: Current HTML length:', currentHtml.length, 'Current HTML:', currentHtml.substring(0, 50));
        if (currentHtml !== initialValue) {
          console.log('🔍 EDITOR: HTML differs, updating editor');
          editor.update(() => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(initialValue, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            $getRoot().select();
            $insertNodes(nodes);
          });
        } else {
          console.log('🔍 EDITOR: HTML matches, skipping update');
        }
      });
    } else {
      console.log('🔍 EDITOR: initialValue is falsy (empty), clearing editor...');
      editor.update(() => {
        $getRoot().clear();
      });
    }
  }, [editor, initialValue]);

  return null;
}

// Plugin to handle content changes
function OnChangePluginWrapper({ onChange }) {
  const [editor] = useLexicalComposerContext();
  const changeCount = useRef(0);
  const debounceTimeout = useRef(null);

  const debouncedOnChange = useCallback((htmlString) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      console.log('debouncedOnChange calling onChange - HTML length:', htmlString.length, 'HTML preview:', htmlString.substring(0, 100));
      if (onChange) {
        onChange(htmlString);
      }
    }, 300); // 300ms debounce
  }, [onChange]);

  const handleChange = useCallback((editorState) => {
    changeCount.current += 1;
    const startTime = performance.now();
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      const endTime = performance.now();
      console.log(`RichTextEditor onChange #${changeCount.current} - HTML generation took: ${(endTime - startTime).toFixed(2)}ms, HTML length: ${htmlString.length}`);
      debouncedOnChange(htmlString);
    });
  }, [editor, debouncedOnChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return <OnChangePlugin onChange={handleChange} />;
}

// Rich text editor component
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  className = ''
}) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`RichTextEditor render #${renderCount.current} - value length:`, value?.length, 'value:', value?.substring(0, 50));

  const initialConfig = {
    namespace: 'RichTextEditor',
    theme,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
    onError: (error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          {/* Toolbar */}
          <ToolbarPlugin />

          {/* Editor */}
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[150px] p-3 outline-none prose prose-sm max-w-none"
                style={{
                  resize: 'none',
                }}
              />
            }
            placeholder={
              <div className="absolute top-[52px] left-3 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* Plugins */}
          <OnChangePluginWrapper onChange={onChange} />
          <HistoryPlugin />
          <ListPlugin />
          <InitialContentPlugin initialValue={value} />
        </div>
      </LexicalComposer>
    </div>
  );
};

// Simple toolbar component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  const insertBulletList = useCallback(() => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  const insertNumberedList = useCallback(() => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={formatBold}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      
      <button
        type="button"
        onClick={formatItalic}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded italic"
        title="Italic"
      >
        I
      </button>
      
      <button
        type="button"
        onClick={formatUnderline}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded underline"
        title="Underline"
      >
        U
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <button
        type="button"
        onClick={insertBulletList}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
        title="Bullet List"
      >
        •
      </button>
      
      <button
        type="button"
        onClick={insertNumberedList}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
        title="Numbered List"
      >
        1.
      </button>
    </div>
  );
}

export default RichTextEditor;