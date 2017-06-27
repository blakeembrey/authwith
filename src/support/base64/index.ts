export function base64 (content: string) {
  return new Buffer(content, 'utf8').toString('base64')
}
