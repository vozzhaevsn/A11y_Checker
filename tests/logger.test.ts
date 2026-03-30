import { Logger } from '../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    logger = new Logger('Test');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info messages', () => {
    logger.info('test message');
    expect(console.log).toHaveBeenCalledWith(
      '[A11y Checker - Test] INFO:',
      'test message',
    );
  });

  it('logs warn messages', () => {
    logger.warn('warning');
    expect(console.warn).toHaveBeenCalledWith(
      '[A11y Checker - Test] WARN:',
      'warning',
    );
  });

  it('logs error messages', () => {
    logger.error('error');
    expect(console.error).toHaveBeenCalledWith(
      '[A11y Checker - Test] ERROR:',
      'error',
    );
  });

  it('does not log debug by default', () => {
    logger.debug('debug msg');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('logs debug when enabled', () => {
    Logger.enableDebug();
    logger.debug('debug msg');
    expect(console.debug).toHaveBeenCalledWith(
      '[A11y Checker - Test] DEBUG:',
      'debug msg',
    );
  });

  it('supports extra arguments', () => {
    logger.info('msg', { key: 'value' }, 42);
    expect(console.log).toHaveBeenCalledWith(
      '[A11y Checker - Test] INFO:',
      'msg',
      { key: 'value' },
      42,
    );
  });
});
