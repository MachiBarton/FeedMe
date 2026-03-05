/**
 * 生成文章唯一 ID
 * 使用 sourceUrl + link 的组合
 */
export function generateArticleId(sourceUrl: string, link: string): string {
  return `${btoa(sourceUrl).replace(/[/+=]/g, '_')}:${btoa(link).replace(/[/+=]/g, '_')}`;
}

export default generateArticleId;
