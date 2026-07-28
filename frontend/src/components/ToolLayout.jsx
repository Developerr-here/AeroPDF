import React from 'react';

const ToolLayout = ({ title, description, children }) => {
  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full pt-16 pb-24 px-4">
      <div className="text-center max-w-3xl mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xl text-gray-600 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ToolLayout;
