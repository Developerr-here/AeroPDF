import React, { useEffect, useRef } from 'react';

/**
 * AdsterraNativeBanner:
 * 4:1 Widget layout native ad cards.
 */
const AdsterraNativeBanner = ({ className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset container
    el.innerHTML = '<div id="container-26edbe1f35d1ba06669d9792303307aa"></div>';

    // Inject Native Banner script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://bauval.org/21/26edbe1f35d1ba06669d9792303307aa';
    el.appendChild(script);

    return () => {
      if (el) {
        el.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`w-full max-w-[1200px] mx-auto my-6 px-4 ${className}`}>
      <div ref={containerRef} className="w-full min-h-[100px] flex justify-center" />
    </div>
  );
};

export default AdsterraNativeBanner;
