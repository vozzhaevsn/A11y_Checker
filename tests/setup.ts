const chromeMock = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    onInstalled: {
      addListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn((cb?: () => void) => cb?.()),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue([]),
  },
  devtools: {
    inspectedWindow: { tabId: 1 },
    panels: {
      create: jest.fn(),
    },
  },
};

(globalThis as any).chrome = chromeMock;
