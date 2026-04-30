export interface VerificationResult {
  isValid: boolean;
  message: string;
}

/**
 * 사업자번호 검증 (숫자만 남기고 치트키 확인)
 */
export async function verifyBusinessNumber(brn: string): Promise<VerificationResult> {
  const cleanBrn = brn.replace(/[^0-9]/g, ""); // 숫자 빼고 다 제거

  if (cleanBrn === "9999999999") {
    return { isValid: true, message: "[QA Pass] 테스트용 사업자번호입니다." };
  }

  if (cleanBrn.length !== 10) {
    return { isValid: false, message: "사업자등록번호는 10자리 숫자여야 합니다." };
  }

  return { isValid: true, message: "정상입니다." };
}

/**
 * 영업신고번호 검증 (모든 공백/특수문자 무시하고 치트키 확인)
 */
export async function verifyOperatingLicense(oln: string): Promise<VerificationResult> {
  if (!oln) return { isValid: false, message: "영업신고번호를 입력해주세요." };

  // 1. 무적의 전처리: 소문자로 바꾸고, 영어/숫자 제외한 모든 것(공백, 하이픈 등) 제거
  // 예: "Test - 1234" -> "test1234"
  const superClean = oln.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 2. 치트키 확인 (최우선)
  // "test"로 시작하는 모든 입력값은 QA 통과 (다중 점포 테스트용)
  if (superClean.startsWith("test")) {
    return { isValid: true, message: "[QA Pass] 테스트용 영업신고번호입니다." };
  }

  // 3. 일반 유저용 유효성 검사
  if (oln.trim().length < 5) {
    return { isValid: false, message: "영업신고번호가 너무 짧습니다." };
  }

  // 4. 일반 유저가 'test'를 포함했을 때만 차단
  if (superClean.includes("test")) {
    return { isValid: false, message: "유효하지 않은 영업신고번호 형식입니다." };
  }

  return { isValid: true, message: "정상입니다." };
}