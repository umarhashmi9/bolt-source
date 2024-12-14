import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import type { GitAuth } from 'isomorphic-git';

interface EncryptedKey {
  salt: string;
  key: string;
}

let masterKey: CryptoKey | null = null;

const hasMasterKeyStored = (): boolean => {
  return localStorage.getItem('masterKeyData') !== null;
};

const isEncryptionInitialized = (): boolean => {
  return masterKey !== null;
};

const encrypt = async (text: string): Promise<string> => {
  if (!masterKey) {
    throw new Error('Master key not initialized');
  }

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = encoder.encode(text);

  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, masterKey, encodedText);

  const encryptedArray = new Uint8Array(encryptedData);
  const combinedArray = new Uint8Array(iv.length + encryptedArray.length);
  combinedArray.set(iv);
  combinedArray.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...combinedArray));
};

const decrypt = async (encryptedText: string): Promise<string> => {
  if (!masterKey) {
    throw new Error('Master key not initialized');
  }

  try {
    const decoder = new TextDecoder();
    const encryptedArray = new Uint8Array(
      atob(encryptedText)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );

    const iv = encryptedArray.slice(0, 12);
    const encryptedData = encryptedArray.slice(12);

    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, masterKey, encryptedData);

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
};

const loadMasterKey = async (password: string): Promise<boolean> => {
  try {
    const keyData = localStorage.getItem('masterKeyData');

    if (!keyData) {
      return false;
    }

    const { salt, key } = JSON.parse(keyData) as EncryptedKey;
    const saltArray = new Uint8Array(
      atob(salt)
        .split('')
        .map((c) => c.charCodeAt(0)),
    );
    const keyArray = new Uint8Array(
      atob(key)
        .split('')
        .map((c) => c.charCodeAt(0)),
    );

    const derivedKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltArray,
          iterations: 100000,
          hash: 'SHA-256',
        },
        await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']),
        256,
      ),
      'AES-GCM',
      false,
      ['decrypt'],
    );

    const iv = keyArray.slice(0, 12);
    const encryptedKey = keyArray.slice(12);

    const decryptedKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, encryptedKey);

    masterKey = await crypto.subtle.importKey('raw', decryptedKey, 'AES-GCM', false, ['encrypt', 'decrypt']);

    return true;
  } catch (error) {
    console.error('Failed to load master key:', error);
    return false;
  }
};

const generateMasterKey = async (password: string): Promise<boolean> => {
  try {
    // Generate a random master key
    const newMasterKey = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive a key from the password
    const derivedKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']),
        256,
      ),
      'AES-GCM',
      false,
      ['encrypt'],
    );

    // Encrypt the master key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, newMasterKey);

    // Store the master key for use
    masterKey = await crypto.subtle.importKey('raw', newMasterKey, 'AES-GCM', false, ['encrypt', 'decrypt']);

    // Combine IV and encrypted key
    const combined = new Uint8Array(iv.length + encryptedKey.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedKey), iv.length);

    // Store the encrypted master key
    localStorage.setItem(
      'masterKeyData',
      JSON.stringify({
        salt: btoa(String.fromCharCode(...salt)),
        key: btoa(String.fromCharCode(...combined)),
      }),
    );

    return true;
  } catch (error) {
    console.error('Failed to generate master key:', error);
    return false;
  }
};

const initializeMasterKey = async (password: string): Promise<boolean> => {
  if (hasMasterKeyStored()) {
    return await loadMasterKey(password);
  } else {
    return await generateMasterKey(password);
  }
};

const promptForEncryption = async (): Promise<boolean> => {
  const password = prompt('Enter password for encryption key');

  if (!password) {
    toast.error('Password is required');
    return false;
  }

  try {
    const success = await initializeMasterKey(password);

    if (!success) {
      toast.error('Invalid password or failed to setup encryption');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Encryption setup failed:', error);
    toast.error('Failed to setup encryption');

    return false;
  }
};

const ensureEncryption = async (): Promise<boolean> => {
  if (!isEncryptionInitialized()) {
    return await promptForEncryption();
  }

  return true;
};

const lookupSavedPassword = async (url: string): Promise<GitAuth | null> => {
  if (!isEncryptionInitialized()) {
    return null;
  }

  const domain = getDomain(url);
  const encryptedCreds = Cookies.get(domain);

  if (!encryptedCreds) {
    // Fallback to legacy format
    const provider = domain.split('.')[0];
    const encryptedUsername = Cookies.get(`${provider}Username`);
    const encryptedToken = Cookies.get(`${provider}Token`);

    if (encryptedUsername && encryptedToken) {
      try {
        const username = await decrypt(encryptedUsername);
        const token = await decrypt(encryptedToken);

        if (username && token) {
          return { username, password: token };
        }
      } catch (error) {
        console.error('Failed to decrypt legacy credentials:', error);
      }
    }

    return null;
  }

  try {
    const decryptedCreds = await decrypt(encryptedCreds);
    const { username, password } = JSON.parse(decryptedCreds);

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch (error) {
    console.error('Failed to parse or decrypt Git Cookie:', error);
    return null;
  }
};

const getDomain = (url: string): string => {
  return url.replace(/^https?:\/\//, '');
};

const saveGitAuth = async (url: string, auth: GitAuth) => {
  if (!isEncryptionInitialized()) {
    throw new Error('Encryption not initialized');
  }

  const domain = getDomain(url);
  const provider = domain.split('.')[0];

  if (!auth.username || !auth.password) {
    toast.error('Username and token are required');
    return;
  }

  try {
    // Encrypt the full credentials object
    const encryptedCreds = await encrypt(
      JSON.stringify({
        username: auth.username,
        password: auth.password,
      }),
    );
    Cookies.set(domain, encryptedCreds);

    // Also save in legacy format
    const encryptedUsername = await encrypt(auth.username);
    const encryptedToken = await encrypt(auth.password);
    Cookies.set(`${provider}Username`, encryptedUsername);
    Cookies.set(`${provider}Token`, encryptedToken);
  } catch (error) {
    console.error('Failed to encrypt credentials:', error);
    toast.error('Failed to save credentials securely');
  }
};

export {
  lookupSavedPassword,
  saveGitAuth,
  initializeMasterKey,
  isEncryptionInitialized,
  promptForEncryption,
  ensureEncryption,
  hasMasterKeyStored,
};
