import { BaseError } from 'make-error'
import { Request, Response } from 'servie'

/**
 * Shape of the request flow.
 */
export type MakeRequest = (req: Request) => Promise<Response>

/**
 * Supported `authwith` methods.
 */
export type Type = 'oauth2' | 'oidc'

/**
 * Authentication error class used by the project.
 */
export class AuthError extends BaseError {

  constructor (public type: Type, public message: string, public code?: string, public uri?: string) {
    super(message)
  }

}

/**
 * Append the query to an existing URL.
 */
export function withQuery (url: string, query: string) {
  return url + (url.indexOf('?') > -1 ? '&' : '?') + query
}
