export interface IDBService {
  connect(): Promise<void>;

  disconnect(): Promise<void>;
}
