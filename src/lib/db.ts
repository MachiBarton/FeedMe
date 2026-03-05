import { openDB, DBSchema, IDBPDatabase, deleteDB } from 'idb'
import type {
  UserSource,
  UserPreferences,
  StoreName,
} from './types'

// Database configuration
const DB_NAME = 'FeedMeDB'
const DB_VERSION = 2 // 升级版本以移除旧的store

// LocalStorage fallback keys
const LS_PREFIX = 'feedme_fallback_'

// ============================================
// Database Schema Definition
// ============================================
interface FeedMeDBSchema extends DBSchema {
  user_sources: {
    key: string
    value: UserSource
    indexes: {
      'by-url': string
      'by-category': string
      'by-sort-order': number
    }
  }
  user_preferences: {
    key: string
    value: UserPreferences
  }
}

type FeedMeDB = IDBPDatabase<FeedMeDBSchema>

// ============================================
// Database Connection Management
// ============================================
let dbInstance: FeedMeDB | null = null
let isIndexedDBAvailable = true

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<FeedMeDB> {
  if (dbInstance) {
    return dbInstance
  }

  try {
    dbInstance = await openDB<FeedMeDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // 删除旧版本中的store
        if (oldVersion < 2) {
          const storesToDelete = ['article_states', 'reading_progress', 'reading_history', 'search_cache']
          for (const storeName of storesToDelete) {
            if (db.objectStoreNames.contains(storeName)) {
              db.deleteObjectStore(storeName)
            }
          }
        }

        // Create stores and indexes

        // user_sources store
        if (!db.objectStoreNames.contains('user_sources')) {
          const sourceStore = db.createObjectStore('user_sources', {
            keyPath: 'id',
          })
          sourceStore.createIndex('by-url', 'url', { unique: true })
          sourceStore.createIndex('by-category', 'category', { unique: false })
          sourceStore.createIndex('by-sort-order', 'sortOrder', { unique: false })
        }

        // user_preferences store
        if (!db.objectStoreNames.contains('user_preferences')) {
          db.createObjectStore('user_preferences', {
            keyPath: 'id',
          })
        }
      },
    })

    isIndexedDBAvailable = true
    return dbInstance
  } catch (error) {
    console.warn('IndexedDB initialization failed, falling back to localStorage:', error)
    isIndexedDBAvailable = false
    throw error
  }
}

/**
 * Get database instance (initializes if needed)
 */
export async function getDB(): Promise<FeedMeDB> {
  if (!dbInstance) {
    return initDB()
  }
  return dbInstance
}

/**
 * Check if IndexedDB is available
 */
export function checkIndexedDBAvailability(): boolean {
  return (
    typeof window !== 'undefined' &&
    'indexedDB' in window &&
    isIndexedDBAvailable
  )
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * Delete entire database (use with caution)
 */
export async function deleteDatabase(): Promise<void> {
  await closeDB()
  await deleteDB(DB_NAME)
  clearLocalStorageFallback()
}

// ============================================
// LocalStorage Fallback
// ============================================

function getLSKey(storeName: StoreName): string {
  return `${LS_PREFIX}${storeName}`
}

function setLocalStorageItem<T>(storeName: StoreName, key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    const storeKey = getLSKey(storeName)
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}')
    data[key] = { value, timestamp: Date.now() }
    localStorage.setItem(storeKey, JSON.stringify(data))
  } catch (error) {
    console.error('LocalStorage set error:', error)
  }
}

function getLocalStorageItem<T>(storeName: StoreName, key: string): T | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const storeKey = getLSKey(storeName)
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}')
    return data[key]?.value
  } catch (error) {
    console.error('LocalStorage get error:', error)
    return undefined
  }
}

function getAllLocalStorageItems<T>(storeName: StoreName): T[] {
  if (typeof window === 'undefined') return []
  try {
    const storeKey = getLSKey(storeName)
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}')
    return Object.values(data).map((item: { value: T }) => item.value)
  } catch (error) {
    console.error('LocalStorage getAll error:', error)
    return []
  }
}

function removeLocalStorageItem(storeName: StoreName, key: string): void {
  if (typeof window === 'undefined') return
  try {
    const storeKey = getLSKey(storeName)
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}')
    delete data[key]
    localStorage.setItem(storeKey, JSON.stringify(data))
  } catch (error) {
    console.error('LocalStorage remove error:', error)
  }
}

