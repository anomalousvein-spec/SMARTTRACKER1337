import React from 'react';
import { m } from 'framer-motion';

const RouteLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <m.div
        className="w-12 h-12 border-4 border-theme-accent border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default RouteLoader;
