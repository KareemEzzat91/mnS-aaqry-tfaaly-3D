import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, CheckCircle2, Clock3, MapPin } from 'lucide-react';
import { useCreateLead, useGetUnit, getGetUnitQueryKey } from '@workspace/api-client-react';
import type { LeadInput } from '@workspace/api-client-react';
import heroImage from '../assets/vivid-residences.jpg';
import { usePageMetadata } from '@/hooks/use-page-metadata';

export default function VisitPage() {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unitQuery = useGetUnit(unitId, { query: { enabled: !!unitId, queryKey: getGetUnitQueryKey(unitId) } });
  const lead = useCreateLead();
  usePageMetadata('Request a private visit — VIVID City', 'Request a private visit to an illustrative VIVID City home in New Cairo.');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    if (!consent) {
      setLocalError('Please confirm that our sales team may contact you.');
      return;
    }
    const data: LeadInput = {
      name: name.trim(),
      phone: phone.trim(),
      ...(email.trim() ? { email: email.trim() } : {}),
      unitId,
      ...(message.trim() ? { message: message.trim() } : {}),
      consent: true,
    };
    lead.mutate({ data });
  };

  const confirmation = lead.data;
  return <main className="subpage arabic" dir="rtl">
    <header className="shell topbar">
      <Link href="/" className="brand" data-testid="link-home"><span className="brand-mark">V</span><span className="brand-name">VIVID</span></Link>
      <nav className="nav-links"><Link href="/">الحي السكني</Link><Link href={`/unit/${unitId}`}>المنزل {unitId}</Link></nav>
      <span className="eyebrow">زيارات خاصة · القاهرة الجديدة</span>
    </header>
    <div className="visit-main">
      <aside className="visit-art">
        <img src={heroImage} alt="VIVID homes among landscaped gardens" />
        <div className="visit-art-copy"><div className="eyebrow" style={{ color: '#e2decf' }}>اكتشف المكان عن قرب</div><h2 className="serif">تعال واكتشف<br />إحساس المكان.</h2><div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 7 }}><MapPin size={13} /> VIVID City · القاهرة الجديدة</div></div>
      </aside>
      <section className="visit-form-area" aria-live="polite">
        {confirmation ? <div className="confirmation fade-up">
          <div className="confirmation-mark"><Check size={23} /></div>
          <div className="eyebrow">تم استلام طلبك · {confirmation.id}</div>
          <h1 className="serif">سنتواصل معك قريباً.</h1>
          <p>شكراً لك {name}. سيتواصل معك مستشار المبيعات لترتيب زيارة خاصة للمنزل {unitId}.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: 'hsl(var(--muted-foreground))', fontSize: 11, margin: '22px 0 29px' }}><Clock3 size={14} /> عادةً خلال يوم عمل واحد</div>
          <Link href={`/unit/${unitId}`} className="button" data-testid="link-back-unit">العودة إلى تفاصيل المنزل <ArrowLeft size={14} /></Link>
        </div> : unitQuery.isLoading ? <div className="confirmation"><div className="skeleton" style={{ height: 220 }} /></div>
          : unitQuery.isError || !unitQuery.data ? <div className="confirmation" role="alert"><div className="eyebrow">تفاصيل المنزل</div><h1 className="serif">لم نتمكن من العثور على هذا المنزل.</h1><p>قد يكون الرابط غير صحيح أو المنزل لم يعد متاحاً.</p><Link href="/" className="button">العودة إلى VIVID City <ArrowLeft size={14} /></Link></div>
          : unitQuery.data.status !== 'available' ? <div className="confirmation fade-up" role="alert">
            <div className="eyebrow">حالة المنزل</div>
            <h1 className="serif">هذا المنزل لم يعد متاحاً للزيارة.</h1>
            <p>حالة المنزل الحالية: {unitQuery.data.status}. يمكنك العودة لاستكشاف بقية المساكن المتاحة.</p>
            <Link href="/" className="button">استكشف المساكن المتاحة <ArrowLeft size={14} /></Link>
          </div> : <div className="fade-up">
          <div className="eyebrow">VIVID CITY &nbsp; / &nbsp; دعوة خاصة</div>
          <h1 className="serif">لنحدد موعداً<br />لجولة في المكان.</h1>
          <p className="form-intro">أرسل بياناتك وسيتواصل معك فريق المبيعات لترتيب زيارتك والإجابة عن أسئلتك والتعريف بالمشروع.</p>
          <div style={{ borderBlock: '1px solid hsl(var(--border))', padding: '13px 0', marginBottom: 21, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div><div className="eyebrow">المنزل المختار</div><div style={{ fontSize: 13, marginTop: 5 }}>Home {unitId}{unitQuery.data ? ` · ${unitQuery.data.bedrooms} bedrooms · ${unitQuery.data.areaM2} m²` : ''}</div></div>
            {unitQuery.data && <Link href={`/unit/${unitId}`} className="text-link" style={{ padding: 0 }}>التفاصيل <ArrowLeft size={12} /></Link>}
          </div>
          <form onSubmit={submit}>
            <div className="field"><label htmlFor="visitor-name">الاسم الكامل *</label><input id="visitor-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} autoComplete="name" required placeholder="اسمك" data-testid="input-name" /></div>
            <div className="field"><label htmlFor="visitor-phone">رقم الهاتف *</label><input id="visitor-phone" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={7} maxLength={32} autoComplete="tel" type="tel" required placeholder="+20 10 XXX XXXX" data-testid="input-phone" /></div>
            <div className="field"><label htmlFor="visitor-email">البريد الإلكتروني <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(اختياري)</span></label><input id="visitor-email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" type="email" placeholder="name@example.com" data-testid="input-email" /></div>
            <div className="field"><label htmlFor="visitor-message">هل هناك ما تود إخبارنا به؟ <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(اختياري)</span></label><textarea id="visitor-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder="الوقت المناسب أو أي استفسار…" data-testid="input-message" /></div>
            <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} data-testid="input-consent" /><span>أوافق على تواصل فريق مبيعات VIVID City معي بخصوص هذا المنزل وترتيب زيارة.</span></label>
            {(localError || lead.isError) && <div role="alert" className="error-message">{localError || 'تعذر إرسال طلبك. يرجى مراجعة البيانات والمحاولة مرة أخرى.'}</div>}
            <button className="button" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={lead.isPending} data-testid="button-submit-lead">{lead.isPending ? 'جارٍ إرسال الطلب…' : 'اطلب زيارة خاصة'} {lead.isPending ? null : <ArrowLeft size={14} />}</button>
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10, textAlign: 'center', marginTop: 12 }}>تُستخدم بياناتك للتواصل معك بخصوص هذا الطلب فقط.</div>
          </form>
        </div>}
      </section>
    </div>
    <footer className="shell footer"><span>© VIVID CITY · NEW CAIRO</span><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><CheckCircle2 size={13} /> تجربة خاصة وشخصية</span></footer>
  </main>;
}
