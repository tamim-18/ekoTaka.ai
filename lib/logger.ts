/**
 * Centralized logging utility for EkoTaka
 * Provides structured logging with different log levels
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): string {
    const timestamp = this.formatTimestamp()
    const contextStr = context ? ` | Context: ${JSON.stringify(context, null, 2)}` : ''
    const errorStr = error ? ` | Error: ${error.message}${error.stack ? `\n${error.stack}` : ''}` : ''
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const formattedMessage = this.formatMessage(level, message, context, error)
    
    switch (level) {
      case 'success':
        console.log(`✅ ${formattedMessage}`)
        break
      case 'info':
        console.log(`ℹ️  ${formattedMessage}`)
        break
      case 'warn':
        console.warn(`⚠️  ${formattedMessage}`)
        break
      case 'error':
        console.error(`❌ ${formattedMessage}`)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(`🔍 ${formattedMessage}`)
        }
        break
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  success(message: string, context?: Record<string, any>) {
    this.log('success', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }
}

export const logger = new Logger()

