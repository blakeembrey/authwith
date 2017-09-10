import jsonwebtoken = require('jsonwebtoken')
import { map } from 'map-pointer'
import { stringify as stringifyQuery } from 'querystring'
import { OAuth2, OAuth2Provider, OAuth2Authorization, OAuth2Params } from './oauth2'
import { AuthError, ProfileMap, Profile } from './common'
import { appendQuery } from './support/util'

/**
 * Provider configuration.
 */
export interface OpenIDConnectProvider {
  accessTokenUri: string
  authorizationUri: string
  issuer: string
  profileMap?: ProfileMap
}

/**
 * Authorization response.
 */
export interface OpenIDConnectAuthorization extends OAuth2Authorization {
  id_token: string
}

/**
 * Parameters are similar to "local state" and should be passed to each method.
 */
export interface OpenIDConnectParams extends OAuth2Params {
  scope: string
  nonce?: string
  // Specifies the allowable elapsed time in ms.
  maxAge?: number
  // Current timestamp used alongside `maxAge` for verification.
  timestamp?: number
}

/**
 * Default profile map for OpenID Connect.
 */
const OIDC_PROFILE_MAP: ProfileMap = {
  sub: '/sub',
  name: '/name',
  givenName: '/given_name',
  familyName: '/family_name',
  middleName: '/middle_name',
  nickname: '/nickname',
  preferredUsername: '/preferred_username',
  profile: '/profile',
  picture: '/picture',
  website: '/website',
  email: '/email',
  emailVerified: '/email_verified',
  gender: '/gender',
  birthdate: '/birthdate',
  zoneinfo: '/zoneinfo',
  locale: '/locale',
  phoneNumber: '/phone_number',
  phoneNumberVerified: '/phone_number_verified',
  updatedAt: '/updated_at'
}

export class OpenIDConnect extends OAuth2 {

  provider: OpenIDConnectProvider & OAuth2Provider

  constructor (_provider: OpenIDConnectProvider) {
    const provider: OAuth2Provider = Object.assign({
      profileMap: OIDC_PROFILE_MAP,
      profileUri: ''
    }, _provider)

    super(provider)
  }

  getRedirectUri (params: OpenIDConnectParams) {
    if (!params.scope || !/\bopenid\b/.test(params.scope)) {
      throw new TypeError(`Scope "${params.scope}" must contain "openid"`)
    }

    const query = stringifyQuery({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope || 'openid',
      response_type: 'code',
      state: params.state,
      nonce: params.nonce,
      max_age: typeof params.maxAge === 'number' ? ~~(params.maxAge / 1000) : undefined
    })

    return appendQuery(this.provider.authorizationUri, query)
  }

  async getToken (callbackUri: string, params: OpenIDConnectParams) {
    const token = await super.getToken(callbackUri, params) as OpenIDConnectAuthorization

    if (!token.id_token) {
      return Promise.reject(new AuthError('oidc', 'Missing id token'))
    }

    return token
  }

  // Based on https://github.com/jaredhanson/passport-openidconnect/blob/ac1c0257f02353f818be33c0602cca5883d97235/lib/strategy.js.
  getProfile (token: OpenIDConnectAuthorization, params: OpenIDConnectParams) {
    const jwtClaims = jsonwebtoken.decode(token.id_token) as any

    if (!jwtClaims || typeof jwtClaims !== 'object') {
      return Promise.reject<Profile>(new AuthError('oidc', 'JWT payload is invalid'))
    }

    const missing = ['iss', 'sub', 'aud', 'exp', 'iat'].filter((param) => !jwtClaims[param])

    if (missing.length) {
      return Promise.reject<Profile>(new AuthError('oidc', `ID token missing required parameters: ${missing.join(', ')}`))
    }

    // https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - check 1.
    if (jwtClaims.iss !== this.provider.issuer) {
      return Promise.reject<Profile>(new AuthError('oidc', `ID token not issued by correct OpenID provider: ${jwtClaims.iss}`))
    }

    // https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - checks 2 and 3.
    if (typeof jwtClaims.aud === 'string') {
      if (jwtClaims.aud !== params.clientId) {
        return Promise.reject<Profile>(new AuthError('oidc', `Audience parameter is for a different client: ${jwtClaims.aud}`))
      }
    } else if (Array.isArray(jwtClaims.aud)) {
      if (jwtClaims.aud.indexOf(params.clientId) === -1) {
        return Promise.reject<Profile>(new AuthError('oidc', `Audience parameter does not include this client: ${jwtClaims.aud.join(', ')}`))
      }

      if (jwtClaims.aud.length > 1 && !jwtClaims.azp) {
        return Promise.reject<Profile>(new AuthError('oidc', '`azp` parameter required with multiple audiences'))
      }
    } else {
      return Promise.reject<Profile>(new AuthError('oidc', 'Invalid `aud` parameter'))
    }

    // https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - check 4.
    if (jwtClaims.azp && jwtClaims.azp !== params.clientId) {
      return Promise.reject<Profile>(new AuthError('oidc', `This client is not the authorized party: ${jwtClaims.azp}`))
    }

    // https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - check 5.
    if (jwtClaims.exp < (Date.now() / 1000)) {
      return Promise.reject<Profile>(new AuthError('oidc', 'ID token has expired'))
    }

    // Note: https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - checks 6 and 7 are out of scope of this library.

    // https://openid.net/specs/openid-connect-basic-1_0.html#IDTokenValidation - check 8.
    if (params.maxAge) {
      if (!params.timestamp) {
        return Promise.reject<Profile>(new TypeError('The timestamp must be provided with `maxAge` parameter'))
      }

      if (!jwtClaims.auth_time || ((params.timestamp - params.maxAge) / 1000) > jwtClaims.auth_time) {
        return Promise.reject<Profile>(new AuthError('oidc', 'Auth time is not included or too old'))
      }
    }

    if (params.nonce && (!jwtClaims.nonce || jwtClaims.nonce !== params.nonce)) {
      return Promise.reject<Profile>(new AuthError('oidc', 'Invalid nonce in ID token'))
    }

    const profile = map<Profile>(this.provider.profileMap, jwtClaims)

    if (!profile.sub) {
      return Promise.reject<Profile>(new AuthError('oauth2', 'No profile sub'))
    }

    return Promise.resolve(profile)
  }

}
