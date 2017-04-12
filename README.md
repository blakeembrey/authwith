# Authwith

[![Greenkeeper badge](https://badges.greenkeeper.io/blakeembrey/authwith.svg)](https://greenkeeper.io/)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Re-usable authentication library.

## Installation

```
npm install authwith --save
```

## Usage

Available classes (implementations):

* `OAuth2`
* `OpenIDConnect`

### OAuth 2.0

```js
import { OAuth2 } from 'authwith'

const auth = new OAuth2(options)
```

* `authorizationUri` The URL to redirect the user for authorization
* `accessTokenUri` The URL to retrieve the access token
* `profileUri` The URL to request user information
* `profileMap` A schema using [`map-pointer`](https://github.com/blakeembrey/map-pointer) from profile response into standard profile info

#### Parameters

These are passed as the final option to each method:

* `clientId` The client id issued by the OAuth 2.0 server
* `clientSecret` The client secret issued by the OAuth 2.0 server
* `redirectUri` A URL on your server to receive callbacks from the OAuth 2.0 server
* `scope` The requested scope string
* `state?` An optional state to be verified on callback

#### Flow

1. Redirect user to the URL returned from the `auth.getRedirectUri(params)` method
  - **P.S.** Save the state into the users session for verification on redirect
2. When the callback (redirect) URL is invoked, call `auth.getToken(uri, params)` - this will make a request for the access token
3. With the access token from the response, call `auth.getProfile(token, params)` - this will retrieve the users profile information

### Open ID Connect

```js
import { OpenIDConnect } from 'authwith'

const auth = new OpenIDConnect(options)
```

* `authorizationUri` The URL to redirect the user for authorization
* `accessTokenUri` The URL to retrieve the access token
* `issuer` The issuer string for the ID token
* `profileMap?` The same schema as OAuth 2.0 - uses the OIDC default map when not specified

#### Parameters

Extends `OAuth2` parameters:

* `nonce?` Verifies the nonce when reading the profile information
* `maxAge?` Verifies the max age when reading the profile information
* `timestamp?` Used in conjunction with `maxAge` to verify `auth_time` claim

#### Flow

1. Redirect user to the URL returned from `auth.getRedirectUri(params)` (remembering to store `state` when specified to verify later)
2. When the callback (redirect) URL is invoked, call `auth.getToken(uri, params)` - this will make a request for the access token
3. With the access token from the response, call `auth.getProfile(token, params)` - this will retrieve the users profile information

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/authwith.svg?style=flat
[npm-url]: https://npmjs.org/package/authwith
[downloads-image]: https://img.shields.io/npm/dm/authwith.svg?style=flat
[downloads-url]: https://npmjs.org/package/authwith
[travis-image]: https://img.shields.io/travis/blakeembrey/authwith.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/authwith
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/authwith.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/authwith?branch=master
