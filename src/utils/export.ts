import { ScanResult } from '../types';
import { Logger } from './logger';

/**
 * Export utility for generating reports in various formats
 */
export class ExportUtil {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ExportUtil');
  }

  /**
   * Exports scan result as JSON
   */
  exportAsJson(result: ScanResult): string {
    try {
      this.logger.info('Exporting scan result as JSON');
      return JSON.stringify(result, null, 2);
    } catch (error) {
      this.logger.error('Failed to export as JSON:', error);
      throw error;
    }
  }

  /**
   * Exports scan result as HTML report
   */
  exportAsHtml(result: ScanResult): string {
    try {
      this.logger.info('Exporting scan result as HTML');
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A11y Checker Report - ${result.url}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-value {
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0;
    }
    .summary-label {
      color: #666;
      font-size: 14px;
    }
    .critical { color: #dc2626; }
    .serious { color: #ea580c; }
    .moderate { color: #ca8a04; }
    .minor { color: #65a30d; }
    .issue {
      background: white;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .issue.critical { border-left-color: #dc2626; }
    .issue.serious { border-left-color: #ea580c; }
    .issue.moderate { border-left-color: #ca8a04; }
    .issue.minor { border-left-color: #65a30d; }
    .issue-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .issue-title {
      font-weight: bold;
      font-size: 18px;
    }
    .issue-impact {
      text-transform: uppercase;
      font-weight: bold;
      font-size: 12px;
    }
    .issue-description {
      margin: 10px 0;
      color: #444;
    }
    .issue-element {
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      margin: 10px 0;
    }
    .wcag-criteria {
      margin-top: 10px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>A11y Checker Report</h1>
    <p><strong>URL:</strong> ${result.url}</p>
    <p><strong>Date:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
    <p><strong>WCAG Level:</strong> ${result.wcagLevel}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total Issues</div>
      <div class="summary-value">${result.summary.total}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Critical</div>
      <div class="summary-value critical">${result.summary.critical}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Serious</div>
      <div class="summary-value serious">${result.summary.serious}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Moderate</div>
      <div class="summary-value moderate">${result.summary.moderate}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Minor</div>
      <div class="summary-value minor">${result.summary.minor}</div>
    </div>
  </div>

  <div class="issues">
    ${result.issues.map(issue => `
      <div class="issue ${issue.impact}">
        <div class="issue-header">
          <div class="issue-title">${issue.description}</div>
          <div class="issue-impact ${issue.impact}">${issue.impact}</div>
        </div>
        <div class="issue-description">${issue.help}</div>
        <div class="issue-element">
          Element: &lt;${issue.element.tagName}${issue.element.id ? ` id="${issue.element.id}"` : ''}${issue.element.className ? ` class="${issue.element.className}"` : ''}&gt;
        </div>
        <div class="wcag-criteria">
          WCAG Criteria: ${issue.wcagCriteria.join(', ')}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
      
      return html;
    } catch (error) {
      this.logger.error('Failed to export as HTML:', error);
      throw error;
    }
  }

  /**
   * Exports scan result as CSV
   */
  exportAsCsv(result: ScanResult): string {
    try {
      this.logger.info('Exporting scan result as CSV');
      
      const headers = ['ID', 'Element', 'Description', 'Impact', 'WCAG Criteria', 'Help'];
      const rows = result.issues.map(issue => [
        issue.id,
        `<${issue.element.tagName}${issue.element.id ? ` id="${issue.element.id}"` : ''}>`,
        issue.description,
        issue.impact,
        issue.wcagCriteria.join('; '),
        issue.help
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      this.logger.error('Failed to export as CSV:', error);
      throw error;
    }
  }
}