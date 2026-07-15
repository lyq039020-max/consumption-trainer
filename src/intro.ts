export const INTRO_STORAGE_KEY = 'spending-training-intro-seen-v1'

export function hasSeenIntro() {
  return localStorage.getItem(INTRO_STORAGE_KEY) === 'yes'
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_STORAGE_KEY, 'yes')
}
