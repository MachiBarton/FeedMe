import { useState, useCallback } from "react"
import { Plus, Loader2, Link2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { isValidFeedUrl, validateUrlAccessibility } from "@/lib/opml"
import type { UserSource } from "@/lib/types"

interface AddSourceDialogProps {
  onAddSource: (source: Omit<UserSource, "id" | "createdAt" | "updatedAt">) => Promise<void>
  existingUrls: string[]
}

export function AddSourceDialog({ onAddSource, existingUrls }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const resetForm = useCallback(() => {
    setUrl("")
    setTitle("")
    setCategory("")
    setErrors({})
  }, [])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    },
    [resetForm]
  )

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // URL 验证
    if (!url.trim()) {
      newErrors.url = "请输入 RSS 源 URL"
    } else if (!isValidFeedUrl(url.trim())) {
      newErrors.url = "请输入有效的 URL（以 http:// 或 https:// 开头）"
    } else if (existingUrls.includes(url.trim())) {
      newErrors.url = "该 URL 已存在"
    }

    // 标题验证
    if (!title.trim()) {
      newErrors.title = "请输入订阅源标题"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return false
    }

    // 验证 URL 可访问性
    setIsValidating(true)
    try {
      const validation = await validateUrlAccessibility(url.trim(), 8000)
      if (!validation.accessible) {
        setErrors({
          url: `无法访问该 URL: ${validation.error || "未知错误"}`,
        })
        return false
      }
    } catch (error) {
      console.warn("URL validation failed:", error)
      // 继续添加，不阻止用户
    } finally {
      setIsValidating(false)
    }

    return true
  }

  const handleSubmit = async () => {
    const isValid = await validateForm()
    if (!isValid) return

    try {
      await onAddSource({
        url: url.trim(),
        title: title.trim(),
        category: category.trim() || "未分类",
        description: "",
        icon: undefined,
        isActive: true,
        sortOrder: existingUrls.length,
      })

      toast({
        title: "添加成功",
        description: `已添加订阅源 "${title.trim()}"`,
      })

      setOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加源
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加 RSS 订阅源</DialogTitle>
          <DialogDescription>
            输入 RSS 源的 URL 和相关信息来添加新的订阅源
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">
              RSS URL
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                placeholder="https://example.com/feed.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={cn("pl-10", errors.url && "border-destructive")}
                disabled={isValidating}
              />
            </div>
            {errors.url && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.url}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              标题
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="title"
              placeholder="订阅源名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(errors.title && "border-destructive")}
              disabled={isValidating}
            />
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Input
              id="category"
              placeholder="分类名称（可选）"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isValidating}
            />
            <p className="text-xs text-muted-foreground">
              留空将使用默认分类"未分类"
            </p>
          </div>

          {isValidating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>正在验证 URL 可访问性...</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isValidating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isValidating}>
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                验证中...
              </>
            ) : (
              "添加"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function for className merging
import { cn } from "@/lib/utils"
