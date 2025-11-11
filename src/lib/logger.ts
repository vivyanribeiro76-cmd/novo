// Sistema de logs estruturado
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: sessionStorage.getItem('userId') || undefined
    }

    // Console log em desenvolvimento
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level)
      console.log(`%c[${level.toUpperCase()}]`, style, message, context || '')
    }

    // Em produção, enviar para serviço de monitoramento (Sentry, LogRocket, etc)
    if (!this.isDevelopment && level === 'error') {
      this.sendToMonitoring(entry)
    }

    // Armazenar logs localmente (últimos 100)
    this.storeLocally(entry)
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #0088FE; font-weight: bold',
      warn: 'color: #FFBB28; font-weight: bold',
      error: 'color: #FF8042; font-weight: bold',
      debug: 'color: #82ca9d; font-weight: bold'
    }
    return styles[level]
  }

  private storeLocally(entry: LogEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
      logs.push(entry)
      // Manter apenas últimos 100 logs
      if (logs.length > 100) logs.shift()
      localStorage.setItem('app_logs', JSON.stringify(logs))
    } catch (err) {
      // Silenciar erro de storage
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Integrar com Sentry, LogRocket, ou outro serviço
    // Por enquanto, apenas console.error
    console.error('Production Error:', entry)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  // Obter logs armazenados
  getLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]')
    } catch {
      return []
    }
  }

  // Limpar logs
  clearLogs() {
    localStorage.removeItem('app_logs')
  }
}

export const logger = new Logger()