function clearLocalStorageFallback(): void {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(LS_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('LocalStorage clear error:', error)
  }
}

// ============================================
// Generic CRUD Operations
// ============================================

/**
 * Add or update an item in a store
 */
export async function putItem<T extends { id: string }>(
  storeName: StoreName,
  item: T
): Promise<T> {
  if (!checkIndexedDBAvailability()) {
    setLocalStorageItem(storeName, item.id, item)
    return item
  }

  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  await store.put(item)
  await tx.done
  return item
}

/**
 * Get an item by ID
 */
export async function getItem<T>(
  storeName: StoreName,
  id: string
): Promise<T | undefined> {
  if (!checkIndexedDBAvailability()) {
    return getLocalStorageItem<T>(storeName, id)
  }

  const db = await getDB()
  return db.get(storeName as any, id) as Promise<T | undefined>
}

/**
 * Delete an item by ID
 */
export async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  if (!checkIndexedDBAvailability()) {
    removeLocalStorageItem(storeName, id)
    return
  }

  const db = await getDB()
  await db.delete(storeName as any, id)
}

/**
 * Get all items from a store
 */
export async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  if (!checkIndexedDBAvailability()) {
    return getAllLocalStorageItems<T>(storeName)
  }

  const db = await getDB()
  return db.getAll(storeName as any) as Promise<T[]>
}

/**
 * Get items by index
 */
export async function getItemsByIndex<T>(
  storeName: StoreName,
  indexName: string,
  query: IDBKeyRange | IDBValidKey
): Promise<T[]> {
  if (!checkIndexedDBAvailability()) {
    // Fallback: filter in memory
    const all = await getAllLocalStorageItems<T>(storeName)
    return all
  }

  const db = await getDB()
  const tx = db.transaction(storeName, 'readonly')
  const store = tx.objectStore(storeName)
  const index = store.index(indexName)
  return index.getAll(query) as Promise<T[]>
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  if (!checkIndexedDBAvailability()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getLSKey(storeName))
    }
    return
  }

  const db = await getDB()
  await db.clear(storeName as any)
}

// ============================================
// Batch Operations
// ============================================

/**
 * Batch put multiple items
 */
export async function batchPutItems<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  if (!checkIndexedDBAvailability()) {
    items.forEach((item) => setLocalStorageItem(storeName, item.id, item))
    return
  }

  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)

  for (const item of items) {
    await store.put(item)
  }

  await tx.done
}

/**
 * Batch delete multiple items
 */
export async function batchDeleteItems(
  storeName: StoreName,
  ids: string[]
): Promise<void> {
  if (!checkIndexedDBAvailability()) {
    ids.forEach((id) => removeLocalStorageItem(storeName, id))
    return
  }

  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)

  for (const id of ids) {
    await store.delete(id)
  }

  await tx.done
}

// ============================================
// Store-Specific Helper Functions
// ============================================

// User Sources
export async function getSourcesByCategory(category: string): Promise<UserSource[]> {
  return getItemsByIndex('user_sources', 'by-category', category)
}

export async function getSourcesBySortOrder(): Promise<UserSource[]> {
  const db = await getDB()
  const tx = db.transaction('user_sources', 'readonly')
  const store = tx.objectStore('user_sources')
  const index = store.index('by-sort-order')
  return index.getAll() as Promise<UserSource[]>
}

// ============================================
// Export/Import Functions
// ============================================

/**
 * Export all data for backup
 */
export async function exportAllData(): Promise<{
  sources: UserSource[]
  preferences: UserPreferences | undefined
}> {
  const [sources, preferences] =
    await Promise.all([
      getAllItems<UserSource>('user_sources'),
      getItem<UserPreferences>('user_preferences', 'default'),
    ])

  return {
    sources,
    preferences,
  }
}

/**
 * Import data from backup
 */
export async function importAllData(data: {
  sources?: UserSource[]
  preferences?: UserPreferences
}): Promise<void> {
  const promises: Promise<void>[] = []

  if (data.sources?.length) {
    promises.push(batchPutItems('user_sources', data.sources))
  }
  if (data.preferences) {
    promises.push(putItem('user_preferences', data.preferences))
  }

  await Promise.all(promises)
}
