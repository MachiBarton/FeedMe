/**
 * IndexedDB Mock for testing
 * Provides a mock implementation of IndexedDB for unit tests
 */

export interface MockDBRecord {
  id?: number
  [key: string]: unknown
}

class MockObjectStore {
  private data: Map<string | number, MockDBRecord> = new Map()
  private keyPath: string
  private autoIncrement: boolean
  private currentId = 1

  constructor(keyPath = 'id', autoIncrement = true) {
    this.keyPath = keyPath
    this.autoIncrement = autoIncrement
  }

  add(record: MockDBRecord): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      const key = record[this.keyPath] as string | number
      if (key !== undefined && this.data.has(key)) {
        request.error = new Error('ConstraintError: Key already exists')
        request.readyState = 'done'
        request.onerror?.call(request, new Event('error'))
        return
      }

      const newRecord = { ...record }
      if (this.autoIncrement && newRecord[this.keyPath] === undefined) {
        ;(newRecord as Record<string, unknown>)[this.keyPath] = this.currentId++
      }

      const finalKey = newRecord[this.keyPath] as string | number
      this.data.set(finalKey, newRecord)
      request.result = finalKey
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  put(record: MockDBRecord): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      const key = record[this.keyPath] as string | number
      if (key === undefined && this.autoIncrement) {
        ;(record as Record<string, unknown>)[this.keyPath] = this.currentId++
      }
      const finalKey = record[this.keyPath] as string | number
      this.data.set(finalKey, { ...record })
      request.result = finalKey
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  get(key: string | number): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      request.result = this.data.get(key)
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  delete(key: string | number): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      this.data.delete(key)
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  getAll(): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      request.result = Array.from(this.data.values())
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  clear(): IDBRequest {
    const request = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
      onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
      source: null,
      transaction: null,
      readyState: 'pending' as IDBRequestReadyState,
    } as IDBRequest

    setTimeout(() => {
      this.data.clear()
      request.readyState = 'done'
      request.onsuccess?.call(request, new Event('success'))
    }, 0)

    return request
  }

  // Helper method for tests
  getData(): MockDBRecord[] {
    return Array.from(this.data.values())
  }

  // Helper method for tests
  setData(data: MockDBRecord[]): void {
    this.data.clear()
    for (const record of data) {
      const key = record[this.keyPath] as string | number
      if (key !== undefined) {
        this.data.set(key, record)
      }
    }
  }
}

class MockTransaction {
  private stores: Map<string, MockObjectStore> = new Map()

  constructor(storeNames: string[]) {
    for (const name of storeNames) {
      this.stores.set(name, new MockObjectStore())
    }
  }

  objectStore(name: string): MockObjectStore {
    const store = this.stores.get(name)
    if (!store) {
      throw new Error(`Object store '${name}' not found`)
    }
    return store
  }
}

class MockDatabase {
  private stores: Map<string, MockObjectStore> = new Map()
  public version = 1
  public name = 'test-db'

  createObjectStore(name: string, options?: { keyPath?: string; autoIncrement?: boolean }): MockObjectStore {
    const store = new MockObjectStore(options?.keyPath, options?.autoIncrement)
    this.stores.set(name, store)
    return store
  }

  transaction(storeNames: string | string[]): MockTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames]
    return new MockTransaction(names)
  }
}

export function createMockIndexedDB(): IDBFactory {
  const databases = new Map<string, MockDatabase>()

  return {
    open: (name: string, version?: number): IDBOpenDBRequest => {
      const request = {
        result: null as MockDatabase | null,
        error: null as Error | null,
        onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
        onerror: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
        onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null,
        source: null,
        transaction: null,
        readyState: 'pending' as IDBRequestReadyState,
      } as IDBOpenDBRequest

      setTimeout(() => {
        let db = databases.get(name)
        const oldVersion = db?.version || 0

        if (!db) {
          db = new MockDatabase()
          db.name = name
          databases.set(name, db)
        }

        if (version && version > oldVersion) {
          db.version = version
          const event = new Event('upgradeneeded') as IDBVersionChangeEvent
          Object.defineProperty(event, 'oldVersion', { value: oldVersion })
          Object.defineProperty(event, 'newVersion', { value: version })
          request.onupgradeneeded?.call(request, event)
        }

        request.result = db
        request.readyState = 'done'
        request.onsuccess?.call(request, new Event('success'))
      }, 0)

      return request
    },

    deleteDatabase: (name: string): IDBOpenDBRequest => {
      const request = {
        result: null as unknown,
        error: null as Error | null,
        onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
        onerror: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
        source: null,
        transaction: null,
        readyState: 'pending' as IDBRequestReadyState,
      } as IDBOpenDBRequest

      setTimeout(() => {
        databases.delete(name)
        request.readyState = 'done'
        request.onsuccess?.call(request, new Event('success'))
      }, 0)

      return request
    },

    cmp: (first: unknown, second: unknown): number => {
      if (first === second) return 0
      if (first === null) return -1
      if (second === null) return 1
      if (first === undefined) return -1
      if (second === undefined) return 1
      if (first instanceof Date && second instanceof Date) {
        return first.getTime() - second.getTime()
      }
      if (typeof first === 'number' && typeof second === 'number') {
        return first - second
      }
      return String(first) < String(second) ? -1 : 1
    },

    databases: async (): Promise<IDBDatabaseInfo[]> => {
      return Array.from(databases.entries()).map(([name, db]) => ({
        name,
        version: db.version,
      }))
    },
  } as IDBFactory
}

export { MockObjectStore, MockTransaction, MockDatabase }
