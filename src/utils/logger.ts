export class Logger {
  private context: string;
  private static debugMode = false;

  static enableDebug(): void {
    Logger.debugMode = true;
  }

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: unknown[]): void {
    console.log(`[A11y Checker - ${this.context}] INFO:`, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[A11y Checker - ${this.context}] WARN:`, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[A11y Checker - ${this.context}] ERROR:`, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (Logger.debugMode) {
      console.debug(`[A11y Checker - ${this.context}] DEBUG:`, message, ...args);
    }
  }
}
