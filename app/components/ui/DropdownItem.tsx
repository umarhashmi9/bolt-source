import { type ReactNode } from 'react';

interface DropdownItemProps {
  children: ReactNode;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownItem({ children, icon, onClick, disabled = false }: DropdownItemProps) {
  return (
    <button
      type="button"
      className={`
        group flex items-center w-full px-4 py-2.5 text-sm
        ${
          disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-200 hover:bg-bolt-elements-background-depth-4 hover:text-white active:bg-bolt-elements-background-depth-5'
        }
        transition-all duration-150 ease-in-out
        border-b border-bolt-elements-borderColor last:border-b-0
      `}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
    >
      {icon && (
        <div
          className={`
            ${icon} mr-3 h-5 w-5 flex-shrink-0 
            transition-all duration-150
            ${disabled ? 'opacity-50' : 'group-hover:scale-110'}
          `}
        />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}
