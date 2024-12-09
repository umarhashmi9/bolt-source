import React, { createContext, useContext, useEffect, useState } from 'react';
import { type DBRecord,type DBOperations, type IndexedDBContextType } from './types';
import { openDatabase } from '../persistence';

const IndexedDBContext = createContext<IndexedDBContextType | null>(null);

interface IndexedDBProviderProps {
  children: React.ReactNode;
  databaseName?: string;
  version?: number;
}

export function IndexedDBProvider({
  children,
  databaseName = 'YourDatabaseName',
  version = 1,
}: IndexedDBProviderProps) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase(databaseName,version).then((newDb)=>{
        if(!newDb){
          setError('Error opening IndexedDB');
          return;
        }
        setDb(newDb);
        console.log(newDb);
    });
    return () => {
      if (db) {
        db.close();
      }
    };
  }, [databaseName, version]);

  return <IndexedDBContext.Provider value={{ db, error }}>{children}</IndexedDBContext.Provider>;
}

// Custom hook to use the IndexedDB context
export function useIndexedDB(): IndexedDBContextType {
  const context = useContext(IndexedDBContext);
  if (context === null) {
    throw new Error('useIndexedDB must be used within an IndexedDBProvider');
  }
  return context;
}