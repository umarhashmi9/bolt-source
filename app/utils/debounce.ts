export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let latestArgs: Parameters<T> | null = null;

  function executedFunction(...args: Parameters<T>) {
    // Store the latest arguments to use when the function is actually called
    latestArgs = args;

    const later = () => {
      timeout = null;

      if (latestArgs) {
        func(...latestArgs);
        latestArgs = null; // Clear arguments after execution
      }
    };

    // Clear previous timeout
    if (timeout) {
      clearTimeout(timeout);
    }

    // Set new timeout
    timeout = setTimeout(later, wait);
  }

  // Add cancel method to the returned function
  executedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      latestArgs = null;
    }
  };

  return executedFunction as ((...args: Parameters<T>) => void) & { cancel: () => void };
}
