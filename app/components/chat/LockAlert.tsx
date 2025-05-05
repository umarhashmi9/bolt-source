import { AnimatePresence, motion } from 'framer-motion';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
}

export default function LockAlert({ clearAlert }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-bolt-elements-borderColor border-l-2 border-l-amber-500 bg-bolt-elements-background-depth-2 mb-2 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 pb-2 flex items-center">
          <motion.div
            className="flex-shrink-0 mr-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="i-ph:lock-simple-duotone text-xl text-amber-500"></div>
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-amber-500"
          >
            File Lock Error
          </motion.h3>
        </div>

        {/* Content */}
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-bolt-elements-textSecondary"
          >
            <p className="mb-3">
              The file is locked and cannot be modified. You need to unlock the file before making changes.
            </p>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          className="p-3 bg-bolt-elements-background-depth-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-end gap-2">
            <button
              onClick={clearAlert}
              className={classNames(
                `px-3 py-2 rounded-md text-sm font-medium transition-colors`,
                'bg-bolt-elements-button-secondary-background',
                'hover:bg-bolt-elements-button-secondary-backgroundHover',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-secondary-background',
                'text-bolt-elements-button-secondary-text',
                'hover:bg-amber-50 dark:hover:bg-amber-950/20',
              )}
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
