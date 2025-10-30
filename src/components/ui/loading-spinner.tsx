
import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen backdrop-blur-2xl">
      <div className="relative w-14 h-14">
        {/* Elegant spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-primary animate-spin"></div>

        {/* Soft inner glow */}
        <div className="absolute inset-2 rounded-full border-2 border-brand-primary/30"></div>

       
      </div>
    </div>
  );
};

export default LoadingSpinner;
