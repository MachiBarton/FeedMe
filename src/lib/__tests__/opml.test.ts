import { describe, it, expect } from 'vitest'

// OPML types and functions to be tested
interface OPMLSource {
  title: string
  xmlUrl: string
  htmlUrl?: string
  category?: string
}

interface OPMLFolder {
  title: string
  sources: OPMLSource[]
}

interface ParsedOPML {
  title: string
  sources: OPMLSource[]
  folders: OPMLFolder[]
}

// Mock OPML functions (to be implemented)
function parseOPML(opmlContent: string): ParsedOPML {
  const parser = new DOMParser()
  const doc = parser.parseFromString(opmlContent, 'text/xml')

  const title = doc.querySelector('head > title')?.textContent || 'Untitled'
  const sources: OPMLSource[] = []
  const folders: OPMLFolder[] = []

  const outlines = doc.querySelectorAll('body > outline')

  for (const outline of outlines) {
    const xmlUrl = outline.getAttribute('xmlUrl')

    if (xmlUrl) {
      // This is a source
      sources.push({
        title: outline.getAttribute('title') || outline.getAttribute('text') || 'Untitled',
        xmlUrl,
        htmlUrl: outline.getAttribute('htmlUrl') || undefined,
      })
    } else {
      // This is a folder
      const folderTitle = outline.getAttribute('title') || outline.getAttribute('text') || 'Untitled'
      const folderSources: OPMLSource[] = []

      for (const child of outline.querySelectorAll('outline')) {
        const childXmlUrl = child.getAttribute('xmlUrl')
        if (childXmlUrl) {
          folderSources.push({
            title: child.getAttribute('title') || child.getAttribute('text') || 'Untitled',
            xmlUrl: childXmlUrl,
            htmlUrl: child.getAttribute('htmlUrl') || undefined,
          })
        }
      }

      folders.push({
        title: folderTitle,
        sources: folderSources,
      })
    }
  }

  return { title, sources, folders }
}

function generateOPML(title: string, sources: OPMLSource[]): string {
  const date = new Date().toUTCString()

  const sourcesXml = sources.map(source =>
    `    <outline type="rss" text="${escapeXml(source.title)}" title="${escapeXml(source.title)}" xmlUrl="${escapeXml(source.xmlUrl)}"${source.htmlUrl ? ` htmlUrl="${escapeXml(source.htmlUrl)}"` : ''}/>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${date}</dateCreated>
  </head>
  <body>
${sourcesXml}
  </body>
</opml>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

describe('OPML', () => {
  describe('parseOPML', () => {
    it('should parse flat OPML with sources', () => {
      const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>My Feeds</title></head>
  <body>
    <outline type="rss" text="Feed 1" title="Feed 1" xmlUrl="https://example1.com/rss"/>
    <outline type="rss" text="Feed 2" title="Feed 2" xmlUrl="https://example2.com/rss"/>
  </body>
</opml>`

      const result = parseOPML(opml)

      expect(result.title).toBe('My Feeds')
      expect(result.sources).toHaveLength(2)
      expect(result.sources[0].xmlUrl).toBe('https://example1.com/rss')
      expect(result.sources[1].title).toBe('Feed 2')
    })

    it('should parse OPML with folders', () => {
      const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Organized Feeds</title></head>
  <body>
    <outline text="Tech">
      <outline type="rss" text="Tech Feed" xmlUrl="https://tech.com/rss"/>
    </outline>
    <outline text="News">
      <outline type="rss" text="News Feed" xmlUrl="https://news.com/rss"/>
    </outline>
  </body>
</opml>`

      const result = parseOPML(opml)

      expect(result.folders).toHaveLength(2)
      expect(result.folders[0].title).toBe('Tech')
      expect(result.folders[0].sources).toHaveLength(1)
      expect(result.folders[1].title).toBe('News')
    })

    it('should handle OPML without title', () => {
      const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head></head>
  <body>
    <outline type="rss" text="Feed" xmlUrl="https://example.com/rss"/>
  </body>
</opml>`

      const result = parseOPML(opml)

      expect(result.title).toBe('Untitled')
    })

    it('should handle empty OPML', () => {
      const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Empty</title></head>
  <body></body>
</opml>`

      const result = parseOPML(opml)

      expect(result.sources).toHaveLength(0)
      expect(result.folders).toHaveLength(0)
    })

    it('should parse OPML with htmlUrl', () => {
      const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Feeds</title></head>
  <body>
    <outline type="rss" text="Feed" xmlUrl="https://example.com/rss" htmlUrl="https://example.com"/>
  </body>
</opml>`

      const result = parseOPML(opml)

      expect(result.sources[0].htmlUrl).toBe('https://example.com')
    })
  })

  describe('generateOPML', () => {
    it('should generate valid OPML', () => {
      const sources: OPMLSource[] = [
        { title: 'Feed 1', xmlUrl: 'https://example1.com/rss' },
        { title: 'Feed 2', xmlUrl: 'https://example2.com/rss', htmlUrl: 'https://example2.com' },
      ]

      const opml = generateOPML('My Feeds', sources)

      expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(opml).toContain('<opml version="2.0">')
      expect(opml).toContain('<title>My Feeds</title>')
      expect(opml).toContain('xmlUrl="https://example1.com/rss"')
      expect(opml).toContain('htmlUrl="https://example2.com"')
    })

    it('should escape special characters in titles', () => {
      const sources: OPMLSource[] = [
        { title: 'Feed <Special> & "Test"', xmlUrl: 'https://example.com/rss' },
      ]

      const opml = generateOPML('My <Feeds>', sources)

      expect(opml).toContain('My &lt;Feeds&gt;')
      expect(opml).toContain('Feed &lt;Special&gt; &amp; &quot;Test&quot;')
    })

    it('should generate empty OPML for empty sources', () => {
      const opml = generateOPML('Empty', [])

      expect(opml).toContain('<title>Empty</title>')
      expect(opml).toContain('<body>')
      expect(opml).toContain('</body>')
    })
  })

  describe('round-trip', () => {
    it('should preserve data through parse and generate', () => {
      const originalSources: OPMLSource[] = [
        { title: 'Feed 1', xmlUrl: 'https://example1.com/rss', htmlUrl: 'https://example1.com' },
        { title: 'Feed 2', xmlUrl: 'https://example2.com/rss' },
      ]

      const opml = generateOPML('Test', originalSources)
      const parsed = parseOPML(opml)

      expect(parsed.title).toBe('Test')
      expect(parsed.sources).toHaveLength(2)
      expect(parsed.sources[0].title).toBe('Feed 1')
      expect(parsed.sources[0].xmlUrl).toBe('https://example1.com/rss')
      expect(parsed.sources[0].htmlUrl).toBe('https://example1.com')
    })
  })
})
