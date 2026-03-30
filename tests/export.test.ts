import { ExportUtil } from '../src/utils/export';
import { ScanResult } from '../src/types';

describe('ExportUtil', () => {
  let exporter: ExportUtil;

  const sampleResult: ScanResult = {
    id: 'scan_test',
    url: 'https://example.com',
    timestamp: 1700000000000,
    summary: { total: 2, critical: 1, serious: 0, moderate: 1, minor: 0 },
    issues: [
      {
        id: 'issue-1',
        element: {
          tagName: 'img',
          id: 'logo',
          attributes: {},
          position: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        description: 'Image missing alt text',
        help: 'Add alt attribute',
        helpUrl: 'https://w3.org',
        impact: 'critical',
        tags: ['wcag2a'],
        wcagLevels: ['A'],
        wcagCriteria: ['1.1.1'],
        fixSuggestions: ['Add alt="description"'],
      },
      {
        id: 'issue-2',
        element: {
          tagName: 'h3',
          className: 'title',
          attributes: {},
          position: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        description: 'Heading level skip',
        help: 'Fix heading hierarchy',
        helpUrl: 'https://w3.org',
        impact: 'moderate',
        tags: ['wcag2a'],
        wcagLevels: ['A'],
        wcagCriteria: ['1.3.1'],
        fixSuggestions: [],
      },
    ],
    wcagLevel: 'AA',
  };

  beforeEach(() => {
    exporter = new ExportUtil();
  });

  describe('exportAsJson', () => {
    it('returns valid JSON', () => {
      const json = exporter.exportAsJson(sampleResult);
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('scan_test');
      expect(parsed.issues).toHaveLength(2);
    });

    it('is pretty-printed', () => {
      const json = exporter.exportAsJson(sampleResult);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('exportAsHtml', () => {
    it('returns valid HTML document', () => {
      const html = exporter.exportAsHtml(sampleResult);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('includes URL and summary', () => {
      const html = exporter.exportAsHtml(sampleResult);
      expect(html).toContain('https://example.com');
      expect(html).toContain('2'); // total issues
      expect(html).toContain('1'); // critical
    });

    it('includes issue descriptions', () => {
      const html = exporter.exportAsHtml(sampleResult);
      expect(html).toContain('Image missing alt text');
      expect(html).toContain('Heading level skip');
    });

    it('escapes HTML in issue content', () => {
      const resultWithHtml: ScanResult = {
        ...sampleResult,
        issues: [
          {
            ...sampleResult.issues[0]!,
            description: 'Test <script>alert("xss")</script>',
          },
        ],
        summary: { ...sampleResult.summary, total: 1 },
      };
      const html = exporter.exportAsHtml(resultWithHtml);
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('exportAsCsv', () => {
    it('includes header row', () => {
      const csv = exporter.exportAsCsv(sampleResult);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('ID');
      expect(lines[0]).toContain('Description');
      expect(lines[0]).toContain('Impact');
    });

    it('includes all issues', () => {
      const csv = exporter.exportAsCsv(sampleResult);
      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // header + 2 issues
    });

    it('escapes double quotes in CSV', () => {
      const resultWithQuotes: ScanResult = {
        ...sampleResult,
        issues: [
          {
            ...sampleResult.issues[0]!,
            description: 'Test "quoted" text',
          },
        ],
        summary: { ...sampleResult.summary, total: 1 },
      };
      const csv = exporter.exportAsCsv(resultWithQuotes);
      expect(csv).toContain('""quoted""');
    });
  });
});
