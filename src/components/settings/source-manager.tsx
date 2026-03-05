import { useState, useCallback } from "react"
import {
  GripVertical,
  Trash2,
  Edit2,
  Rss,
  AlertCircle,
  CheckCircle2,
  X,
  FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import type { UserSource } from "@/lib/types"

interface SourceManagerProps {
  sources: UserSource[]
  onUpdateSources: (sources: UserSource[]) => void
  onDeleteSource: (id: string) => void
  onEditSource: (source: UserSource) => void
}

interface EditingSource {
  id: string
  title: string
  url: string
  category: string
}

export function SourceManager({
  sources,
  onUpdateSources,
  onDeleteSource,
  onEditSource,
}: SourceManagerProps) {
  const [editingSource, setEditingSource] = useState<EditingSource | null>(null)
  const [deletingSource, setDeletingSource] = useState<UserSource | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleReorder = useCallback(
    (newOrder: UserSource[]) => {
      const updated = newOrder.map((source, index) => ({
        ...source,
        sortOrder: index,
      }))
      onUpdateSources(updated)
    },
    [onUpdateSources]
  )

  const {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop<UserSource>({
    items: sources,
    onReorder: handleReorder,
    getItemId: (source) => source.id,
  })

  const handleEditClick = (source: UserSource) => {
    setEditingSource({
      id: source.id,
      title: source.title,
      url: source.url,
      category: source.category || "",
    })
    setEditErrors({})
  }

  const handleSaveEdit = () => {
    if (!editingSource) return

    const errors: Record<string, string> = {}

    if (!editingSource.title.trim()) {
      errors.title = "标题不能为空"
    }

    if (!editingSource.url.trim()) {
      errors.url = "URL 不能为空"
    } else {
      try {
        new URL(editingSource.url)
      } catch {
        errors.url = "无效的 URL 格式"
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    const source = sources.find((s) => s.id === editingSource.id)
    if (source) {
      onEditSource({
        ...source,
        title: editingSource.title.trim(),
        url: editingSource.url.trim(),
        category: editingSource.category.trim() || "未分类",
        updatedAt: Date.now(),
      })
    }

    setEditingSource(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingSource) {
      onDeleteSource(deletingSource.id)
      setDeletingSource(null)
    }
  }

  // 按分类分组显示
  const groupedSources = sources.reduce(
    (acc, source) => {
      const category = source.category || "未分类"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(source)
      return acc
    },
    {} as Record<string, UserSource[]>
  )

  const categories = Object.keys(groupedSources).sort()

  return (
    <div className="space-y-6">
      {/* 源列表 */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>{category}</span>
              <span className="text-xs">({groupedSources[category].length})</span>
            </div>
            <div className="space-y-1">
              {groupedSources[category]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((source) => (
                  <div
                    key={source.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, source)}
                    onDragOver={(e) => handleDragOver(e, source)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, source)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border bg-card group transition-all",
                      draggedItem === source.id && "opacity-50",
                      dragOverItem === source.id && "border-primary bg-primary/5"
                    )}
                  >
                    {/* 拖拽手柄 */}
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* 状态图标 */}
                    <div className="flex-shrink-0">
                      {source.fetchError ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : source.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Rss className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* 源信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{source.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {source.url}
                      </div>
                      {source.fetchError && (
                        <div className="text-xs text-destructive mt-1">
                          {source.fetchError}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(source)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingSource(source)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <Alert>
            <AlertDescription className="text-center py-8">
              暂无订阅源，点击上方按钮添加或导入
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog
        open={!!editingSource}
        onOpenChange={(open) => !open && setEditingSource(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑订阅源</DialogTitle>
            <DialogDescription>修改订阅源的信息</DialogDescription>
          </DialogHeader>
          {editingSource && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">标题</Label>
                <Input
                  id="edit-title"
                  value={editingSource.title}
                  onChange={(e) =>
                    setEditingSource({ ...editingSource, title: e.target.value })
                  }
                  placeholder="订阅源标题"
                />
                {editErrors.title && (
                  <p className="text-sm text-destructive">{editErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={editingSource.url}
                  onChange={(e) =>
                    setEditingSource({ ...editingSource, url: e.target.value })
                  }
                  placeholder="https://example.com/feed.xml"
                />
                {editErrors.url && (
                  <p className="text-sm text-destructive">{editErrors.url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">分类</Label>
                <Input
                  id="edit-category"
                  value={editingSource.category}
                  onChange={(e) =>
                    setEditingSource({ ...editingSource, category: e.target.value })
                  }
                  placeholder="分类名称"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSource(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={!!deletingSource}
        onOpenChange={(open) => !open && setDeletingSource(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除订阅源 "{deletingSource?.title}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSource(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
