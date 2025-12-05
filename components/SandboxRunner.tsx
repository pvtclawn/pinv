'use client';

import { useEffect, useRef } from 'react';

const IFRAME_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; background: transparent; color: white; font-family: sans-serif; overflow: hidden; }
    /* Hide scrollbars */
    ::-webkit-scrollbar { display: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    window.addEventListener('message', (event) => {
      const { code } = event.data;
      if (!code) return;

      try {
        // Robust way to get the exported component:
        // Replace 'export default' with 'return'
        // This works for:
        // - export default function Foo() {} -> return function Foo() {}
        // - export default () => {} -> return () => {}
        // - const Foo = ...; export default Foo; -> const Foo = ...; return Foo;
        
        // Robust way to get the exported component:
        let cleanCode = code;
        if (code.includes('export default')) {
          cleanCode = code.replace(/export\s+default\s+(function\s+\w+|class\s+\w+|const\s+\w+|async\s+function\s+\w+|function\()*?/, 'return $1');
          // Handle simpler cases like "export default App;" -> "return App;" at the end
          cleanCode = cleanCode.replace(/export\s+default\s+([a-zA-Z0-9_]+);?/, 'return $1;');
        }
        
        const transformedCode = Babel.transform(cleanCode, { presets: ['react'] }).code;
        
        const getComponent = new Function('React', 'return (function() { ' + transformedCode + ' })()');
        const WidgetComponent = getComponent(React);

        if (!WidgetComponent) {
          throw new Error('No component returned. Did you forget "export default"?');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<WidgetComponent />);
        
        // Send height update
        const resizeObserver = new ResizeObserver(() => {
          window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight }, '*');
        });
        resizeObserver.observe(document.body);

      } catch (err) {
        document.getElementById('root').innerHTML = '<div class="text-red-500 p-4">Error: ' + err.message + '</div>';
      }
    });
  </script>
</body>
</html>
`;

export default function SandboxRunner({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      // Send code to iframe
      // Small delay to ensure iframe is ready
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ code }, '*');
      }, 100);
    }
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'resize' && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={IFRAME_TEMPLATE}
      className="w-full border-none transition-all duration-200"
      style={{ minHeight: '100px' }}
      sandbox="allow-scripts"
    />
  );
}
