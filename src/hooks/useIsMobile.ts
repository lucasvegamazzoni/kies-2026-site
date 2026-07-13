import { useEffect, useState } from 'react'

// True on phone-width viewports. Drives the switch between the constellation
// (desktop) and the scrollable list view (mobile).
export function useIsMobile(query = '(max-width: 760px)'): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return isMobile
}
