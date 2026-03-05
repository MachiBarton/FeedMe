// 命令行脚本，用于更新所有RSS源数据
// 供GitHub Actions直接调用

// 加载.env文件中的环境变量
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import { OpenAI } from 'openai';

// 从配置文件中导入RSS源配置
import { config } from '../src/config/rss-config.js';

// 获取 __dirname 的 ES 模块等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查环境变量是否已通过系统设置（如GitHub Actions Secrets）
const hasEnvVars = process.env.LLM_API_KEY && process.env.LLM_API_BASE && process.env.LLM_NAME;

if (!hasEnvVars) {
  // 尝试从.env文件加载
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
    dotenvContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.replace(/^"|"$/g, '');
        }
        process.env[key] = value;
      }
    });
    console.log('已从.env加载环境变量');
  } else {
    // 尝试加载.env.local作为后备
    const localEnvPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(localEnvPath)) {
      const dotenvContent = fs.readFileSync(localEnvPath, 'utf8');
      dotenvContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.replace(/^"|"$/g, '');
          }
          process.env[key] = value;
        }
      });
      console.log('已从.env.local加载环境变量');
    } else {
      console.log('未找到.env文件，将使用已设置的环境变量（如有）');
    }
  }
} else {
  console.log('环境变量已通过系统设置加载');
}

// RSS解析器配置
const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
      ["summary", "summary"], // 添加对 Atom feed 中 summary 标签的支持
    ],
  },
});

// 从环境变量中获取API配置
const OPENAI_API_KEY = process.env.LLM_API_KEY;
const OPENAI_API_BASE = process.env.LLM_API_BASE;
const OPENAI_MODEL_NAME = process.env.LLM_NAME;

// 调试输出（隐藏敏感信息）
console.log('环境变量检查:');
console.log('  LLM_API_KEY:', OPENAI_API_KEY ? '已设置 (' + OPENAI_API_KEY.slice(0, 10) + '...)' : '未设置');
console.log('  LLM_API_BASE:', OPENAI_API_BASE || '未设置');
console.log('  LLM_NAME:', OPENAI_MODEL_NAME || '未设置');

// 检查是否配置了LLM（可选）
const isLLMConfigured = OPENAI_API_KEY && OPENAI_API_BASE && OPENAI_MODEL_NAME;

if (!isLLMConfigured) {
  console.warn('⚠️  LLM API未配置，将跳过AI摘要生成（只拉取RSS数据）');
}

// 创建OpenAI客户端（仅在配置完整时）
let openai = null;
if (isLLMConfigured) {
  openai = new OpenAI({
    baseURL: OPENAI_API_BASE,
    apiKey: OPENAI_API_KEY,
  });
}

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), config.dataPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// 获取源的文件路径
function getSourceFilePath(sourceUrl) {
  const dataDir = ensureDataDir();
  // 使用URL的Base64编码作为文件名，避免非法字符
  const sourceHash = Buffer.from(sourceUrl).toString('base64').replace(/[/+=]/g, '_');
  return path.join(dataDir, `${sourceHash}.json`);
}

// 保存源数据到文件
async function saveFeedData(sourceUrl, data) {
  const filePath = getSourceFilePath(sourceUrl);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`保存数据 ${sourceUrl} 到 ${filePath}`);
  } catch (error) {
    console.error(`保存数据 ${sourceUrl} 时出错:`, error);
    throw new Error(`保存源数据失败: ${error.message}`);
  }
}

// 从文件加载源数据
function loadFeedData(sourceUrl) {
  const filePath = getSourceFilePath(sourceUrl);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`加载数据 ${sourceUrl} 时出错:`, error);
    return null;
  }
}

