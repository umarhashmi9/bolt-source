import { type ReactNode } from 'react';

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-button">
      {children}
    </div>
  );
}
