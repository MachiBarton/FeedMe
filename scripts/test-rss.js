// Test script to debug RSS parsing
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

async function test() {
  const feed = await parser.parseURL('https://imjuya.github.io/juya-ai-daily/rss.xml');
  console.log('First item fields:');
  console.log('- title:', feed.items[0].title);
  console.log('- content:', feed.items[0].content?.substring(0, 100));
  console.log('- contentEncoded:', feed.items[0].contentEncoded?.substring(0, 200));
}

test();
