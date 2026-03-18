export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[A11y Checker - ${this.context}] INFO:`, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[A11y Checker - ${this.context}] WARN:`, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[A11y Checker - ${this.context}] ERROR:`, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[A11y Checker - ${this.context}] DEBUG:`, message, ...args);
    }
  }
}