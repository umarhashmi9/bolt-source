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
  googleId: string;
  subscriptionId: string;
  avatar: string;
  subscription: {
    name: string;
    price: number;
    cancelAt: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    currentPeriodEnd: string;
    currentPeriodStart: string;
    endedAt: string | null;
    planType: string;
  };
}
