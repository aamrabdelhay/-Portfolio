export const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحر الأحمر',
  'البحيرة',
  'الفيوم',
  'الغربية',
  'الإسماعيلية',
  'المنوفية',
  'المنيا',
  'القليوبية',
  'الوادي الجديد',
  'السويس',
  'أسوان',
  'أسيوط',
  'بني سويف',
  'بورسعيد',
  'دمياط',
  'الشرقية',
  'جنوب سيناء',
  'كفر الشيخ',
  'مطروح',
  'الأقصر',
  'قنا',
  'شمال سيناء',
  'سوهاج'
];

export function normalizeEgyptianPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(4);
  else if (digits.startsWith('20') && (digits.length === 12 || digits.length === 11)) digits = digits.slice(2);
  if (digits.startsWith('1') && digits.length === 10) digits = '0' + digits;
  return digits;
}

export function isValidEgyptianPhone(phone) {
  return /^01[0125]\d{8}$/.test(normalizeEgyptianPhone(phone));
}

export function toWhatsAppNumber(phone) {
  const normalized = normalizeEgyptianPhone(phone);
  return normalized.startsWith('0') ? `20${normalized.slice(1)}` : `20${normalized}`;
}

export function isValidGovernorate(governorate) {
  return GOVERNORATES.includes(String(governorate || '').trim());
}

// Gender is stored as 'male' / 'female' (ولد / بنت) so the administration
// rosters (كشف الولاد / كشف البنات) and stats can filter on it.
export function isValidGender(gender) {
  return gender === 'male' || gender === 'female';
}

// Height is collected in centimetres; the plausible student range keeps
// mistyped values (metres, ages, stray characters) out of the rosters.
export function normalizeHeight(height) {
  const value = Math.round(Number(height));
  return Number.isFinite(Number(height)) && value >= 80 && value <= 250 ? value : null;
}

// A visit photo may be supplied as a public http(s) URL instead of an upload
// (zero storage: the image is referenced by link, never stored as a Blob).
//   - empty / absent  -> null (the caller applies its own default)
//   - valid http(s)   -> the trimmed URL, stored verbatim
//   - anything else   -> throws, so javascript:, data:, relative paths, etc.
//                        can never be saved as a visit image.
export function resolveImageUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) throw Error('رابط صورة الزيارة يجب أن يبدأ بـ http:// أو https://');
  return url;
}

// Interviews and visits are always scheduled ahead of time — never in the
// past. Shared by the JSON and Postgres repositories so both enforce the same
// rule regardless of the storage backend.
export function assertFutureDateTime(date, time, label = 'الموعد') {
  const when = new Date(`${date}T${time}`);
  if (Number.isNaN(+when) || when <= new Date()) throw Error(`${label} يجب أن يكون في المستقبل`);
}

export function assertFutureTimestamp(value, label = 'الموعد') {
  const when = new Date(String(value || ''));
  if (Number.isNaN(+when) || when <= new Date()) throw Error(`${label} يجب أن يكون في المستقبل`);
  return when;
}

export function validateInterview(interview, {requireFuture = false} = {}) {
  if (!interview || typeof interview !== 'object') throw Error('بيانات الموعد غير صالحة');
  const date = String(interview.date || '').trim();
  let time = String(interview.time || '').trim();
  const location = String(interview.location || '').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) time = time.slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('تاريخ المقابلة غير صالح');
  if (!/^\d{2}:\d{2}$/.test(time)) throw Error('وقت المقابلة غير صالح');
  if (location.length < 2) throw Error('برجاء تحديد مكان المقابلة');
  if (location.length > 200) throw Error('مكان المقابلة أطول من المسموح');
  if (requireFuture) assertFutureDateTime(date, time, 'موعد المقابلة');
  return {date, time, location};
}

// تاريخ اليوم بتوقيت مصر (YYYY-MM-DD): تُقارن به تواريخ الزيارات لتحديد
// الزيارات المنتهية التي تنتقل تلقائياً إلى سجل الزيارات على الصفحة الرئيسية.
export function egyptToday() {
  return new Date().toLocaleDateString('en-CA', {timeZone: 'Africa/Cairo'});
}

// الزيارات القديمة (سجل الزيارات): تُضاف من غرفة الإدارة بتاريخ ماضٍ، الوقت
// اختياري، وعدد الطلاب رقم صحيح فقط. مشتركة بين مستودعي JSON و Postgres.
export function validateHistoricalVisit(body = {}) {
  const title = String(body.title || '').trim();
  if (!title) throw Error('برجاء إدخال اسم الزيارة');
  if (title.length > 200) throw Error('اسم الزيارة أطول من المسموح');
  const date = String(body.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(+new Date(date + 'T00:00:00'))) throw Error('تاريخ الزيارة غير صالح');
  if (date > egyptToday()) throw Error('الزيارة القديمة يجب أن يكون تاريخها في الماضي');
  let time = String(body.time || '').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) time = time.slice(0, 5);
  if (time && !/^\d{2}:\d{2}$/.test(time)) throw Error('وقت الزيارة غير صالح');
  let studentsCount = null;
  if (body.studentsCount !== undefined && body.studentsCount !== null && String(body.studentsCount).trim() !== '') {
    const n = Number(String(body.studentsCount).trim());
    if (!Number.isInteger(n) || n < 0 || n > 1000000) throw Error('عدد الطلاب يجب أن يكون رقماً صحيحاً فقط');
    studentsCount = n;
  }
  const description = String(body.description || '').trim();
  if (description.length > 2000) throw Error('وصف الزيارة أطول من المسموح');
  return {title, description, date, time, studentsCount};
}

export function hasInterview(user) {
  return Boolean(user?.interview?.date && user?.interview?.time && user?.interview?.location);
}

export function acceptWhatsAppMessage(user) {
  const name = String(user?.fullName || 'الطالب').trim();
  return `مرحباً ${name}، نفيدكم بأنه تم قبولكم في برنامج الزيارات العسكرية بجامعة العاصمة. سيتم إضافتكم إلى جروب الزيارات العسكرية لمتابعة المواعيد والتعليمات.`;
}

export function acceptWhatsAppUrl(user) {
  return `https://wa.me/${toWhatsAppNumber(user.phone)}?text=${encodeURIComponent(acceptWhatsAppMessage(user))}`;
}
