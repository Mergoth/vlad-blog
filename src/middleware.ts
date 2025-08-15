// CASCADE_HINT: Pass-through middleware; Edge Function handles "/" redirect
import type { MiddlewareHandler } from 'astro'

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  return next()
}
