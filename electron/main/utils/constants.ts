/// <reference types="vite/client" />
import path from 'node:path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

export const __dirname = fileURLToPath(import.meta.url);
export const isDev = !(global.process.env.NODE_ENV === 'production' || app.isPackaged);
export const DEFAULT_PORT = 5173;

export const rendererClientPath = isDev
  ? path.join(__dirname, '../../client')
  : path.join(app.getAppPath(), 'build/client');
