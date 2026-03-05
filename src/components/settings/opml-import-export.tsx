import { useState, useRef, useCallback } from "react"
import {
  Upload,
  Download,
  FileUp,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  parseOPML,
  readOPMLFile,
  generateOPML,
  downloadOPMLFile,
  convertOPMLToUserSource,
  validateOPMLSources,
} from "@/lib/opml"
import type { UserSource, OPMLSource } from "@/lib/types"
import { cn } from "@/lib/utils"

interface OPMLImportExportProps {
  sources: UserSource[]
  onImportSources: (sources: Omit<UserSource, "id" | "createdAt" | "updatedAt">[]) => Promise<void>
  existingUrls: string[]
}

interface ImportResult {
  totalCount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
  importedCount: number
  invalidUrls: string[]
  categories: string[]
}

export function OPMLImportExport({
  sources,
  onImportSources,
  existingUrls,
}: OPMLImportExportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [parsedSources, setParsedSources] = useState<OPMLSource[]>([])
  const [validationProgress, setValidationProgress] = useState({ validated: 0, total: 0 })
  const [showInvalidUrls, setShowInvalidUrls] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processOPMLFile = async (file: File) => {
    setIsProcessing(true)
    setImportResult(null)
    setParsedSources([])

    try {
      const content = await readOPMLFile(file)
      const result = parseOPML(content)

      if (result.sources.length === 0) {
        toast({
          title: "导入失败",
          description: "未找到有效的 RSS 订阅源",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // 检查重复
      const duplicates = result.sources.filter((s) =>
        existingUrls.includes(s.xmlUrl)
      )
      const newSources = result.sources.filter(
        (s) => !existingUrls.includes(s.xmlUrl)
      )

      setParsedSources(newSources)
      setImportResult({
        totalCount: result.totalCount,
        validCount: result.validCount,
        invalidCount: result.invalidUrls.length,
        duplicateCount: duplicates.length,
        importedCount: 0,
        invalidUrls: result.invalidUrls,
        categories: result.categories,
      })
    } catch (error) {
      toast({
        title: "解析失败",
        description: error instanceof Error ? error.message : "文件解析错误",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const opmlFile = files.find(
        (f) => f.name.endsWith(".opml") || f.name.endsWith(".xml")
      )

      if (opmlFile) {
        await processOPMLFile(opmlFile)
      } else {
        toast({
          title: "文件类型错误",
          description: "请上传 .opml 或 .xml 文件",
          variant: "destructive",
        })
      }
    },
    [existingUrls, toast]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        await processOPMLFile(file)
      }
    },
    [existingUrls, toast]
  )

  const handleImport = async () => {
    if (parsedSources.length === 0) return

    setIsProcessing(true)
    setValidationProgress({ validated: 0, total: parsedSources.length })

    try {
      // 验证源的可访问性
      const { validSources } = await validateOPMLSources(
        parsedSources,
        (validated, total) => {
          setValidationProgress({ validated, total })
        }
      )

      // 转换为 UserSource 并导入
      const userSources = validSources.map((source, index) =>
        convertOPMLToUserSource(source, sources.length + index)
      )

      await onImportSources(userSources)

      setImportResult((prev) =>
        prev
          ? {
              ...prev,
              importedCount: userSources.length,
            }
          : null
      )

      toast({
        title: "导入成功",
        description: `成功导入 ${userSources.length} 个订阅源`,
      })

      // 延迟关闭对话框
      setTimeout(() => {
        setIsImportDialogOpen(false)
        setImportResult(null)
        setParsedSources([])
      }, 1500)
    } catch (error) {
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    if (sources.length === 0) {
      toast({
        title: "导出失败",
        description: "没有可导出的订阅源",
        variant: "destructive",
      })
      return
    }

    const result = generateOPML(sources)
    downloadOPMLFile(result.xmlContent)

    toast({
      title: "导出成功",
      description: `已导出 ${result.exportCount} 个订阅源`,
    })

    setIsExportDialogOpen(false)
  }

  const resetImport = () => {
    setImportResult(null)
    setParsedSources([])
    setValidationProgress({ validated: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex gap-2">
      {/* 导入按钮 */}
      <Button
        variant="outline"
        onClick={() => {
          setIsImportDialogOpen(true)
          resetImport()
        }}
      >
        <Upload className="mr-2 h-4 w-4" />
        导入 OPML
      </Button>

      {/* 导出按钮 */}
      <Button
        variant="outline"
        onClick={() => setIsExportDialogOpen(true)}
        disabled={sources.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        导出 OPML
      </Button>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>导入 OPML 文件</DialogTitle>
            <DialogDescription>
              从 OPML 文件导入 RSS 订阅源，支持拖拽上传
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".opml,.xml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                拖拽 OPML 文件到此处，或
              </p>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  "选择文件"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 解析结果摘要 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.validCount}
                  </div>
                  <div className="text-xs text-muted-foreground">有效源</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.validCount - importResult.duplicateCount}
                  </div>
                  <div className="text-xs text-muted-foreground">新源</div>
                </div>
                {importResult.duplicateCount > 0 && (
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importResult.duplicateCount}
                    </div>
                    <div className="text-xs text-muted-foreground">重复</div>
                  </div>
                )}
                {importResult.invalidCount > 0 && (
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {importResult.invalidCount}
                    </div>
                    <div className="text-xs text-muted-foreground">无效</div>
                  </div>
                )}
              </div>

              {/* 分类信息 */}
              {importResult.categories.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">发现分类：</span>
                  <span className="font-medium">
                    {importResult.categories.join("、")}
                  </span>
                </div>
              )}

              {/* 无效 URL 列表 */}
              {importResult.invalidUrls.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInvalidUrls(!showInvalidUrls)}
                    className="text-destructive"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    查看 {importResult.invalidUrls.length} 个无效 URL
                    {showInvalidUrls ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                  {showInvalidUrls && (
                    <div className="bg-destructive/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <ul className="text-xs space-y-1">
                        {importResult.invalidUrls.map((url, index) => (
                          <li key={index} className="text-destructive">
                            {url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 验证进度 */}
              {isProcessing && validationProgress.total > 0 && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    正在验证源的可访问性 ({validationProgress.validated} /{" "}
                    {validationProgress.total})
                  </AlertDescription>
                </Alert>
              )}

              {/* 导入成功提示 */}
              {importResult.importedCount > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    成功导入 {importResult.importedCount} 个订阅源
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            {!importResult ? (
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                取消
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={resetImport} disabled={isProcessing}>
                  重新选择
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    isProcessing ||
                    parsedSources.length === 0 ||
                    importResult.importedCount > 0
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    `导入 ${parsedSources.length} 个源`
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出对话框 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出 OPML 文件</DialogTitle>
            <DialogDescription>
              将所有订阅源导出为 OPML 格式文件
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <FileDown className="h-10 w-10 text-muted-foreground" />
              <div>
                <div className="font-medium">feedme-subscriptions.opml</div>
                <div className="text-sm text-muted-foreground">
                  包含 {sources.length} 个订阅源
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              下载文件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
