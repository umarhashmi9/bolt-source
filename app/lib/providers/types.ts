export interface DBRecord {
    id?: number;
    [key: string]: any;
}

export interface DBOperations {
    addItem: <T extends DBRecord>(storeName: string, item: T) => Promise<number>;
    getItem: <T extends DBRecord>(storeName: string, id: number) => Promise<T>;
    getAllItems: <T extends DBRecord>(storeName: string) => Promise<T[]>;
    error: string | null;
}

export interface IndexedDBContextType {
    db: IDBDatabase | null;
    error: string | null;
}