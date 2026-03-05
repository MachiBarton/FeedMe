/**
 * RSS 源展示配置
 * 定义每个 RSS 源的特定展示方式
 *
 * @typedef {object} SourceDisplayConfig
 * @property {string} name - 信息源名称（与 rss-config.js 中的 name 匹配）
 * @property {'html' | 'iframe'} contentMode - 内容展示模式
 *   - 'html': 直接渲染 HTML（默认）
 *   - 'iframe': 使用 iframe 嵌入原文链接
 * @property {object} [iframeOptions] - iframe 配置（仅当 contentMode 为 'iframe' 时有效）
 * @property {string} [iframeOptions.height] - iframe 高度，默认 '80vh'
 * @property {string} [iframeOptions.sandbox] - iframe sandbox 属性，默认 'allow-scripts allow-same-origin allow-popups'
 */

/**
 * 默认配置
 * @type {SourceDisplayConfig[]}
 */
export const sourceDisplayConfigs = [
  // juya-ai-daily 使用 iframe 嵌入原文
  {
    name: 'juya-ai-daily',
    contentMode: 'iframe',
    iframeOptions: {
      height: '85vh',
      sandbox: 'allow-scripts allow-same-origin allow-popups',
    },
  },
  // OSINT Daily Newsletter 使用默认的 HTML 渲染，不需要特殊配置
  // 可以根据需要添加更多源的配置
  // {
  //   name: 'Some Other Source',
  //   contentMode: 'html',
  // },
];

/**
 * 获取源的展示配置
 * @param {string} sourceName - 信息源名称
 * @returns {SourceDisplayConfig | undefined}
 */
export function getSourceDisplayConfig(sourceName) {
  return sourceDisplayConfigs.find((config) => config.name === sourceName);
}

/**
 * 获取源的内容展示模式
 * @param {string} sourceName - 信息源名称
 * @returns {'html' | 'iframe'} 内容展示模式，默认为 'html'
 */
export function getSourceContentMode(sourceName) {
  const config = getSourceDisplayConfig(sourceName);
  return config?.contentMode || 'html';
}

/**
 * 判断源是否使用 iframe 展示
 * @param {string} sourceName - 信息源名称
 * @returns {boolean}
 */
export function isSourceUsingIframe(sourceName) {
  return getSourceContentMode(sourceName) === 'iframe';
}

export default sourceDisplayConfigs;
