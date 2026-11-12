/*
 * 쓰기 실패 응답의 code(HrErrorCode · groo-core ErrorCode) → 사유 글 키(common 이름공간 `failure.code.*`).
 * 호출처가 자기 글을 가져가지 않은 쓰기 실패를 그물이 알릴 때 쓴다. 표에 없는 코드는 일반 글이다.
 * 표 전체(코드 · 글 · 쓰이는 호출처)는 I-22-1-result.md. 서버가 준 message 는 쓰지 않는다 — 사유는 코드로 고른다.
 */
export const FAILURE_CODE_KEYS: Record<string, string> = {
  USER_002: 'failure.code.alreadyUser',
  USER_003: 'failure.code.invalidPassword',
  USER_005: 'failure.code.duplicateEmail',
  USER_006: 'failure.code.emailMismatch',
  USER_007: 'failure.code.confirmMismatch',
  USER_008: 'failure.code.samePassword',
  VACATION_002: 'failure.code.insufficient',
  VACATION_003: 'failure.code.vacationDate',
  VACATION_004: 'failure.code.alreadyApproved',
  VACATION_005: 'failure.code.alreadyRejected',
  VACATION_006: 'failure.code.cannotCancel',
  VACATION_009: 'failure.code.approverCount',
  VACATION_010: 'failure.code.duplicateApprover',
  VACATION_011: 'failure.code.selfApproval',
  VACATION_012: 'failure.code.minuteUsage',
  VACATION_014: 'failure.code.policyNameDuplicate',
  VACATION_015: 'failure.code.noApprovalLine',
  VACATION_PLAN_002: 'failure.code.planExists',
  VACATION_PLAN_005: 'failure.code.userPlanExists',
  VACATION_PLAN_006: 'failure.code.planPolicyExists',
  WORK_002: 'failure.code.workStarted',
  WORK_003: 'failure.code.workEnded',
  WORK_004: 'failure.code.workTime',
  WORK_006: 'failure.code.workCodeDuplicate',
  WORK_007: 'failure.code.workCodeParent',
  WORK_008: 'failure.code.workCodeRequired',
  WORK_009: 'failure.code.yearMonth',
  DEPARTMENT_002: 'failure.code.deptExists',
  DEPARTMENT_003: 'failure.code.deptHasMembers',
  DEPARTMENT_004: 'failure.code.deptCompany',
  DEPARTMENT_005: 'failure.code.deptSelf',
  DEPARTMENT_006: 'failure.code.deptCircular',
  // 쓰기에서 SCHEDULE_002 는 끝난 일정을 지우려 할 때뿐이다(수정도 서버가 지운 뒤 다시 만들어 같은 거절) — 기본은 고치기 글, 삭제 확인창은 DELETE_CODE_KEYS
  SCHEDULE_002: 'failure.code.scheduleEnded',
  SCHEDULE_003: 'failure.code.scheduleConflict',
  PERMISSION_003: 'failure.code.roleExists',
  PERMISSION_005: 'failure.code.permissionExists',
  PERMISSION_006: 'failure.code.systemRoleProtected',
  DUES_002: 'failure.code.duesPaid',
  DUES_003: 'failure.code.duesAmount',
  HOLIDAY_002: 'failure.code.holidayExists',
  COMPANY_002: 'failure.code.companyExists',
  INVITATION_002: 'failure.code.invitationExpired',
  AUTH_001: 'failure.code.oauthProvider',
  NOTICE_002: 'failure.code.noticeDate',
  COMMON_401: 'failure.code.dateRange',
  FILE_002: 'failure.code.fileType',
  FILE_003: 'failure.code.fileLarge',
  USER_001: 'failure.code.notFound',
  VACATION_001: 'failure.code.notFound',
  VACATION_007: 'failure.code.notFound',
  VACATION_008: 'failure.code.notFound',
  VACATION_PLAN_001: 'failure.code.notFound',
  VACATION_PLAN_003: 'failure.code.notFound',
  VACATION_PLAN_004: 'failure.code.notFound',
  WORK_001: 'failure.code.notFound',
  WORK_005: 'failure.code.notFound',
  DEPARTMENT_001: 'failure.code.notFound',
  SCHEDULE_001: 'failure.code.notFound',
  PERMISSION_002: 'failure.code.notFound',
  PERMISSION_004: 'failure.code.notFound',
  DUES_001: 'failure.code.notFound',
  HOLIDAY_001: 'failure.code.notFound',
  COMPANY_001: 'failure.code.notFound',
  INVITATION_001: 'failure.code.notFound',
  AUTH_002: 'failure.code.notFound',
  NOTICE_001: 'failure.code.notFound',
  SSO_002: 'failure.code.notFound',
  COMMON_404: 'failure.code.notFound',
  FILE_001: 'failure.code.notFound',
}

/** 삭제 확인창에서만 글을 바꾸는 코드 — 같은 거절이라도 지우는 자리에서는 지우는 말로 한다(confirm-fail.ts) */
export const DELETE_CODE_KEYS: Record<string, string> = {
  SCHEDULE_002: 'failure.code.scheduleEndedDelete',
}

/*
 * 비밀번호 변경이 필요한 로그인(임시 비밀번호)이 허용 목록 밖 API 를 불렀을 때 서버가 403 과 함께 주는 코드
 * (HrErrorCode.PASSWORD_CHANGE_REQUIRED). 권한 부족 403 과 다르다 — 로그인 화면이 아니라 /password-change 로 보낸다.
 */
export const PASSWORD_CHANGE_REQUIRED_CODE = 'AUTH_003'

export const isPasswordChangeRequiredResponse = (status: number | undefined, data: unknown): boolean =>
  status === 403 && (data as { code?: unknown } | undefined)?.code === PASSWORD_CHANGE_REQUIRED_CODE
