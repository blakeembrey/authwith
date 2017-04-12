import { OAuth2 } from './index'

describe('auth', () => {
  describe('oauth 2.0', () => {
    const auth = new OAuth2({
      accessTokenUri: 'https://github.com/login/oauth/access_token',
      authorizationUri: 'https://github.com/login/oauth/authorize',
      profileUri: 'https://api.github.com/user',
      clientId: 'abc',
      clientSecret: '123',
      scope: 'user',
      redirectUri: 'http://example.com/login/callback',
      profileMap: {
        sub: '/id'
      }
    })

    it('should generate a redirect uri', () => {
      expect(
        auth.getRedirectUri({ state: 'state' })
      ).toBe(
        'https://github.com/login/oauth/authorize?client_id=abc&redirect_uri=http%3A%2F%2Fexample.com%2Flogin%2Fcallback&scope=user&response_type=code&state=state'
      )
    })
  })
})
