import React from 'react';
import { m } from 'framer-motion';

interface Props {
  children: React.ReactNode;
}

const PageTransition: React.FC<Props> = ({ children }) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
};

export default PageTransition;
