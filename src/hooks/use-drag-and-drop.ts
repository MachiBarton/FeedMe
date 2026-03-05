import { useState, useCallback } from "react"

interface DragAndDropState {
  draggedItem: string | null
  dragOverItem: string | null
}

interface UseDragAndDropOptions<T> {
  items: T[]
  onReorder: (items: T[]) => void
  getItemId: (item: T) => string
}

export function useDragAndDrop<T>({
  items,
  onReorder,
  getItemId,
}: UseDragAndDropOptions<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: T) => {
      const itemId = getItemId(item)
      setDraggedItem(itemId)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", itemId)
    },
    [getItemId]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, item: T) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      const itemId = getItemId(item)
      if (itemId !== draggedItem) {
        setDragOverItem(itemId)
      }
    },
    [draggedItem, getItemId]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetItem: T) => {
      e.preventDefault()
      const targetId = getItemId(targetItem)

      if (!draggedItem || draggedItem === targetId) {
        setDraggedItem(null)
        setDragOverItem(null)
        return
      }

      const draggedIndex = items.findIndex(
        (item) => getItemId(item) === draggedItem
      )
      const targetIndex = items.findIndex(
        (item) => getItemId(item) === targetId
      )

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null)
        setDragOverItem(null)
        return
      }

      const newItems = [...items]
      const [removed] = newItems.splice(draggedIndex, 1)
      newItems.splice(targetIndex, 0, removed)

      onReorder(newItems)
      setDraggedItem(null)
      setDragOverItem(null)
    },
    [draggedItem, items, onReorder, getItemId]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
  }, [])

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
