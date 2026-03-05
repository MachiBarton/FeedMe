"use client"

import { useRouter, useSearchParams } from "@/hooks/use-navigation"
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { getSourcesByCategory, findSourceByUrl, type RssSource } from "@/config/rss-config"

const ALL_SOURCES_VALUE = "__all__"

export function SourceSwitcher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSource = searchParams.get("source")

  const [open, setOpen] = useState(false)

  const handleSelect = (source: RssSource) => {
    const params = new URLSearchParams(searchParams)
    params.set("source", source.url)
    // 使用当前 hash 路由路径
    const hash = window.location.hash
    const queryIndex = hash.indexOf('?')
    const currentHashPath = queryIndex === -1 ? hash : hash.slice(0, queryIndex)
    router.push(`${currentHashPath}?${params.toString()}`)
    setOpen(false)
  }

  const handleSelectAll = () => {
    const params = new URLSearchParams(searchParams)
    params.set("source", ALL_SOURCES_VALUE)
    const hash = window.location.hash
    const queryIndex = hash.indexOf('?')
    const currentHashPath = queryIndex === -1 ? hash : hash.slice(0, queryIndex)
    router.push(`${currentHashPath}?${params.toString()}`)
    setOpen(false)
  }

  // 按类别分组源
  const groupedSources = getSourcesByCategory()

  // 查找当前源名称（无 source 参数时默认显示全部）
  const isAllSelected = !currentSource || currentSource === ALL_SOURCES_VALUE
  const currentSourceName = isAllSelected
    ? "全部文章"
    : currentSource
      ? findSourceByUrl(currentSource)?.name || "选择信息源"
      : "选择信息源"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full md:w-[300px] justify-between">
          {currentSourceName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full md:w-[300px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="搜索信息源..." autoFocus={false} />
          <CommandList>
            <CommandEmpty>未找到匹配的信息源</CommandEmpty>
            <CommandGroup>
              <CommandItem value={ALL_SOURCES_VALUE} onSelect={handleSelectAll}>
                <LayoutGrid className={cn("mr-2 h-4 w-4", isAllSelected ? "opacity-100" : "opacity-0")} />
                <span className="flex-1">全部文章</span>
                {isAllSelected && <Check className="h-4 w-4" />}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {Object.entries(groupedSources).map(([category, categorySources]) => {
              const sources = categorySources as RssSource[];
              return (
                <CommandGroup key={category} heading={category}>
                  {sources.map((source: RssSource) => (
                    <CommandItem key={source.url} value={source.name} onSelect={() => handleSelect(source)}>
                      <Check className={cn("mr-2 h-4 w-4", currentSource === source.url ? "opacity-100" : "opacity-0")} />
                      {source.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
