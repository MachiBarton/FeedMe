"use client";

import { usePreferences } from "@/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  List,
  Newspaper,
  Grid3X3,
  Type,
  LayoutTemplate,
  Check,
} from "lucide-react";
import type { UserPreferences } from "@/lib/types";

const layoutOptions: {
  value: UserPreferences["articleLayout"];
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "card",
    label: "卡片列表",
    icon: <LayoutTemplate className="h-4 w-4" />,
    description: "垂直卡片布局，图文并茂",
  },
  {
    value: "compact",
    label: "紧凑列表",
    icon: <List className="h-4 w-4" />,
    description: "只显示标题和日期，适合快速浏览",
  },
  {
    value: "grid",
    label: "网格布局",
    icon: <Grid3X3 className="h-4 w-4" />,
    description: "等宽网格排列，图片更大",
  },
  {
    value: "masonry",
    label: "瀑布流",
    icon: <LayoutGrid className="h-4 w-4" />,
    description: "Pinterest 风格，适合图片多的源",
  },
  {
    value: "magazine",
    label: "杂志布局",
    icon: <Newspaper className="h-4 w-4" />,
    description: "首条大图，其余列表形式",
  },
  {
    value: "text",
    label: "纯文本流",
    icon: <Type className="h-4 w-4" />,
    description: "极简风格，去掉图片和卡片边框",
  },
];

export function LayoutSwitcher() {
  const { preferences, updatePreferences } = usePreferences();
  const currentLayout = preferences.articleLayout;

  const currentOption = layoutOptions.find((opt) => opt.value === currentLayout);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 px-3"
          title="切换布局"
        >
          {currentOption?.icon || <LayoutTemplate className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentOption?.label || "布局"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {layoutOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => updatePreferences({ articleLayout: option.value })}
            className={cn(
              "flex items-start gap-3 py-3 cursor-pointer",
              currentLayout === option.value && "bg-accent"
            )}
          >
            <div className="mt-0.5 text-muted-foreground">{option.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                {currentLayout === option.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LayoutSwitcher;
