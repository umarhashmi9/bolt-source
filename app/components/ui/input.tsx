import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ ...props }: InputProps) {
  return (
    <input
      {...props}
      className="w-full p-[7px] border border-bolt-elements-item-contentDefault text-sm leading-none bg-bolt-elements-background-depth-1 focus:border-[#1287fd] outline-none text-bolt-elements-textSecondary placeholder:text-bolt-elements-textSecondary"
      required
    />
  );
}
