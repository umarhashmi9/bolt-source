import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function Input({ error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        {...props}
        className="w-full p-[7px] border border-bolt-elements-item-contentDefault text-sm leading-none bg-bolt-elements-background-depth-1 focus:border-[#1287fd] outline-none text-bolt-elements-textSecondary placeholder:text-bolt-elements-textSecondary"
        required
      />
      {error && <div className="text-[#c7c7c7] text-sm">{error}</div>}
    </div>
  );
}