// 生成摘要函数
async function generateSummary(title, content) {
  // 如果未配置LLM，直接返回null（表示无摘要）
  if (!isLLMConfigured || !openai) {
    return null;
  }

  try {
    // 确保 content 不为空
    const contentToClean = content || "";
    // 清理内容 - 移除HTML标签
    const cleanContent = contentToClean.replace(/<[^>]*>?/gm, "");

    // 准备提示词
    const prompt = `
你是一位资深情报分析师，请将以下OSINT情报简报提炼为简洁的战略要点。

要求：
1. 提炼3-5条核心情报，用阿拉伯数字编号（1. 2. 3.）
2. 每条必须是完整的中文短句，主谓宾齐全，语义通顺
3. 每条15-25字，准确陈述事件、行动或影响
4. 使用标准中文，严禁混入外文字母或字符
5. 国家、地名、组织名必须翻译成标准中文（如Ecuador→厄瓜多尔，Pentagon→五角大楼）
6. 聚焦地缘政治冲突、网络安全事件、军事动态、技术突破
7. 去除所有元信息（如"报告包含X篇文章"、"部分来源暂不可用"等）
8. 保持客观陈述，不添加原文未提及的内容

文章标题：${title}

文章内容：
${cleanContent.slice(0, 5000)}

输出格式示例：
1. 美国宣布对伊朗实施新一轮经济制裁
2. 北约加强东欧边境军事部署应对局势
3. 关键基础设施遭受勒索软件攻击瘫痪
4. 新型人工智能武器系统进入实战测试
`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0].message.content?.trim() || "无法生成摘要。";
  } catch (error) {
    console.error("生成摘要时出错:", error);
    return "无法生成摘要。AI 模型暂时不可用。";
  }
}

// 获取RSS源
async function fetchRssFeed(url) {
  try {
    // 直接解析RSS URL
    const feed = await parser.parseURL(url);

    // 处理items，确保所有对象都是可序列化的纯对象
    const serializedItems = feed.items.map(item => {
      // 创建新的纯对象
      // 优先使用 contentEncoded（HTML内容），如果为空则尝试 content、summary（Atom feed），再尝试 contentSnippet
      const contentHtml = item.contentEncoded || item.content || item.summary || item.contentSnippet || "";
      const serializedItem = {
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || "",
        isoDate: item.isoDate || "",
        content: contentHtml,
        contentSnippet: item.contentSnippet || "",
        creator: item.creator || "",
      };

      // 如果存在enclosure，以纯对象形式添加
      if (item.enclosure) {
        serializedItem.enclosure = {
          url: item.enclosure.url || "",
          type: item.enclosure.type || "",
        };
      }

      return serializedItem;
    });

    return {
      title: feed.title || "",
      description: feed.description || "",
      link: feed.link || "",
      items: serializedItems,
    };
  } catch (error) {
    console.error("获取RSS源时出错:", error);
    throw new Error(`获取RSS源失败: ${error.message}`);
  }
}

// 合并新旧数据，并找出需要生成摘要的新条目
function mergeFeedItems(oldItems = [], newItems = [], maxItems = config.maxItemsPerFeed) {
  // 创建一个Map来存储所有条目，使用链接作为键
  const itemsMap = new Map();

  // 添加旧条目到Map
  for (const item of oldItems) {
    if (item.link) {
      itemsMap.set(item.link, item);
    }
  }

  // 识别需要生成摘要的新条目
  const newItemsForSummary = [];

  // 添加新条目到Map，并标记需要生成摘要的条目
  for (const item of newItems) {
    if (item.link) {
      const existingItem = itemsMap.get(item.link);

      if (!existingItem) {
        // 这是一个新条目，需要生成摘要
        newItemsForSummary.push(item);
      }

      // 无论如何都更新Map，使用新条目（但保留旧摘要如果有的话）
      // 注意：item.summary 可能来自 Atom feed 的 <summary> 标签，这是原始内容，而不是我们生成的摘要
      // 为了避免混淆，将 Atom feed 的 summary 移动到 content 字段
      let generatedSummary = existingItem?.summary;

      // 获取 HTML 内容，优先使用 contentEncoded，然后是 content、summary、contentSnippet
      const contentHtml = item.content || item.contentEncoded || existingItem?.content || "";

      const serializedItem = {
        ...item,
        content: contentHtml,
        summary: generatedSummary || item.summary, // 保留已生成的摘要
      };

      itemsMap.set(item.link, serializedItem);
    }
  }

  // 将Map转换回数组，保持原始RSS源的顺序
  // 使用newItems的顺序作为基准
  const mergedItems = newItems
    .filter(item => item.link && itemsMap.has(item.link))
    .map(item => item.link ? itemsMap.get(item.link) : item)
    .slice(0, maxItems); // 只保留指定数量的条目

  return { mergedItems, newItemsForSummary };
}

