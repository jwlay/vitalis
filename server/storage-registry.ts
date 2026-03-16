/**
 * A mutable registry so the storage backend can be swapped at startup.
 * All server code should import getStorage() instead of storage directly when needing DB ops.
 */
import { MemStorage, type IStorage } from "./storage";

let _storage: IStorage = new MemStorage();

export function getStorage(): IStorage {
  return _storage;
}

export function setStorage(s: IStorage): void {
  _storage = s;
}
