/**
 * Structured logging utility
 * Provides consistent logging format for key events
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  roomCode?: string;
  roomId?: string;
  playerId?: string;
  playerNickname?: string;
  action?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  context?: LogContext;
}

/**
 * Format log entry as JSON string
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Get current ISO timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a structured log entry
 */
function log(level: LogLevel, event: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    event,
    context,
  };

  const formattedLog = formatLog(entry);

  switch (level) {
    case 'debug':
      console.debug(formattedLog);
      break;
    case 'info':
      console.info(formattedLog);
      break;
    case 'warn':
      console.warn(formattedLog);
      break;
    case 'error':
      console.error(formattedLog);
      break;
  }
}

/**
 * Logger instance with convenience methods
 */
export const logger = {
  debug: (event: string, context?: LogContext) => log('debug', event, context),
  info: (event: string, context?: LogContext) => log('info', event, context),
  warn: (event: string, context?: LogContext) => log('warn', event, context),
  error: (event: string, context?: LogContext) => log('error', event, context),

  // Specific event loggers for key actions
  roomCreated: (roomCode: string, playerId: string, expectedPlayers: number) => {
    log('info', 'room.created', {
      roomCode,
      playerId,
      action: 'create',
      expectedPlayers,
    });
  },

  roomDeleted: (roomCode: string, reason: string) => {
    log('info', 'room.deleted', {
      roomCode,
      action: 'delete',
      reason,
    });
  },

  playerJoined: (roomCode: string, playerId: string, playerNickname: string) => {
    log('info', 'player.joined', {
      roomCode,
      playerId,
      playerNickname,
      action: 'join',
    });
  },

  playerLeft: (roomCode: string, playerId: string, playerNickname?: string) => {
    log('info', 'player.left', {
      roomCode,
      playerId,
      playerNickname,
      action: 'leave',
    });
  },

  playerDisconnected: (roomCode: string, playerId: string) => {
    log('info', 'player.disconnected', {
      roomCode,
      playerId,
      action: 'disconnect',
    });
  },

  playerReconnected: (roomCode: string, playerId: string) => {
    log('info', 'player.reconnected', {
      roomCode,
      playerId,
      action: 'reconnect',
    });
  },

  rolesDistributed: (roomCode: string, playerCount: number) => {
    log('info', 'roles.distributed', {
      roomCode,
      action: 'distribute',
      playerCount,
    });
  },

  roleConfirmed: (roomCode: string, playerId: string, confirmed: number, total: number) => {
    log('info', 'role.confirmed', {
      roomCode,
      playerId,
      action: 'confirm',
      confirmed,
      total,
    });
  },

  gameStarted: (roomCode: string, playerCount: number) => {
    log('info', 'game.started', {
      roomCode,
      action: 'start',
      playerCount,
    });
  },

  apiError: (endpoint: string, errorCode: string, message: string, playerId?: string) => {
    log('error', 'api.error', {
      action: endpoint,
      error: errorCode,
      playerId,
      message,
    });
  },

  cleanupRun: (roomsDeleted: number, reason: string) => {
    log('info', 'cleanup.run', {
      action: 'cleanup',
      roomsDeleted,
      reason,
    });
  },
};

export default logger;
