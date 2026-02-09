/**
 * Validation Utilities
 * 폼 입력 검증 함수
 */

import { VALIDATION } from './constants'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * 이메일 유효성 검증
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: '이메일을 입력해주세요.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식이 아닙니다.' }
  }

  return { isValid: true }
}

/**
 * 비밀번호 유효성 검증
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: '비밀번호를 입력해주세요.' }
  }

  if (password.length < VALIDATION.PASSWORD.MIN) {
    return {
      isValid: false,
      error: `비밀번호는 최소 ${VALIDATION.PASSWORD.MIN}자 이상이어야 합니다.`,
    }
  }

  if (password.length > VALIDATION.PASSWORD.MAX) {
    return {
      isValid: false,
      error: `비밀번호는 최대 ${VALIDATION.PASSWORD.MAX}자까지 가능합니다.`,
    }
  }

  return { isValid: true }
}

/**
 * 닉네임 유효성 검증
 */
export function validateNickname(nickname: string): ValidationResult {
  if (!nickname) {
    return { isValid: false, error: '닉네임을 입력해주세요.' }
  }

  if (nickname.length < VALIDATION.NICKNAME.MIN) {
    return {
      isValid: false,
      error: `닉네임은 최소 ${VALIDATION.NICKNAME.MIN}자 이상이어야 합니다.`,
    }
  }

  if (nickname.length > VALIDATION.NICKNAME.MAX) {
    return {
      isValid: false,
      error: `닉네임은 최대 ${VALIDATION.NICKNAME.MAX}자까지 가능합니다.`,
    }
  }

  if (!VALIDATION.NICKNAME.PATTERN.test(nickname)) {
    return {
      isValid: false,
      error: '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.',
    }
  }

  return { isValid: true }
}

/**
 * 추천인 코드 유효성 검증
 */
export function validateReferralCode(code: string): ValidationResult {
  if (!code) {
    return { isValid: true } // 선택 사항이므로 빈 값 허용
  }

  if (!VALIDATION.REFERRAL_CODE.PATTERN.test(code)) {
    return {
      isValid: false,
      error: '추천인 코드는 8자리 대문자와 숫자로 구성되어야 합니다.',
    }
  }

  return { isValid: true }
}

/**
 * 프롬프트 제목 검증
 */
export function validatePromptTitle(title: string): ValidationResult {
  if (!title) {
    return { isValid: false, error: '제목을 입력해주세요.' }
  }

  const { MIN, MAX } = VALIDATION.PROMPT.TITLE
  if (title.length < MIN) {
    return { isValid: false, error: `제목은 최소 ${MIN}자 이상이어야 합니다.` }
  }

  if (title.length > MAX) {
    return { isValid: false, error: `제목은 최대 ${MAX}자까지 가능합니다.` }
  }

  return { isValid: true }
}

/**
 * 프롬프트 가격 검증
 */
export function validatePromptPrice(price: number): ValidationResult {
  if (!price || price <= 0) {
    return { isValid: false, error: '가격을 입력해주세요.' }
  }

  if (price < 10) {
    return { isValid: false, error: '최소 가격은 10 포인트입니다.' }
  }

  if (price > 10000) {
    return { isValid: false, error: '최대 가격은 10,000 포인트입니다.' }
  }

  return { isValid: true }
}
