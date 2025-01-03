import * as React from 'react';
import clsx from 'clsx';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, className, variant = 'primary', size = 'md' }) => {
  const variantClasses = {
    primary: 'bg-bolt-elements-sidebar-buttonText  text-white',
    secondary: 'bg-gray-700 text-white',
    danger: 'bg-red-500 text-white',
  };
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2.5 text-sm leading-none',
    lg: 'px-6 py-3 text-lg',
  };
  return (
    <button
      onClick={onClick}
      className={clsx(
        variantClasses[variant],
        sizeClasses[size as keyof typeof sizeClasses],
        className,
        'rounded-md flex items-center justify-center',
      )}
    >
      <p className="pb-0.5">{children}</p>
    </button>
  );
};

export default Button;
