import { ScanResult } from '../types';
/**
 * Export utility for generating reports in various formats
 */
export declare class ExportUtil {
    private logger;
    constructor();
    /**
     * Exports scan result as JSON
     */
    exportAsJson(result: ScanResult): string;
    /**
     * Exports scan result as HTML report
     */
    exportAsHtml(result: ScanResult): string;
    /**
     * Exports scan result as CSV
     */
    exportAsCsv(result: ScanResult): string;
}
//# sourceMappingURL=export.d.ts.map