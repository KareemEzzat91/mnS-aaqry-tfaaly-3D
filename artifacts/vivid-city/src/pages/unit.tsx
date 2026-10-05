import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowUpRight, Check, Copy, MapPin, QrCode, RotateCcw, RotateCw, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getGetUnitQueryKey, useGetUnit } from '@workspace/api-client-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';

function money(price: number, currency: string) {
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(price)} ${currency}`;
}

export default function UnitPage() {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const { data: unit, isLoading, isError, refetch } = useGetUnit(unitId, { query: { enabled: !!unitId, queryKey: getGetUnitQueryKey(unitId) } });
  const [view, setView] = useState<'plan' | 'volume'>('plan');
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const qrTriggerRef = useRef<HTMLButtonElement>(null);
  const qrCloseRef = useRef<HTMLButtonElement>(null);
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
  usePageMetadata(`Home ${unitId} — VIVID City`, `Explore illustrative details and availability for home ${unitId} in the VIVID City sample development.`);
  useEffect(() => {
    if (!qrOpen) return;
    qrCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQrOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [qrOpen]);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <main className="subpage arabic" dir="rtl">
    <header className="shell topbar">
      <Link href="/" className="brand" data-testid="link-home"><span className="brand-mark">V</span><span className="brand-name">VIVID</span></Link>
      <nav className="nav-links"><Link href="/">الحي السكني</Link><a href="/#explore">استكشف المنازل</a></nav>
      <Link href={`/visit/${unitId}`} className="button small" data-testid="button-book-visit">اطلب زيارة <ArrowUpRight size={14} /></Link>
    </header>
    <section className="shell unit-main">
      <div className="breadcrumbs"><Link href="/">VIVID City</Link><span>/</span><a href="/#explore">المساكن</a><span>/</span><span>{unitId || 'Home'}</span></div>
      {isLoading && <div className="unit-layout" aria-label="Loading home details"><div><div className="skeleton" style={{ height: 24, width: 170 }} /><div className="skeleton" style={{ height: 70, marginTop: 18, width: 310 }} /><div className="skeleton" style={{ height: 150, marginTop: 28 }} /></div><div className="skeleton" style={{ height: 440 }} /></div>}
      {isError && <div className="confirmation"><div className="eyebrow">تفاصيل المنزل</div><h1>لم نتمكن من العثور على هذا المنزل.</h1><p>ربما تغير الرابط أو لم يعد هذا المنزل متاحاً.</p><button className="button" onClick={() => void refetch()}>حاول مرة أخرى</button> <Link href="/" className="button secondary">العودة إلى VIVID</Link></div>}
      {unit && <>
        <div className="unit-layout fade-up">
          <div>
            <div className="eyebrow">RESIDENCE &nbsp; / &nbsp; {unit.buildingId}</div>
            <h1 className="unit-title serif">Home {unit.id}</h1>
            <div className="unit-subtitle"><MapPin size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} /> VIVID City · القاهرة الجديدة</div>
            <div className="unit-info">
              <div className="info-cell"><strong>{unit.bedrooms}</strong><span>BEDROOMS</span></div>
              <div className="info-cell"><strong>{unit.bathrooms}</strong><span>BATHROOMS</span></div>
              <div className="info-cell"><strong>{unit.areaM2} m²</strong><span>INTERIOR AREA</span></div>
            </div>
            <div className="eyebrow">INDICATIVE PRICE</div><div className="unit-price">{money(unit.price, unit.currency)}</div>
            <p className="detail-description">مسكن مضيء بتوزيع مدروس وإطلالة رحبة على {unit.view}. يجمع التصميم بين الخصوصية ومساحة معيشة مفتوحة ترحب بك.</p>
            <div className="unit-actions">
              {unit.status === 'available' ? <Link href={`/visit/${unit.id}`} className="button" data-testid="button-request-visit">رتب زيارة خاصة <ArrowLeft size={14} /></Link> : <span className="button secondary" aria-label={`Home is ${unit.status}`}>{unit.status}</span>}
              <button className="button secondary" onClick={() => void share()} data-testid="button-share-unit">{copied ? <Check size={14} /> : <Share2 size={14} />}{copied ? 'تم نسخ الرابط' : 'شارك المنزل'} <Copy size={13} /></button>
              <button ref={qrTriggerRef} className="button secondary" onClick={() => setQrOpen(true)} data-testid="button-show-qr"><QrCode size={14} /> رمز QR</button>
            </div>
          </div>
          <div>
            <div className="plan-wrap" aria-label={view === 'plan' ? 'Illustrative floor plan' : 'Illustrative three dimensional home view'}>
              <div className="plan-tabs" role="tablist" aria-label="Home visualisation">
                <button className={`plan-tab${view === 'plan' ? ' active' : ''}`} onClick={() => setView('plan')} role="tab" aria-selected={view === 'plan'} data-testid="tab-floor-plan">Floor plan</button>
                <button className={`plan-tab${view === 'volume' ? ' active' : ''}`} onClick={() => setView('volume')} role="tab" aria-selected={view === 'volume'} data-testid="tab-3d-view">3D view</button>
              </div>
              <div className="floorplan">
                 {view === 'plan' ? <svg viewBox="0 0 440 300" role="img" aria-label={`${unit.bedrooms} bedroom illustrative plan`}>
                  <rect x="38" y="28" width="360" height="238" className="room" />
                  <rect x="40" y="30" width="208" height="140" className="room-soft" />
                  <rect x="250" y="30" width="146" height="83" className="room" />
                  <rect x="250" y="116" width="146" height="82" className="room" />
                  <rect x="40" y="173" width="95" height="91" className="room" />
                  <rect x="138" y="173" width="113" height="91" className="room-soft" />
                  <rect x="254" y="201" width="142" height="63" className="room-soft" />
                  <path d="M248 28v142M135 173v91M251 198h147" stroke="#728073" strokeWidth="2" fill="none" />
                  <path d="M104 28v7M180 28v7M310 28v7M398 70h-7M398 153h-7M80 266v-7M192 266v-7" stroke="#9c8967" strokeWidth="3" />
                  <text x="95" y="105" className="plan-label">LIVING / DINING</text><text x="286" y="72" className="plan-label">BEDROOM 01</text>
                  <text x="286" y="158" className="plan-label">BEDROOM 02</text><text x="61" y="224" className="plan-label">KITCHEN</text>
                  <text x="164" y="221" className="plan-label">ENTRY</text><text x="294" y="236" className="plan-label">TERRACE</text>
                  <text x="184" y="18" className="plan-dim">{unit.areaM2} m² · INDICATIVE LAYOUT</text>
                  <path d="M50 44h22M50 44v20M386 246h-22M386 246v-20" stroke="#aa9775" strokeWidth="1" fill="none" />
                 </svg> : <svg viewBox="0 0 440 300" role="img" aria-label="Three dimensional massing illustration" style={{ transform: `perspective(900px) rotateY(${rotation}deg) rotateX(7deg)`, transition: 'transform 400ms ease' }}>
                  <defs><linearGradient id="stone" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f4f0e5"/><stop offset="1" stopColor="#b9b69e"/></linearGradient></defs>
                  <path d="M67 118 224 42l153 64-151 83z" fill="#e8e2d2" stroke="#778273" strokeWidth="2"/>
                  <path d="M67 118v103l159 66V189z" fill="url(#stone)" stroke="#778273" strokeWidth="2"/>
                  <path d="M226 189v98l151-72v-105z" fill="#b2b39f" stroke="#778273" strokeWidth="2"/>
                  <path d="m67 221 159-71 151 60-151 72z" fill="#d9ddce" stroke="#778273" strokeWidth="2"/>
                  <path d="m226 189 151-72M226 216l151-72M226 244l151-72" stroke="#899384" strokeWidth="2"/>
                  <path d="m100 133 24 10v38l-24-10zm39 16 24 10v38l-24-10zm39 16 24 10v38l-24-10z" fill="#839384"/>
                  <path d="m265 172 29-14v29l-29 14zm48-24 29-14v29l-29 14zm-48 52 29-14v29l-29 14z" fill="#728a7c"/>
                  <path d="m229 284 56-27 62 25-58 28z" fill="#c6a77d" opacity=".7"/>
                  <text x="104" y="44" className="plan-dim">ILLUSTRATIVE MASSING · NOT TO SCALE</text>
                </svg>}
               </div>
               {view === 'volume' && <div className="model-controls" aria-label="Illustrative 3D view controls">
                 <span>حرّك زاوية العرض</span>
                 <button type="button" aria-label="لف النموذج لليسار" onClick={() => setRotation((value) => value - 18)}><RotateCcw size={14} /></button>
                 <button type="button" aria-label="لف النموذج لليمين" onClick={() => setRotation((value) => value + 18)}><RotateCw size={14} /></button>
               </div>}
              <span className="plan-aside">VIVID CITY &nbsp; · &nbsp; {unit.id}</span>
            </div>
            <div className="share-row"><span>تصور توضيحي · قد تختلف التشطيبات النهائية</span><button className="share-button" onClick={() => void share()} data-testid="button-copy-link">{copied ? 'تم النسخ' : 'انسخ رابط المشاركة'} <Share2 size={14} /></button></div>
          </div>
        </div>
      </>}
    </section>
    {qrOpen && <div className="qr-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQrOpen(false); }}>
      <section className="qr-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-title" onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}>
        <button ref={qrCloseRef} type="button" className="qr-close" onClick={() => setQrOpen(false)} aria-label="إغلاق رمز QR"><X size={18} /></button>
        <div className="eyebrow">VIVID CITY · {unitId}</div>
        <h2 className="serif" id="qr-title">رمز مشاركة المنزل</h2>
        <div className="qr-code"><QRCodeSVG value={shareUrl} size={224} level="M" includeMargin /></div>
        <p>امسح الرمز لفتح صفحة هذا المنزل ومشاركة تفاصيله.</p>
        <div className="qr-url" dir="ltr">{shareUrl}</div>
        <button type="button" className="button secondary" onClick={() => void share()}>{copied ? 'تم نسخ الرابط' : 'انسخ رابط المنزل'} <Copy size={14} /></button>
      </section>
    </div>}
  </main>;
}
