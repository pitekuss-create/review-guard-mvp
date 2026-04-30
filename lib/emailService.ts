/**
 * [ReviewGuard] 계약 갱신 관련 이메일 발송 유틸리티
 * 훗날 Resend나 AWS SES 등으로 쉽게 교체할 수 있도록 모듈화되어 있습니다.
 */

export async function sendContractRenewalEmail(
  email: string,
  orgName: string,
  dDay: number,
  endDate: string
) {
  const subject = `[ReviewGuard] ${orgName}님의 엔터프라이즈 계약 만료 ${dDay}일 전 안내`;
  const message = `[ReviewGuard] ${orgName}님의 엔터프라이즈 계약이 ${dDay}일 후(${endDate}) 만료됩니다. 서비스의 중단 없는 이용을 위해 연장 결제를 진행해 주세요.`;

  // MVP 단계이므로 콘솔 로그로 대체 (Mock)
  console.log(`
    [EMAIL SERVICE MOCK]
    To: ${email}
    Subject: ${subject}
    Body: ${message}
    Timestamp: ${new Date().toISOString()}
  `);

  // TODO: 추후 실제 서비스 연동 시 아래와 같은 형태로 구현
  /*
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'ReviewGuard <no-reply@reviewguard.co.kr>',
      to: email,
      subject: subject,
      text: message,
    })
  });
  return res.ok;
  */

  return true;
}
