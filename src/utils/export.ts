import { ScanResult } from '../types';
import { Logger } from './logger';

export class ExportUtil {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ExportUtil');
  }

  exportAsJson(result: ScanResult): string {
    this.logger.info('Exporting as JSON');
    return JSON.stringify(result, null, 2);
  }

  exportAsHtml(result: ScanResult): string {
    this.logger.info('Exporting as HTML');

    const issueRows = result.issues
      .map(
        (issue) => `
      <div class="issue ${issue.impact}">
        <div class="issue-header">
          <span class="issue-title">${this.esc(issue.description)}</span>
          <span class="badge ${issue.impact}">${issue.impact.toUpperCase()}</span>
        </div>
        <p class="help">${this.esc(issue.help)}</p>
        <code class="element">&lt;${this.esc(issue.element.tagName)}${
          issue.element.id ? ` id="${this.esc(issue.element.id)}"` : ''
        }${issue.element.className ? ` class="${this.esc(issue.element.className)}"` : ''}&gt;</code>
        <p class="wcag">WCAG: ${issue.wcagCriteria.join(', ')}</p>
        ${
          issue.fixSuggestions.length
            ? `<ul class="fixes">${issue.fixSuggestions.map((s: string) => `<li>${this.esc(s)}</li>`).join('')}</ul>`
            : ''
        }
      </div>`,
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>A11y Checker Report — ${this.esc(result.url)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
max-width:960px;margin:0 auto;padding:24px;background:#f5f5f5;color:#333}
h1{font-size:24px;margin-bottom:8px}
.meta{color:#666;font-size:14px;margin-bottom:20px}
.summary{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.summary-card{background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.summary-card .value{font-size:28px;font-weight:700;margin:6px 0}
.summary-card .label{font-size:12px;color:#666}
.critical .value{color:#dc2626} .serious .value{color:#ea580c}
.moderate .value{color:#ca8a04} .minor .value{color:#65a30d}
.issue{background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.issue.critical{border-left-color:#dc2626} .issue.serious{border-left-color:#ea580c}
.issue.moderate{border-left-color:#ca8a04} .issue.minor{border-left-color:#65a30d}
.issue-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.issue-title{font-weight:600;font-size:15px}
.badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase}
.badge.critical{background:#fecaca;color:#991b1b} .badge.serious{background:#fed7aa;color:#9a3412}
.badge.moderate{background:#fef08a;color:#854d0e} .badge.minor{background:#bbf7d0;color:#166534}
.help{color:#555;margin-bottom:6px;font-size:14px}
code.element{display:block;background:#f9f9f9;padding:6px 8px;border-radius:4px;font-size:13px;margin:6px 0}
.wcag{font-size:12px;color:#888}
.fixes{padding-left:18px;font-size:13px;color:#555;margin-top:6px}
</style>
</head>
<body>
<h1>A11y Checker Report</h1>
<div class="meta">
  <p><b>URL:</b> ${this.esc(result.url)}</p>
  <p><b>Date:</b> ${new Date(result.timestamp).toLocaleString()}</p>
  <p><b>WCAG Level:</b> ${result.wcagLevel}</p>
</div>

<div class="summary">
  <div class="summary-card"><div class="label">Total</div><div class="value">${result.summary.total}</div></div>
  <div class="summary-card critical"><div class="label">Critical</div><div class="value">${result.summary.critical}</div></div>
  <div class="summary-card serious"><div class="label">Serious</div><div class="value">${result.summary.serious}</div></div>
  <div class="summary-card moderate"><div class="label">Moderate</div><div class="value">${result.summary.moderate}</div></div>
  <div class="summary-card minor"><div class="label">Minor</div><div class="value">${result.summary.minor}</div></div>
</div>

<div class="issues">
${issueRows}
</div>
</body>
</html>`;
  }

  exportAsCsv(result: ScanResult): string {
    this.logger.info('Exporting as CSV');

    const headers = ['ID', 'Element', 'Description', 'Impact', 'WCAG Criteria', 'Help', 'Fix Suggestions'];
    const rows = result.issues.map((issue) => [
      issue.id,
      `<${issue.element.tagName}${issue.element.id ? ` id="${issue.element.id}"` : ''}>`,
      issue.description,
      issue.impact,
      issue.wcagCriteria.join('; '),
      issue.help,
      issue.fixSuggestions.join('; '),
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  }

  private esc(str: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, (c) => map[c] ?? c);
  }
}
