import React from 'react';

/**
 * AdsterraBanner renders an Adsterra banner unit inside a clean, isolated iframe.
 * This prevents global window.atOptions collisions and React SPA re-render issues.
 */
const AdsterraBanner = ({ slot, className = '' }) => {
  if (!slot) return null;
  const { key, width, height, scriptSrc } = slot;

  const iframeDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="${scriptSrc}"></script>
</body>
</html>`;

  return (
    <div className={`flex justify-center items-center my-3 overflow-hidden ${className}`}>
      <iframe
        title={`ad-${key}`}
        srcDoc={iframeDoc}
        width={width}
        height={height}
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        loading="lazy"
      />
    </div>
  );
};

export default AdsterraBanner;
