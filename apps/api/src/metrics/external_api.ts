import { startDurationTimer } from '@repo/metrics'
import {
  externalApiDurationHistogram,
  externalApiRequestsCounter,
} from './collectors'

/**
 * Wrapper to track external API call metrics
 */
export const trackExternalApiCall = async <T>(
  service: string,
  endpoint: string,
  apiFn: () => Promise<T>,
): Promise<T> => {
  const timer = startDurationTimer(externalApiDurationHistogram)
  let statusCode = 'unknown'

  try {
    const result = await apiFn()
    statusCode = '200' // Assuming success if no error

    timer.stop({ service, endpoint })
    externalApiRequestsCounter.inc({
      service,
      endpoint,
      status_code: statusCode,
    })

    return result
  } catch (error) {
    // Try to extract status code from error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      statusCode = String(error.statusCode)
    } else {
      statusCode = '500'
    }

    timer.stop({ service, endpoint })
    externalApiRequestsCounter.inc({
      service,
      endpoint,
      status_code: statusCode,
    })

    throw error
  }
}
