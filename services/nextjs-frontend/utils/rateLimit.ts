/**
 * Rate Limiting Utility
 * Ограничение частоты запросов для защиты API от злоупотреблений
 */

interface RateLimitConfig {
  windowMs: number // Временное окно в миллисекундах
  maxRequests: number // Максимальное количество запросов в окне
  message?: string // Сообщение об ошибке
}

interface RequestRecord {
  count: number
  resetTime: number
}

// In-memory хранилище для rate limiting
// В production лучше использовать Redis
const requestStore = new Map<string, RequestRecord>()

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestStore.entries()) {
    if (record.resetTime < now) {
      requestStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Получить идентификатор клиента из запроса
 */
function getClientId(request: Request): string {
  // Используем IP адрес или заголовок X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  // Также можно использовать user-agent для более точной идентификации
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Комбинируем IP и путь для более точного rate limiting
  const url = new URL(request.url)
  const path = url.pathname
  
  return `${ip}:${path}`
}

/**
 * Проверить rate limit для запроса
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const clientId = getClientId(request)
  const now = Date.now()
  
  let record = requestStore.get(clientId)
  
  // Если записи нет или она устарела, создаём новую
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  // Увеличиваем счётчик
  record.count++
  requestStore.set(clientId, record)
  
  // Проверяем лимит
  if (record.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      message: config.message || `Rate limit exceeded. Try again after ${new Date(record.resetTime).toISOString()}`,
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Конфигурации rate limit для разных типов endpoints
 */
export const rateLimitConfigs = {
  // Общие API endpoints - 100 запросов в минуту
  default: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 100,
    message: 'Too many requests. Please try again later.',
  },
  
  // ISS endpoints - 30 запросов в минуту (часто обновляются)
  iss: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 30,
    message: 'Too many ISS data requests. Please wait a moment.',
  },
  
  // OSDR endpoints - 20 запросов в минуту (тяжёлые запросы)
  osdr: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 20,
    message: 'Too many OSDR requests. Please wait a moment.',
  },
  
  // Astronomy endpoints - 50 запросов в минуту
  astro: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 50,
    message: 'Too many astronomy requests. Please wait a moment.',
  },
  
  // JWST endpoints - 40 запросов в минуту
  jwst: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 40,
    message: 'Too many JWST requests. Please wait a moment.',
  },
  
  // Telemetry endpoints - 60 запросов в минуту
  telemetry: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 60,
    message: 'Too many telemetry requests. Please wait a moment.',
  },
  
  // CMS endpoints - 30 запросов в минуту
  cms: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 30,
    message: 'Too many CMS requests. Please wait a moment.',
  },
  
  // Proxy endpoints - 10 запросов в минуту (самые ограниченные)
  proxy: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 10,
    message: 'Too many proxy requests. Please wait a moment.',
  },
}

/**
 * Middleware для применения rate limit к API route
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = rateLimitConfigs.default
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResult = checkRateLimit(request, config)
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }
    
    // Добавляем заголовки rate limit к успешному ответу
    const response = await handler(request)
    
    // Клонируем response чтобы добавить заголовки
    const newResponse = response.clone()
    newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    newResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    newResponse.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return newResponse
  }
}

