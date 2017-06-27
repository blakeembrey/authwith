import { BaseError } from 'make-error'

/**
 * Shape of a user profile object.
 */
export interface Profile {
  sub: string
  name?: string
  givenName?: string
  middleName?: string
  familyName?: string
  nickname?: string
  preferredUsername?: string
  profile?: string
  picture?: string
  website?: string
  gender?: string
  birthdate?: string
  zoneinfo?: string
  locale?: string
  updatedAt?: number
  email?: string
  emailVerified?: boolean
  phoneNumber?: string
  phoneNumberVerified?: boolean
}

/**
 * Mapper for profile information (JSON-pointer map).
 */
export type ProfileMap = {
  [K in keyof Profile]: string
}

export type Type = 'oauth2' | 'oauth1' | 'oidc'

/**
 * Authentication error class used by the project.
 */
export class AuthError extends BaseError {

  constructor (public type: Type, public message: string, public code?: string, public uri?: string) {
    super(message)
  }

}
