import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface WindowTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  type: 'user' | 'developer';
}

export function WindowTransition({ children, isOpen, onClose, type }: WindowTransitionProps) {
  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/30" />
        <Dialog.Content
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
        >
          <Dialog.Title asChild>
            <VisuallyHidden>{type === 'user' ? 'User Settings' : 'Developer Settings'}</VisuallyHidden>
          </Dialog.Title>

          <Dialog.Description asChild>
            <VisuallyHidden>
              {type === 'user' ? 'Configure user settings and preferences' : 'Configure developer tools and settings'}
            </VisuallyHidden>
          </Dialog.Description>

          <motion.div
            className="w-[1200px] h-[90vh] relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={classNames(
                'w-full h-full',
                'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
                'rounded-lg overflow-hidden',
                'shadow-xl',
                'border border-[#E5E5E5] dark:border-[#1A1A1A]',
              )}
            >
              {children}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
