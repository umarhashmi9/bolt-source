import React from 'react';

const accounts = [
  {
    name: 'John Smith',
    badge: 'Hobby',
    subtext: 'Free Apps 1/3 created',
    avatar: null, // No avatar, use placeholder
  },
  {
    name: 'John Smith',
    badge: 'Hobby',
    subtext: 'Free Apps 1/3 created',
    avatar: '/icons/user-photo.svg', // Example avatar
  },
];

function AccountItem({ name, badge, subtext, avatar }: typeof accounts[0]) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 hover:bg-white/10 rounded-lg cursor-pointer">
      <div className="w-9 h-9 rounded-full bg-[#23263A] flex items-center justify-center overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="i-ph:user-fill text-2xl text-[#A1A1AA]" />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm truncate">{name}</span>
          <span className="bg-[rgba(189,255,97,0.20)] text-[10px] text-[#BDFF61] px-2 py-0.5 rounded-[37px] font-medium flex items-center justify-center gap-2.5">{badge}</span>
        </div>
        <span className="text-xs text-[#A1A1AA] mt-0.5">{subtext}</span>
      </div>
     <button className='flex items-center justify-center gap-0 bg-transparent flex-col'>
     <span className="i-ph:caret-up text-lg text-[#A1A1AA]" />
     <span className="i-ph:caret-down text-lg text-[#A1A1AA]" />
     </button>
    </div>
  );
}

export const AccountSelector = () => {
  return (
    <div className="bg-transparent p-4 px-0 rounded-xl w-[300px] flex flex-col gap-2">
      {accounts.map((acc, idx) => (
        <AccountItem key={idx} {...acc} />
      ))}
      <button className="mt-2 w-full bg-transparent flex p-2.5 justify-center items-center gap-2 self-stretch rounded-lg border-2 border-blue-500 text-blue-500 text-center font-inter text-sm font-semibold hover:bg-blue-500/10 transition-colors duration-200">
       <img src="/icons/ai-icon.svg" alt="Bolt Logo" />
        Upgrade to PRO
      </button>
    </div>
  );
}; 