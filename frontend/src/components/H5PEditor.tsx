import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    H5P?: any;
    H5PEditor?: any;
    H5PIntegration?: any;
  }
}

export interface H5PEditorProps {
  videoId: string;
  onSave: (h5pData: any) => void;
  onCancel: () => void;
}

const H5PEditor: React.FC<H5PEditorProps> = ({ videoId, onSave, onCancel }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load H5P scripts and styles if not already loaded
    const loadH5PLibraries = async () => {
      // Load H5P core first
      const coreScript = document.createElement('script');
      coreScript.src = '/h5p/libraries/core/h5p.js';
      document.body.appendChild(coreScript);

      coreScript.onload = () => {
        if (!window.H5PIntegration) window.H5PIntegration = {};
        if (!window.H5PEditor) {
          const editorScript = document.createElement('script');
          editorScript.src = '/h5p/libraries/H5PEditor/editor.js';
          document.body.appendChild(editorScript);
          const editorStyle = document.createElement('link');
          editorStyle.rel = 'stylesheet';
          editorStyle.href = '/h5p/libraries/H5PEditor/editor.css';
          document.head.appendChild(editorStyle);
          editorScript.onload = () => {
            // Load the Hub client script after editor.js is loaded
            const hubScript = document.createElement('script');
            hubScript.src = '/h5p/libraries/hub/hub-client.js';
            document.body.appendChild(hubScript);
            hubScript.onload = () => {
              // Initialize H5P Editor after all scripts load
              if (window.H5PEditor && editorRef.current) {
                const editor = new window.H5PEditor.Editor(
                  // ...other config,
                  {
                    hubIsEnabled: true,
                    // ...other options
                  }
                );
                // You will need to pass config and handle save events
              }
            };
          };
        } else if (editorRef.current) {
          // Already loaded, initialize editor with hub enabled
          const editor = new window.H5PEditor.Editor(
            // ...other config,
            {
              hubIsEnabled: true,
              // ...other options
            }
          );
        }
      };
    };
    loadH5PLibraries();
  }, [videoId]);

  return (
    <div>
      <div ref={editorRef} id="h5p-editor-container"></div>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSave({})}>Save H5P</button>
    </div>
  );
};

export default H5PEditor;
