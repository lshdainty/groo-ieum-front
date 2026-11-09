/** 받침이 있는 글자로 끝나는가 — 한글 음절만 본다(그 밖의 끝글자는 받침 없음으로 본다) */
const hasBatchim = (text: string): boolean => {
  const code = text.trim().charCodeAt(text.trim().length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

/** "을" / "를" — 한국어에서만(영어 문장은 조사가 없다) */
export const eulReul = (name: string, language: string): string => {
  if (!language.startsWith('ko')) return ''
  return hasBatchim(name) ? '을' : '를'
}
