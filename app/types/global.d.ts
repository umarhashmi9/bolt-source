interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  webkitSpeechRecognition: typeof SpeechRecognition;
  SpeechRecognition: typeof SpeechRecognition;
}

interface Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

interface Pricing {
  id: string;
  price: number;
  tokens: number;
  tokens_before?: number;
  description: string;
  annual: number;
  priceId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  githubId: string;
  subscriptionId: string;
  avatar: string;
}
