/**
 * Functions for managing chat data in IndexedDB
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  modelId?: string;
  systemPrompt?: string;
}

/**
 * Get all chats from the database
 * @param db The IndexedDB database instance
 * @returns A promise that resolves to an array of chats
 */
export async function getAllChats(db: IDBDatabase): Promise<Chat[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats'], 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get a chat by ID
 * @param db The IndexedDB database instance
 * @param id The ID of the chat to get
 * @returns A promise that resolves to the chat or null if not found
 */
export async function getChatById(db: IDBDatabase, id: string): Promise<Chat | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats'], 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save a chat to the database
 * @param db The IndexedDB database instance
 * @param chat The chat to save
 * @returns A promise that resolves when the chat is saved
 */
export async function saveChat(db: IDBDatabase, chat: Chat): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats'], 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.put(chat);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Delete a chat by ID
 * @param db The IndexedDB database instance
 * @param id The ID of the chat to delete
 * @returns A promise that resolves when the chat is deleted
 */
export async function deleteChat(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats'], 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Delete all chats
 * @param db The IndexedDB database instance
 * @returns A promise that resolves when all chats are deleted
 */
export async function deleteAllChats(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats'], 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
