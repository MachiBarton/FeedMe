import type { OPMLSource, OPMLParseResult, OPMLExportResult, UserSource } from "@/lib/types"

/**
 * 验证 URL 是否为有效的 RSS/Atom Feed URL
 */
export function isValidFeedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    // 基本协议检查
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * 验证 URL 是否可访问（通过 fetch 检查）
 */
export async function validateUrlAccessibility(url: string, timeout: number = 10000): Promise<{
  accessible: boolean
  error?: string
  contentType?: string
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors", // 允许跨域请求
    })

    clearTimeout(timeoutId)

    return {
      accessible: response.ok || response.status === 0, // status 0 可能是 no-cors 模式下的成功响应
      contentType: response.headers.get("content-type") || undefined,
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}

/**
 * 从 outline 元素提取 OPML 源信息
 */
function extractOPMLSource(outline: Element, category?: string): OPMLSource | null {
  const xmlUrl = outline.getAttribute("xmlUrl")
  const title = outline.getAttribute("title") || outline.getAttribute("text")
  const htmlUrl = outline.getAttribute("htmlUrl") || undefined

  // 必须有 xmlUrl 和 title
  if (!xmlUrl || !title) {
    return null
  }

  // 验证 URL 格式
  if (!isValidFeedUrl(xmlUrl)) {
    return null
  }

  return {
    title: title.trim(),
    xmlUrl: xmlUrl.trim(),
    htmlUrl: htmlUrl?.trim(),
    category,
  }
}

/**
 * 递归解析 outline 元素
 */
function parseOutlineElements(
  outlines: HTMLCollectionOf<Element> | Element[],
  parentCategory?: string,
): { sources: OPMLSource[]; invalidUrls: string[]; categories: Set<string> } {
  const sources: OPMLSource[] = []
  const invalidUrls: string[] = []
  const categories = new Set<string>()

  for (const outline of Array.from(outlines)) {
    const xmlUrl = outline.getAttribute("xmlUrl")
    const title = outline.getAttribute("title") || outline.getAttribute("text")

    // 如果有 xmlUrl，这是一个订阅源
    if (xmlUrl) {
      const source = extractOPMLSource(outline, parentCategory)
      if (source) {
        sources.push(source)
        if (source.category) {
          categories.add(source.category)
        }
      } else {
        invalidUrls.push(xmlUrl)
      }
    } else if (title) {
      // 这是一个分类/文件夹，递归解析其子元素
      const categoryName = title.trim()
      categories.add(categoryName)

      const childOutlines = outline.getElementsByTagName("outline")
      if (childOutlines.length > 0) {
        const childResult = parseOutlineElements(childOutlines, categoryName)
        sources.push(...childResult.sources)
        invalidUrls.push(...childResult.invalidUrls)
        childResult.categories.forEach((cat) => categories.add(cat))
      }
    }
  }

  return { sources, invalidUrls, categories }
}

/**
 * 解析 OPML XML 内容
 */
export function parseOPML(xmlContent: string): OPMLParseResult {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, "application/xml")

    // 检查解析错误
    const parserError = doc.querySelector("parsererror")
    if (parserError) {
      throw new Error("XML 解析错误: " + parserError.textContent)
    }

    // 获取所有 outline 元素
    const outlines = doc.getElementsByTagName("outline")

    if (outlines.length === 0) {
      return {
        sources: [],
        totalCount: 0,
        validCount: 0,
        invalidUrls: [],
        categories: [],
      }
    }

    // 解析所有 outline 元素
    const { sources, invalidUrls, categories } = parseOutlineElements(outlines)

    return {
      sources,
      totalCount: sources.length + invalidUrls.length,
      validCount: sources.length,
      invalidUrls,
      categories: Array.from(categories),
    }
  } catch (error) {
    throw new Error(
      `OPML 解析失败: ${error instanceof Error ? error.message : "未知错误"}`,
    )
  }
}

/**
 * 从文件读取 OPML 内容
 */
export function readOPMLFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!file.name.endsWith(".opml") && !file.name.endsWith(".xml")) {
      reject(new Error("请上传 .opml 或 .xml 文件"))
      return
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("文件大小超过 5MB 限制"))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === "string") {
        resolve(content)
      } else {
        reject(new Error("无法读取文件内容"))
      }
    }

    reader.onerror = () => {
      reject(new Error("文件读取失败"))
    }

    reader.readAsText(file)
  })
}

/**
 * 将 OPMLSource 转换为 UserSource
 */
export function convertOPMLToUserSource(
  opmlSource: OPMLSource,
  sortOrder: number = 0,
): Omit<UserSource, "id" | "createdAt" | "updatedAt"> {
  return {
    url: opmlSource.xmlUrl,
    title: opmlSource.title,
    description: "",
    category: opmlSource.category || "未分类",
    icon: undefined,
    isActive: true,
    sortOrder,
  }
}

/**
 * 生成 OPML XML 内容
 */
export function generateOPML(sources: UserSource[]): OPMLExportResult {
  const now = new Date().toUTCString()

  // 按分类分组
  const groupedSources = sources.reduce(
    (acc, source) => {
      const category = source.category || "未分类"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(source)
      return acc
    },
    {} as Record<string, UserSource[]>,
  )

  // 生成 XML
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>FeedMe RSS Subscriptions</title>
    <dateCreated>${now}</dateCreated>
    <dateModified>${now}</dateModified>
  </head>
  <body>
`

  // 生成分类和源
  Object.entries(groupedSources).forEach(([category, categorySources]) => {
    if (categorySources.length === 1) {
      // 单个源，不需要分类包裹
      const source = categorySources[0]
      xmlContent += `    <outline type="rss" text="${escapeXml(source.title)}" title="${escapeXml(source.title)}" xmlUrl="${escapeXml(source.url)}" htmlUrl="${escapeXml(source.url)}" />
`
    } else {
      // 多个源，使用分类包裹
      xmlContent += `    <outline text="${escapeXml(category)}" title="${escapeXml(category)}">
`
      categorySources.forEach((source) => {
        xmlContent += `      <outline type="rss" text="${escapeXml(source.title)}" title="${escapeXml(source.title)}" xmlUrl="${escapeXml(source.url)}" htmlUrl="${escapeXml(source.url)}" />
`
      })
      xmlContent += `    </outline>
`
    }
  })

  xmlContent += `  </body>
</opml>`

  return {
    xmlContent,
    exportCount: sources.length,
  }
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * 下载 OPML 文件
 */
export function downloadOPMLFile(xmlContent: string, filename: string = "feedme-subscriptions.opml"): void {
  const blob = new Blob([xmlContent], { type: "application/xml" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 验证并过滤 OPML 源列表
 */
export async function validateOPMLSources(
  sources: OPMLSource[],
  onProgress?: (validated: number, total: number) => void,
): Promise<{
  validSources: OPMLSource[]
  invalidSources: OPMLSource[]
}> {
  const validSources: OPMLSource[] = []
  const invalidSources: OPMLSource[] = []

  // 批量验证，每次最多 5 个并发
  const batchSize = 5
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (source) => {
        const validation = await validateUrlAccessibility(source.xmlUrl, 5000)
        return { source, validation }
      }),
    )

    results.forEach(({ source, validation }) => {
      if (validation.accessible) {
        validSources.push(source)
      } else {
        invalidSources.push(source)
      }
    })

    onProgress?.(Math.min(i + batchSize, sources.length), sources.length)
  }

  return { validSources, invalidSources }
}
