/**
 * Agent Log Service - Logs agent queries, tool calls, and responses
 */

import pool from '../config/database';
import logger from '../utils/logger';

export interface AgentLogEntry {
  userId?: string;
  sessionId?: string;
  query: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }>;
  response: string;
  executionTimeMs: number;
  error?: string;
}

export class AgentLogService {
  /**
   * Log an agent interaction
   */
  async logInteraction(entry: AgentLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO agent_logs (
          user_id, session_id, query, tool_calls, response, execution_time_ms, error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await pool.query(query, [
        entry.userId || null,
        entry.sessionId || null,
        entry.query,
        entry.toolCalls ? JSON.stringify(entry.toolCalls) : null,
        entry.response,
        entry.executionTimeMs,
        entry.error || null,
      ]);

      // Also log to Winston for real-time monitoring
      if (entry.error) {
        logger.error('Agent interaction failed', {
          userId: entry.userId,
          sessionId: entry.sessionId,
          query: entry.query,
          error: entry.error,
          executionTimeMs: entry.executionTimeMs,
        });
      } else {
        logger.info('Agent interaction completed', {
          userId: entry.userId,
          sessionId: entry.sessionId,
          toolsUsed: entry.toolCalls?.map(tc => tc.name).join(', '),
          executionTimeMs: entry.executionTimeMs,
        });
      }
    } catch (error: any) {
      logger.error('Failed to log agent interaction', {
        error: error.message,
        entry,
      });
    }
  }

  /**
   * Get agent logs for a user
   */
  async getUserLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        SELECT 
          log_id,
          session_id,
          query,
          tool_calls,
          response,
          execution_time_ms,
          error,
          created_at
        FROM agent_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to retrieve user logs', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get agent logs for a session
   */
  async getSessionLogs(sessionId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          log_id,
          user_id,
          query,
          tool_calls,
          response,
          execution_time_ms,
          error,
          created_at
        FROM agent_logs
        WHERE session_id = $1
        ORDER BY created_at ASC
      `;

      const result = await pool.query(query, [sessionId]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to retrieve session logs', {
        sessionId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get error logs for monitoring
   */
  async getErrorLogs(limit: number = 100): Promise<any[]> {
    try {
      const query = `
        SELECT 
          log_id,
          user_id,
          session_id,
          query,
          tool_calls,
          error,
          execution_time_ms,
          created_at
        FROM agent_logs
        WHERE error IS NOT NULL
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to retrieve error logs', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get tool usage statistics
   */
  async getToolUsageStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      let query = `
        SELECT 
          jsonb_array_elements(tool_calls)->>'name' as tool_name,
          COUNT(*) as usage_count,
          AVG(execution_time_ms) as avg_execution_time_ms
        FROM agent_logs
        WHERE tool_calls IS NOT NULL
      `;

      const params: any[] = [];
      if (startDate) {
        params.push(startDate);
        query += ` AND created_at >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        query += ` AND created_at <= $${params.length}`;
      }

      query += `
        GROUP BY tool_name
        ORDER BY usage_count DESC
      `;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to retrieve tool usage stats', {
        error: error.message,
      });
      return [];
    }
  }
}

export const agentLogService = new AgentLogService();
