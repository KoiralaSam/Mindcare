/** Returns an https embed URL for common video hosts, or null if not embeddable. */
export function getVideoEmbedUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0]
      if (id && /^[\w-]{6,}$/.test(id)) {
        return `https://www.youtube.com/embed/${id}`
      }
      return null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v) {
        return `https://www.youtube.com/embed/${v}`
      }
      const embed = u.pathname.match(/^\/embed\/([\w-]+)/)
      if (embed?.[1]) {
        return `https://www.youtube.com/embed/${embed[1]}`
      }
      const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/)
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`
      }
      const live = u.pathname.match(/^\/live\/([\w-]+)/)
      if (live?.[1]) {
        return `https://www.youtube.com/embed/${live[1]}`
      }
      return null
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const m = u.pathname.match(/\/(?:video\/)?(\d+)/)
      if (m?.[1]) {
        return `https://player.vimeo.com/video/${m[1]}`
      }
      return null
    }

    return null
  } catch {
    return null
  }
}
