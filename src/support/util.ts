import * as popsicle from 'popsicle'

/**
 * Consistent HTTP request options for project.
 */
export interface RequestOptions {
  url: string
  method?: string
  headers?: {
    [key: string]: string | string[]
  }
  body?: string
}

/**
 * Consistent HTTP response options for project.
 */
export interface ResponseOptions {
  url: string
  status: number
  body: string
}

/**
 * Default request function.
 */
export function request (options: RequestOptions): Promise<ResponseOptions> {
  return Promise.resolve(popsicle.request(options))
}

/**
 * Append the query to an existing URL.
 */
export function appendQuery (url: string, query: string) {
  return url + (url.indexOf('?') > -1 ? '&' : '?') + query
}
