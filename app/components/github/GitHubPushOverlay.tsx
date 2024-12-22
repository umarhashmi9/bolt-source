export function GitHubPushOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0F0F0F] rounded-xl p-6 flex flex-col items-center gap-4 border border-purple-500/30">
        <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-200/20 rounded-full animate-spin" />
        <p className="text-bolt-elements-textPrimary">Pushing your project to GitHub...</p>
      </div>
    </div>
  );
}
