import { map } from 'map-pointer'
import { parse as parseUrl } from 'url'
import { stringify as stringifyQuery, parse as parseQuery } from 'querystring'
import { AuthError, ProfileMap, Profile } from './common'
import { request, appendQuery } from './support/util'
import { base64 } from './support/base64'

/**
 * Required configuration for OAuth 2.0 providers.
 */
export interface OAuth2Provider {
  accessTokenUri: string
  authorizationUri: string
  profileUri: string
  profileMap: ProfileMap
}

/**
 * Shape of the authorization step.
 */
export interface OAuth2Authorization {
  access_token: string
  token_type?: string
  refresh_token?: string
  expires_in?: string
}

/**
 * Authentication parameters passed between methods.
 */
export interface OAuth2Params {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
  state?: string
}

/**
 * Default OAuth 2.0 headers.
 */
export const DEFAULT_HEADERS = {
  'Accept': 'application/json, application/x-www-form-urlencoded',
  'Content-Type': 'application/x-www-form-urlencoded'
}

/**
 * Attempt to parse the payload body as JSON or URL-encoding.
 */
export function parseResponseBody (body: string) {
  try {
    return JSON.parse(body)
  } catch (e) {
    return parseQuery(body)
  }
}

/**
 * Check the body for an authentication error.
 */
export function getAuthError (body: any): AuthError | void {
  if (body.error || body.error_description) {
    return new AuthError('oauth2', body.error_description || body.error, body.error, body.error_uri)
  }
}

export class OAuth2 {

  constructor (public provider: OAuth2Provider) {}

  getRedirectUri (params: OAuth2Params) {
    const query = stringifyQuery({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope,
      response_type: 'code',
      state: params.state
    })

    return appendQuery(this.provider.authorizationUri, query)
  }

  _getToken (body: { [key: string]: string }, params: OAuth2Params): Promise<OAuth2Authorization> {
    return request({
      url: this.provider.accessTokenUri,
      method: 'POST',
      headers: Object.assign({
        Authorization: `Basic ${base64(`${params.clientId}:${params.clientSecret}`)}`
      }, DEFAULT_HEADERS),
      body: stringifyQuery(body)
    })
      .then((res) => {
        const body = parseResponseBody(res.body)
        const err = getAuthError(body)

        if (err) {
          return Promise.reject(err)
        }

        if (res.status !== 200) {
          return Promise.reject(new AuthError('oauth2', `Invalid response status: ${res.status}`))
        }

        if (!body.access_token) {
          return Promise.reject(new AuthError('oauth2', 'Unable to retrieve access token from response'))
        }

        return body
      })
  }

  getToken (callbackUri: string, params: OAuth2Params): Promise<OAuth2Authorization> {
    const { query } = parseUrl(callbackUri, true)
    const err = getAuthError(query)

    if (err) {
      return Promise.reject(err)
    }

    if (params.state && query.state !== params.state) {
      return Promise.reject(new AuthError('oauth2', 'OAuth 2.0 state mismatch'))
    }

    if (!query.code) {
      return Promise.reject(new AuthError('oauth2', 'Missing OAuth 2.0 code'))
    }

    return this._getToken({
      code: query.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri
    }, params)
  }

  refreshToken (refreshToken: string, params: OAuth2Params): Promise<OAuth2Authorization> {
    return this._getToken({
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, params)
  }

  getProfile (token: OAuth2Authorization, _params: OAuth2Params) {
    return request({
      url: this.provider.profileUri,
      method: 'GET',
      headers: Object.assign({
        Authorization: `Bearer ${token.access_token}`
      }, DEFAULT_HEADERS)
    })
      .then((res) => {
        if (res.status !== 200) {
          return Promise.reject<Profile>(new AuthError('oauth2', `Invalid response status: ${res.status}`))
        }

        const body = parseResponseBody(res.body)
        const profile = map<Profile>(this.provider.profileMap, body)

        if (!profile.sub) {
          return Promise.reject<Profile>(new AuthError('oauth2', 'No profile sub'))
        }

        return profile
      })
  }

}