// 更新单个源
async function updateFeed(sourceUrl) {
  console.log(`更新源: ${sourceUrl}`);

  try {
    // 加载老数据
    const existingData = loadFeedData(sourceUrl);
    const existingItemsMap = new Map();
    if (existingData?.items) {
      for (const item of existingData.items) {
        if (item.link) {
          existingItemsMap.set(item.link, item);
        }
      }
    }

    // 获取新数据
    const newFeed = await fetchRssFeed(sourceUrl);

    // 限制条目数量
    const limitedItems = newFeed.items.slice(0, config.maxItemsPerFeed);

    // 对比新老数据：保留相同条目的摘要，为新条目生成摘要
    let itemsWithSummaries = [];
    let newItemsCount = 0;
    let reusedItemsCount = 0;

    for (const item of limitedItems) {
      const existingItem = item.link ? existingItemsMap.get(item.link) : null;

      if (existingItem && existingItem.summary) {
        // 老数据中有相同条目且有摘要，直接复用
        itemsWithSummaries.push({
          ...item,
          summary: existingItem.summary,
        });
        reusedItemsCount++;
      } else {
        // 新条目或老数据中没有摘要，需要生成
        itemsWithSummaries.push(item);
        newItemsCount++;
      }
    }

    // 只有在配置了LLM时才为新条目生成摘要
    if (isLLMConfigured && newItemsCount > 0) {
      console.log(`复用 ${reusedItemsCount} 条已有摘要，为 ${newItemsCount} 条新条目生成摘要...`);
      itemsWithSummaries = await Promise.all(
        itemsWithSummaries.map(async (item) => {
          // 如果已经有摘要，跳过
          if (item.summary) {
            return item;
          }
          try {
            // 确保使用任何可用的内容源 - content, item 本身的 summary 字段, 或 contentSnippet
            const contentForSummary = item.content || item.contentSnippet || "";
            const summary = await generateSummary(item.title, contentForSummary);
            return summary ? { ...item, summary } : item;
          } catch (err) {
            console.error(`为条目 ${item.title} 生成摘要时出错:`, err);
            return item;
          }
        }),
      );
    } else {
      console.log(`复用 ${reusedItemsCount} 条已有摘要，${newItemsCount} 条新条目（跳过AI摘要生成）`);
    }

    // 创建新的数据对象
    const updatedData = {
      sourceUrl,
      title: newFeed.title,
      description: newFeed.description,
      link: newFeed.link,
      items: itemsWithSummaries,
      lastUpdated: new Date().toISOString(),
    };

    // 保存到文件（直接覆盖）
    await saveFeedData(sourceUrl, updatedData);

    return updatedData;
  } catch (error) {
    console.error(`更新源 ${sourceUrl} 时出错:`, error);
    throw new Error(`更新源失败: ${error.message}`);
  }
}

// 更新所有源
async function updateAllFeeds() {
  console.log("开始更新所有RSS源");

  const results = {};

  for (const source of config.sources) {
    try {
      await updateFeed(source.url);
      results[source.url] = true;
    } catch (error) {
      console.error(`更新 ${source.url} 失败:`, error);
      results[source.url] = false;
    }
  }

  console.log("所有RSS源更新完成");
  return results;
}

// 主函数
async function main() {
  try {
    await updateAllFeeds();
    console.log("RSS数据更新成功");
    process.exit(0);
  } catch (error) {
    console.error("RSS数据更新失败:", error);
    process.exit(1);
  }
}

// 执行主函数
main();
