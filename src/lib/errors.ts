export class AppError extends Error {
  readonly userMessage: string;
  readonly code?: string;

  constructor(userMessage: string, code?: string) {
    super(userMessage);
    this.name = 'AppError';
    this.userMessage = userMessage;
    this.code = code;
  }
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

const NETWORK_RE = /failed to fetch|networkerror|load failed|network request failed|fetch failed/i;

/** แปลง error ใดๆ เป็นข้อความที่ผู้ใช้เข้าใจ โดยไม่เปิดเผยรายละเอียดภายในระบบ */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const e: ErrorLike = typeof err === 'object' && err !== null ? (err as ErrorLike) : { message: String(err) };
  const message = e.message ?? '';
  const code = e.code ?? '';

  if (import.meta.env?.DEV && import.meta.env.MODE !== 'test') console.error('[app-error]', err);

  if (NETWORK_RE.test(message) || e.name === 'AuthRetryableFetchError') {
    return new AppError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง', 'NETWORK');
  }
  if (/jwt expired/i.test(message) || code === 'PGRST301' || code === 'session_expired' || code === 'session_not_found') {
    return new AppError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'SESSION');
  }

  switch (code) {
    case '42501':
      return new AppError('คุณไม่มีสิทธิ์ดำเนินการนี้', 'FORBIDDEN');
    case '23505':
      return new AppError('มีข้อมูลชื่อนี้อยู่แล้ว', 'DUPLICATE');
    case '23503':
      return new AppError('ข้อมูลที่อ้างอิงไม่มีอยู่หรือคุณไม่มีสิทธิ์ใช้งาน', 'REFERENCE');
    case '23514':
    case '22001':
    case '22P02':
      return new AppError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'INVALID');
    case 'PGRST116':
      return new AppError('ไม่พบข้อมูลที่ต้องการ', 'NOT_FOUND');
    case 'invalid_credentials':
      return new AppError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', code);
    case 'email_not_confirmed':
      return new AppError('ยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมายของคุณ', code);
    case 'weak_password':
      return new AppError('รหัสผ่านคาดเดาง่ายเกินไป กรุณาใช้รหัสผ่านที่ซับซ้อนขึ้น', code);
    case 'same_password':
      return new AppError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม', code);
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new AppError('ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', 'RATE_LIMIT');
    default:
      break;
  }

  if (e.status === 429) return new AppError('ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', 'RATE_LIMIT');
  if (e.status === 401) return new AppError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'SESSION');
  if (e.status === 403) return new AppError('คุณไม่มีสิทธิ์ดำเนินการนี้', 'FORBIDDEN');

  return new AppError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง', 'UNKNOWN');
}
