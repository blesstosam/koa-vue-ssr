// Imported from vue-router
export function getLocation (base, mode) {
  let path = decodeURI(window.location.pathname)
  if (mode === 'hash') {
    return window.location.hash.replace(/^#\//, '')
  }
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length)
  }
  return (path || '/') + window.location.search + window.location.hash
}