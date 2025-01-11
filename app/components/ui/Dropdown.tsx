import { type ReactNode } from 'react';
import { Transition } from '@headlessui/react';

interface DropdownProps {
  children: ReactNode[];
  show: boolean;
  onClose: () => void;
}

export function Dropdown({ children, show, onClose }: DropdownProps) {
  // Separate trigger and menu content
  const [trigger, menu] = children;

  return (
    <div className="relative inline-block text-left">
      {/* Trigger */}
      {trigger}

      {/* Backdrop */}
      {show && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30" aria-hidden="true" onClick={onClose} />}

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-56 z-50">
        <Transition
          show={show}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95 -translate-y-2"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100 translate-y-0"
          leaveTo="transform opacity-0 scale-95 -translate-y-2"
        >
          <div
            className="
            rounded-md shadow-lg 
            bg-bolt-elements-background-depth-3 
            ring-1 ring-black ring-opacity-5 
            border border-bolt-elements-borderColor
            shadow-[0_0_15px_rgba(0,0,0,0.3)]
          "
          >
            {menu}
          </div>
        </Transition>
      </div>
    </div>
  );
}
