interface GitCloneSpinnerProps {
  isOpen: boolean;
}

export function GitCloneSpinner({ isOpen }: GitCloneSpinnerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Full screen blocker that prevents all interactions */}
      <div className="fixed inset-0 bg-transparent z-[9999]" />
      
      {/* Spinner overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
        <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#6F3FB6] shadow-2xl flex flex-col items-center gap-4">
          <div className="i-svg-spinners:90-ring-with-bg text-[#6F3FB6] text-4xl animate-spin" />
          <div className="text-white text-lg">Cloning Repository...</div>
          <div className="text-[#8B8B8B] text-sm">This may take a few moments</div>
        </div>
      </div>
    </>
  );
}
