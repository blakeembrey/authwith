import { OpenIDConnect } from './index'
import { Request, Response } from 'servie'

describe('auth', () => {
  describe('oauth 2.0', () => {
    const request = async (req: Request) => new Response({})

    const auth = new OpenIDConnect({
      authorizationUri: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline',
      accessTokenUri: 'https://www.googleapis.com/oauth2/v4/token',
      issuer: 'https://accounts.google.com'
    }, request)

    it('should generate a redirect uri', () => {
      const redirectUri = auth.getRedirectUri({
        scope: 'openid email',
        clientId: 'abc',
        clientSecret: '123',
        redirectUri: `http://example.com/auth/callback`
      })

      expect(redirectUri).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&client_id=abc&redirect_uri=http%3A%2F%2Fexample.com%2Fauth%2Fcallback&scope=openid%20email&response_type=code&state=&nonce=&max_age='
      )
    })
  })
})
