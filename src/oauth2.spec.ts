import { OAuth2 } from './index'
import { Request, Response } from 'servie'

describe('auth', () => {
  describe('oauth 2.0', () => {
    const request = async (req: Request) => new Response({})

    const auth = new OAuth2({
      accessTokenUri: 'https://github.com/login/oauth/access_token',
      authorizationUri: 'https://github.com/login/oauth/authorize',
      profileUri: 'https://api.github.com/user'
    }, request)

    it('should generate a redirect uri', () => {
      const redirectUri = auth.getRedirectUri({
        clientId: 'abc',
        clientSecret: '123',
        scope: 'user',
        redirectUri: 'http://example.com/login/callback',
        state: 'state'
      })

      expect(redirectUri).toBe(
        'https://github.com/login/oauth/authorize?client_id=abc&redirect_uri=http%3A%2F%2Fexample.com%2Flogin%2Fcallback&scope=user&response_type=code&state=state'
      )
    })
  })
})
