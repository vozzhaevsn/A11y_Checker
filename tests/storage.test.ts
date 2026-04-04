import { StorageUtil } from '../src/utils/storage';
import { ScanResult, Settings } from '../src/types';

describe('StorageUtil', () => {
  let storage: StorageUtil;
  let storedData: Record<string, unknown>;

  beforeEach(() => {
    storedData = {};

    (chrome.storage.local.get as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve({ [key]: storedData[key] });
    });

    (chrome.storage.local.set as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
      Object.assign(storedData, data);
      return Promise.resolve();
    });

    storage = new StorageUtil();
  });

  it('saves and retrieves scan results', async () => {
    const result: ScanResult = {
      id: 'test-1',
      url: 'https://example.com',
      timestamp: Date.now(),
      summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
      issues: [],
      wcagLevel: 'AA',
    };

    await storage.saveScanResult(result);
    const results = await storage.getAllScanResults();
    expect(results.length).toBe(1);
    expect(results[0]!.id).toBe('test-1');
  });

  it('retrieves result by ID', async () => {
    const result: ScanResult = {
      id: 'test-find',
      url: 'https://example.com',
      timestamp: Date.now(),
      summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
      issues: [],
      wcagLevel: 'AA',
    };

    await storage.saveScanResult(result);
    const found = await storage.getScanResultById('test-find');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('test-find');
  });

  it('returns null for non-existent ID', async () => {
    const found = await storage.getScanResultById('nonexistent');
    expect(found).toBeNull();
  });

  it('clears all scan results', async () => {
    await storage.saveScanResult({
      id: 'test-clear',
      url: 'https://example.com',
      timestamp: Date.now(),
      summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
      issues: [],
      wcagLevel: 'AA',
    });

    await storage.clearAllScanResults();
    const results = await storage.getAllScanResults();
    expect(results.length).toBe(0);
  });

  it('saves and retrieves settings', async () => {
    const settings: Settings = {
      wcagLevel: 'AAA',
      locale: 'en',
      includeColorContrast: false,
      includeImages: true,
      includeKeyboard: false,
      includeSemantics: true,
      autoScanOnLoad: true,
      theme: 'dark',
    };

    await storage.saveSettings(settings);
    const loaded = await storage.getSettings();
    expect(loaded.wcagLevel).toBe('AAA');
    expect(loaded.theme).toBe('dark');
    expect(loaded.includeColorContrast).toBe(false);
  });

  it('returns default settings when none stored', async () => {
    const settings = await storage.getSettings();
    expect(settings.wcagLevel).toBe('AA');
    expect(settings.locale).toBe('en');
    expect(settings.theme).toBe('light');
  });

  it('limits stored results to 50', async () => {
    for (let i = 0; i < 55; i++) {
      await storage.saveScanResult({
        id: `test-${i}`,
        url: 'https://example.com',
        timestamp: Date.now(),
        summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
        issues: [],
        wcagLevel: 'AA',
      });
    }

    const results = await storage.getAllScanResults();
    expect(results.length).toBeLessThanOrEqual(50);
  });
});
