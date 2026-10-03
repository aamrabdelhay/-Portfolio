import React, {useState} from 'react';
import {Search, Plus, Pencil, Trash2, Shield, GraduationCap, Download, X, UserRound} from 'lucide-react';
import {GOVERNORATES, isValidEgyptianPhone} from '../server/validation.js';
import {UNIVERSITIES, listFaculties, listDepartments, STUDENT_YEARS} from '../server/academics.js';

export const SUPERVISOR_ROLES = [
  {id: 'colonel', label: 'عقيد'},
  {id: 'major', label: 'مقدم'},
  {id: 'doctor', label: 'دكتور'},
  {id: 'student', label: 'طالب إشراف'}
];

export const ROLE_LABEL = Object.fromEntries(SUPERVISOR_ROLES.map(r => [r.id, r.label]));

const emptyForm = {
  role: 'doctor',
  fullName: '',
  nationalId: '',
  phone: '',
  address: '',
  buildingNumber: '',
  birthDate: '',
  governorate: '',
  gender: '',
  height: '',
  university: '',
  faculty: '',
  department: '',
  year: ''
};

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api' + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: 'Bearer ' + token} : {}),
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(data.message || 'حدث خطأ غير متوقع');
  return data;
}

async function downloadExcel(pathname, fallback) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api' + pathname, {headers: {Authorization: 'Bearer ' + token}});
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Error(data.message || 'تعذر تنزيل Excel');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^;\"]+)/i);
  const filename = match ? decodeURIComponent(match[1].replace(/\"/g, '')) : fallback;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Field({label, value, onChange, type = 'text', required, children, ...rest}) {
  return (
    <label className="field">
      <span>{label}{required && <i className="req-dot" title="إجباري"/>}</span>
      {children || <input type={type} value={value} onChange={e => onChange(e.target.value)} {...rest}/>}
    </label>
  );
}

function SelectField({label, value, onChange, children, required, ...rest}) {
  return (
    <label className="field">
      <span>{label}{required && <i className="req-dot" title="إجباري"/>}</span>
      <select value={value} onChange={e => onChange(e.target.value)} {...rest}>{children}</select>
    </label>
  );
}

export function supervisorIdsFromVisit(visit) {
  const list = visit?.supervisors || [];
  return {
    colonelId: list.find(s => s.role === 'colonel')?.id || '',
    majorId: list.find(s => s.role === 'major')?.id || '',
    doctorIds: list.filter(s => s.role === 'doctor').map(s => s.id),
    studentIds: list.filter(s => s.role === 'student').map(s => s.id)
  };
}

export function buildSupervisorIds(form) {
  return [form.colonelId, form.majorId, ...(form.doctorIds || []), ...(form.studentIds || [])].filter(Boolean);
}

export function SupervisorPicker({supervisors = [], form, setForm}) {
  const officers = supervisors.filter(s => s.role === 'colonel' || s.role === 'major');
  const doctors = supervisors.filter(s => s.role === 'doctor');
  const students = supervisors.filter(s => s.role === 'student');
  const toggle = (key, id) => {
    const current = form[key] || [];
    setForm({...form, [key]: current.includes(id) ? current.filter(x => x !== id) : [...current, id]});
  };
  return (
    <div className="supervisor-pick">
      <b>قائمة الإشراف على الزيارة (اختياري)</b>
      <small>العقيد والمقدم لا يُحتسبان في العدد. الدكاترة وطلاب الإشراف يظهرون في الكشف قبل الطلاب المسجلين.</small>
      <div className="form-grid">
        <SelectField label="العقيد" value={form.colonelId || ''} onChange={v => setForm({...form, colonelId: v})}>
          <option value="">بدون عقيد</option>
          {officers.filter(s => s.role === 'colonel').map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </SelectField>
        <SelectField label="المقدم" value={form.majorId || ''} onChange={v => setForm({...form, majorId: v})}>
          <option value="">بدون مقدم</option>
          {officers.filter(s => s.role === 'major').map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </SelectField>
      </div>
      <div className="supervisor-multi">
        <div>
          <b>الدكاترة</b>
          {doctors.length === 0 ? <p className="form-hint">لا يوجد دكاترة في قائمة المشرفين بعد.</p> : doctors.map(s => (
            <label key={s.id} className="check compact-check">
              <input type="checkbox" checked={(form.doctorIds || []).includes(s.id)} onChange={() => toggle('doctorIds', s.id)}/>
              <span>{s.fullName}<small>{s.phone}</small></span>
            </label>
          ))}
        </div>
        <div>
          <b>طلاب الإشراف</b>
          {students.length === 0 ? <p className="form-hint">لا يوجد طلاب إشراف في القائمة بعد.</p> : students.map(s => (
            <label key={s.id} className="check compact-check">
              <input type="checkbox" checked={(form.studentIds || []).includes(s.id)} onChange={() => toggle('studentIds', s.id)}/>
              <span>{s.fullName}<small>{s.phone}</small></span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VisitSupervisorsBlock({supervisors = []}) {
  const officers = supervisors.filter(s => s.role === 'colonel' || s.role === 'major');
  const doctors = supervisors.filter(s => s.role === 'doctor');
  const students = supervisors.filter(s => s.role === 'student');
  if (!officers.length && !doctors.length && !students.length) return null;
  return (
    <div className="visit-supervisors">
      {officers.length > 0 && (
        <div className="officer-banner">
          {officers.map(s => (
            <span key={s.id} className={'role-badge ' + s.role}>{ROLE_LABEL[s.role]}: {s.fullName}</span>
          ))}
          <small>لا يُحتسبان في العدد</small>
        </div>
      )}
      {(doctors.length > 0 || students.length > 0) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>الصفة</th><th>الاسم</th><th>الرقم القومي</th><th>التليفون</th><th>الجامعة / الكلية</th></tr>
            </thead>
            <tbody>
              {doctors.map(s => (
                <tr key={s.id}>
                  <td><span className="role-badge doctor">دكتور</span></td>
                  <td><b>{s.fullName}</b></td>
                  <td>{s.nationalId}</td>
                  <td>{s.phone}</td>
                  <td>{[s.university, s.faculty].filter(Boolean).join(' — ') || '—'}</td>
                </tr>
              ))}
              {students.map(s => (
                <tr key={s.id}>
                  <td><span className="role-badge student">طالب إشراف</span></td>
                  <td><b>{s.fullName}</b></td>
                  <td>{s.nationalId}</td>
                  <td>{s.phone}</td>
                  <td>{[s.university, s.faculty].filter(Boolean).join(' — ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SupervisorForm({initial, onSave, onClose}) {
  const [form, setForm] = useState({...emptyForm, ...initial, height: initial?.height ?? ''});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const needsAcademics = form.role === 'student';
  // العقيد والمقدم والدكتور: مفيش أي حقل إجباري — الطالب بس هو اللي لازم يكمل كل البيانات
  const req = needsAcademics;
  const submit = async e => {
    e.preventDefault();
    // التحقق من البيانات فقط لو طالب إشراف — العقيد والمقدم والدكتور يكتبوا اللي عايزينه
    if (needsAcademics) {
      if (!form.fullName.trim()) return setErr('برجاء إدخال الاسم رباعي');
      if (!/^\d{14}$/.test(String(form.nationalId || '').replace(/\D/g, ''))) return setErr('الرقم القومي يجب أن يتكون من 14 رقماً');
      if (!isValidEgyptianPhone(form.phone)) return setErr('رقم الهاتف غير صحيح. أدخل رقماً مصرياً يبدأ بـ 010 أو 011 أو 012 أو 015');
      if (!form.governorate) return setErr('برجاء اختيار المحافظة من القائمة');
      if (!form.gender) return setErr('برجاء اختيار النوع (ولد/بنت)');
      if (!form.address.trim()) return setErr('برجاء إدخال العنوان');
      if (!form.birthDate) return setErr('برجاء إدخال تاريخ الميلاد');
      const height = Number(form.height);
      if (!form.height || !Number.isFinite(height) || height < 80 || height > 250) return setErr('الطول غير صحيح. أدخل الطول بالسنتيمتر (بين 80 و 250 سم)');
      if (!form.university || !form.faculty || !form.department || !form.year) {
        return setErr('برجاء استكمال البيانات الجامعية لطالب الإشراف');
      }
    }
    setSaving(true);
    setErr('');
    try {
      const height = form.height ? Number(form.height) : null;
      await onSave({...form, nationalId: String(form.nationalId || '').replace(/\D/g, ''), height});
      onClose();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card supervisor-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{initial?.id ? 'تعديل بيانات المشرف' : 'إضافة مشرف'}</h3>
            <p>{needsAcademics ? 'نفس بيانات الطالب: الرقم القومي، التليفون، العنوان، والنوع.' : 'البيانات اختيارية — اكتب اللي تحتاجه بس.'}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق"><X/></button>
        </div>
        <form onSubmit={submit}>
          {err && <div className="error">{err}</div>}
          <div className="form-grid">
            <SelectField label="الصفة" value={form.role} onChange={v => setForm({...form, role: v})} required>
              {SUPERVISOR_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </SelectField>
            <Field label="الاسم رباعي" value={form.fullName} onChange={v => setForm({...form, fullName: v})} required={req}/>
            <Field label="الرقم القومي" maxLength="14" value={form.nationalId} onChange={v => setForm({...form, nationalId: v.replace(/\D/g, '')})} required={req}/>
            <Field label="رقم الهاتف" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="01xxxxxxxxx" inputMode="tel" maxLength="15" required={req}/>
            <Field label="تاريخ الميلاد" type="date" value={form.birthDate} onChange={v => setForm({...form, birthDate: v})} required={req}/>
            <SelectField label="النوع" value={form.gender} onChange={v => setForm({...form, gender: v})} required={req}>
              <option value="">اختر النوع</option>
              <option value="male">ولد</option>
              <option value="female">بنت</option>
            </SelectField>
            <Field label="الطول (سم)" type="number" value={form.height} onChange={v => setForm({...form, height: v})} min="80" max="250" inputMode="numeric" required={req}/>
            <SelectField label="المحافظة" value={form.governorate} onChange={v => setForm({...form, governorate: v})} required={req}>
              <option value="">اختر المحافظة</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </SelectField>
            <Field label="العنوان بالتفصيل" value={form.address} onChange={v => setForm({...form, address: v})} required={req}/>
            <Field label="رقم العمارة (اختياري)" value={form.buildingNumber} onChange={v => setForm({...form, buildingNumber: v})}/>
            <SelectField label="الجامعة" value={form.university} onChange={v => setForm({...form, university: v, faculty: '', department: ''})} required={req}>
              <option value="">اختر الجامعة</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </SelectField>
            <SelectField label="الكلية" value={form.faculty} onChange={v => setForm({...form, faculty: v, department: ''})} required={req}>
              <option value="">{form.university ? 'اختر الكلية' : 'اختر الجامعة أولاً'}</option>
              {listFaculties(form.university).map(f => <option key={f} value={f}>{f}</option>)}
            </SelectField>
            <SelectField label="القسم" value={form.department} onChange={v => setForm({...form, department: v})} required={req}>
              <option value="">{form.faculty ? 'اختر القسم' : 'اختر الكلية أولاً'}</option>
              {listDepartments(form.university, form.faculty).map(d => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <SelectField label="الفرقة" value={form.year} onChange={v => setForm({...form, year: v})} required={req}>
              <option value="">اختر الفرقة</option>
              {STUDENT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </SelectField>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-muted" onClick={onClose}>إلغاء</button>
            <button className="btn" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ المشرف'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupervisorsPanel({supervisors = [], visits = [], onChange, onMsg}) {
  const [tab, setTab] = useState('officers');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const q = search.trim();
  const match = s => !q || (s.fullName + s.nationalId + s.phone + (ROLE_LABEL[s.role] || '')).includes(q);
  const groups = {
    officers: supervisors.filter(s => (s.role === 'colonel' || s.role === 'major') && match(s)),
    doctors: supervisors.filter(s => s.role === 'doctor' && match(s)),
    students: supervisors.filter(s => s.role === 'student' && match(s))
  };
  const list = groups[tab] || [];
  const visitNames = s => visits.filter(v => (v.supervisors || []).some(x => x.id === s.id)).map(v => v.title);
  const save = async payload => {
    if (editing?.id) await request('/admin/supervisors/' + editing.id, {method: 'PATCH', body: JSON.stringify(payload)});
    else await request('/admin/supervisors', {method: 'POST', body: JSON.stringify(payload)});
    onMsg?.(editing?.id ? 'تم تحديث بيانات المشرف' : 'تم إضافة المشرف');
    onChange?.();
  };
  const remove = async s => {
    if (!confirm('حذف هذا المشرف من القائمة؟ سيُزال أيضاً من أي زيارة مرتبط بها.')) return;
    try {
      await request('/admin/supervisors/' + s.id, {method: 'DELETE'});
      onMsg?.('تم حذف المشرف');
      onChange?.();
    } catch (e) {
      onMsg?.(e.message);
    }
  };
  const exportSheet = async () => {
    try {
      await downloadExcel('/admin/supervisors/export', 'supervisors.xlsx');
      onMsg?.('تم تنزيل Excel المشرفين');
    } catch (e) {
      onMsg?.(e.message);
    }
  };
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>المشرفين على الزيارات</h2>
          <small>سجل مستقل للعقيد والمقدم والدكاترة وطلاب الإشراف. اختيارهم على الزيارة اختياري.</small>
        </div>
        <span>{supervisors.length} مشرف</span>
      </div>
      <div className="filter-tabs">
        <button className={tab === 'officers' ? 'active' : ''} onClick={() => setTab('officers')}>عقيد ومقدم<i>{groups.officers.length}</i></button>
        <button className={tab === 'doctors' ? 'active' : ''} onClick={() => setTab('doctors')}>دكاترة<i>{groups.doctors.length}</i></button>
        <button className={tab === 'students' ? 'active' : ''} onClick={() => setTab('students')}>طلاب إشراف<i>{groups.students.length}</i></button>
      </div>
      <div className="toolbar">
        <div className="search"><Search/><input placeholder="ابحث بالاسم أو الرقم القومي أو التليفون" value={search} onChange={e => setSearch(e.target.value)}/></div>
        <div className="row-actions">
          <button className="btn btn-small export-btn" onClick={exportSheet}><Download size={15}/> Excel المشرفين</button>
          <button className="btn btn-small" onClick={() => { setEditing(null); setCreating(true); }}><Plus size={15}/> إضافة مشرف</button>
        </div>
        <span>{list.length} في هذا القسم</span>
      </div>
      {list.length === 0 ? (
        <div className="empty">
          {tab === 'students' ? <GraduationCap/> : tab === 'doctors' ? <UserRound/> : <Shield/>}
          <b>{supervisors.length && q ? 'لا توجد نتيجة للبحث' : 'لا يوجد مشرفون في هذا القسم بعد'}</b>
          <p>أضف المشرف ببياناته كاملة، ثم يمكنك اختياره اختيارياً عند إنشاء أو تعديل أي زيارة.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الصفة</th>
                <th>المشرف</th>
                <th>التواصل</th>
                <th>العنوان</th>
                <th>الجامعة</th>
                <th>الزيارات</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => {
                const assigned = visitNames(s);
                return (
                  <tr key={s.id}>
                    <td><span className={'role-badge ' + s.role}>{ROLE_LABEL[s.role]}</span></td>
                    <td>
                      <b>{s.fullName}</b>
                      <small>{s.nationalId}</small>
                      <small>{s.gender === 'female' ? 'بنت' : s.gender === 'male' ? 'ولد' : ''}{s.height ? ` · ${s.height} سم` : ''}</small>
                    </td>
                    <td>{s.phone}</td>
                    <td>{s.address}{s.buildingNumber ? `، عمارة ${s.buildingNumber}` : ''}{s.governorate ? ` — ${s.governorate}` : ''}</td>
                    <td>{s.university ? `${s.university} — ${s.faculty || ''}` : '—'}{s.department ? <small>{s.department} — {s.year}</small> : null}</td>
                    <td>{assigned.length ? assigned.map(title => <small key={title}>{title}</small>) : <span className="muted-cell">غير معيَّن على زيارة</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-small" onClick={() => { setCreating(false); setEditing(s); }}><Pencil size={14}/> تعديل</button>
                        <button className="btn btn-small btn-danger" onClick={() => remove(s)}><Trash2 size={14}/> حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(creating || editing) && (
        <SupervisorForm
          initial={editing || undefined}
          onSave={save}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </section>
  );
}
