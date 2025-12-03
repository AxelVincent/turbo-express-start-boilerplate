import { startDurationTimer } from '@repo/metrics'
import {
  databaseQueriesCounter,
  databaseQueryDurationHistogram,
} from './collectors'

/**
 * Wrapper to track database query metrics with start/stop
 */
export const trackDatabaseQuery = async <T>(
  operation: 'select' | 'insert' | 'update' | 'delete',
  table: string,
  queryFn: () => Promise<T>,
): Promise<T> => {
  const timer = startDurationTimer(databaseQueryDurationHistogram)

  try {
    const result = await queryFn()

    timer.stop({ operation, table })
    databaseQueriesCounter.inc({ operation, table })

    return result
  } catch (error) {
    timer.stop({ operation, table })
    throw error
  }
}
