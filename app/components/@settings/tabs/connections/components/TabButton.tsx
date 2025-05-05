import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={classNames(
        'px-4 py-2 h-10 rounded-lg transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center relative overflow-hidden',
        active
          ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm shadow-purple-500/20'
          : 'bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark hover:bg-bolt-elements-background-depth-3 dark:hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark',
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {active && (
        <motion.span
          layoutId="activeTab"
          className="absolute inset-0 bg-purple-500 -z-10"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className={classNames('flex items-center gap-2', active ? 'font-medium' : '')}>{children}</span>
    </motion.button>
  );
}
