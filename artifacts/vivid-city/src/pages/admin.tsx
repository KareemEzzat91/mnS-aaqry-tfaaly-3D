import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClerk, useUser } from '@clerk/react';
import { Link } from 'wouter';
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  Clock3,
  Home,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  getGetAdminLeadsQueryKey,
  getGetBuildingsQueryKey,
  getGetProjectQueryKey,
  getGetUnitsQueryKey,
  useGetAdminLeads,
  useGetUnits,
  useUpdateAdminLead,
  useUpdateAdminUnit,
} from '@workspace/api-client-react';
import type { AdminLead, AdminLeadStatus, Unit, UnitStatus } from '@workspace/api-client-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { appBasePath } from './auth';

type DashboardTab = 'leads' | 'units';
type LeadFilter = 'all' | AdminLeadStatus;
type UnitFilter = 'all' | UnitStatus;

const leadStatusLabels: Record<AdminLeadStatus, string> = {
  new: 'جديد',
  contacted: 'تم التواصل',
  visit_scheduled: 'زيارة مجدولة',
  closed: 'مغلق',
};

const unitStatusLabels: Record<UnitStatus, string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function responseStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

function AccessMessage({
  mode,
  onRetry,
}: {
  mode: 'signed-out' | 'session' | 'forbidden' | 'error';
  onRetry?: () => void;
}) {
  const content = {
    'signed-out': {
      title: 'سجّل الدخول للمتابعة',
      body: 'هذه المساحة مخصصة لفريق المبيعات. بيانات العملاء لا تظهر قبل التحقق من صلاحية الحساب.',
      icon: <ShieldCheck size={20} />,
    },
    session: {
      title: 'أعد تسجيل الدخول للمتابعة',
      body: 'لم يتمكن الخادم من التحقق من جلسة الدخول. سجّل الدخول مرة أخرى ثم أعد المحاولة.',
      icon: <ShieldCheck size={20} />,
    },
    forbidden: {
      title: 'هذه المساحة مخصصة لفريق المبيعات',
      body: 'تم تسجيل الدخول، لكن هذا الحساب غير مخوّل للوصول إلى بيانات العملاء أو تعديل المساكن.',
      icon: <ShieldCheck size={20} />,
    },
    error: {
      title: 'تعذر التحقق من صلاحية الدخول',
      body: 'لم نتمكن من تحميل بيانات مساحة العمل الآن. حاول مرة أخرى بعد التأكد من اتصالك.',
      icon: <RefreshCw size={20} />,
    },
  }[mode];

  return (
    <main className="vc-workspace" dir="rtl">
      <section className="vc-access-denied">
        <div className="vc-access-card">
          <div className="vc-access-icon" aria-hidden="true">{content.icon}</div>
          <h1>{content.title}</h1>
          <p>{content.body}</p>
          {(mode === 'signed-out' || mode === 'session') && (
            <Link className="vc-save-button" href="/sign-in" data-testid="link-admin-sign-in">
              تسجيل الدخول <ArrowUpRight size={14} />
            </Link>
          )}
          {mode === 'error' && onRetry && (
            <button className="vc-save-button" type="button" onClick={onRetry} data-testid="button-admin-retry">
              إعادة المحاولة <RefreshCw size={14} />
            </button>
          )}
          <div style={{ marginTop: 14 }}>
            <Link href="/" className="vc-auth-form-top-link" data-testid="link-admin-public-home">
              العودة إلى المشروع
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  primary = false,
}: {
  label: string;
  value: number;
  note: string;
  primary?: boolean;
}) {
  return (
    <article className={`vc-metric${primary ? ' primary' : ''}`} data-testid={`metric-${label}`}>
      <span className="vc-metric-label">{label}</span>
      <strong className="vc-metric-value" dir="ltr">{formatNumber(value)}</strong>
      <span className="vc-metric-foot">{note}</span>
    </article>
  );
}

function LeadRow({
  lead,
  saving,
  onStatusChange,
}: {
  lead: AdminLead;
  saving: boolean;
  onStatusChange: (leadId: string, status: AdminLeadStatus) => void;
}) {
  const initials = lead.name.trim().slice(0, 1) || '؟';

  return (
    <tr data-testid={`row-lead-${lead.id}`}>
      <td>
        <div className="vc-client">
          <span className="vc-avatar" aria-hidden="true">{initials}</span>
          <div>
            <strong data-testid={`text-lead-name-${lead.id}`}>{lead.name}</strong>
            <small>{lead.email || '—'}</small>
          </div>
        </div>
      </td>
      <td dir="ltr">
        <a className="vc-contact-link" href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} data-testid={`link-lead-phone-${lead.id}`}>
          {lead.phone}
        </a>
      </td>
      <td><span className="vc-unit-ref">{lead.unitId}</span></td>
      <td><div className="vc-message" title={lead.message || undefined}>{lead.message || '—'}</div></td>
      <td><time className="vc-date-cell" dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time></td>
      <td>
        <label className={`vc-status-pill vc-status-${lead.status}${saving ? ' vc-updating' : ''}`}>
          <span className="sr-only">حالة الطلب</span>
          <select
            aria-label={`حالة طلب ${lead.name}`}
            value={lead.status}
            disabled={saving}
            onChange={(event) => onStatusChange(lead.id, event.target.value as AdminLeadStatus)}
            data-testid={`select-lead-status-${lead.id}`}
          >
            {Object.entries(leadStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </td>
    </tr>
  );
}

function UnitCard({
  unit,
  saving,
  onSave,
}: {
  unit: Unit;
  saving: boolean;
  onSave: (unitId: string, status: UnitStatus, price: number) => void;
}) {
  const [priceDraft, setPriceDraft] = useState(String(unit.price));
  const [statusDraft, setStatusDraft] = useState<UnitStatus>(unit.status);

  useEffect(() => {
    setPriceDraft(String(unit.price));
    setStatusDraft(unit.status);
  }, [unit.price, unit.status]);

  return (
    <article className="vc-unit-card" data-testid={`card-unit-${unit.id}`}>
      <div className="vc-unit-top">
        <div>
          <strong>{unit.id}</strong>
          <div className="vc-unit-meta">المبنى {unit.buildingId} · الدور {formatNumber(unit.floor)}</div>
        </div>
        <label className={`vc-status-control vc-status-${statusDraft}`}>
          <span className="sr-only">حالة المسكن</span>
          <select
            value={statusDraft}
            onChange={(event) => setStatusDraft(event.target.value as UnitStatus)}
            aria-label={`حالة المسكن ${unit.id}`}
            data-testid={`select-unit-status-${unit.id}`}
          >
            {Object.entries(unitStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="vc-unit-details">
        <span><BedDouble size={13} />{formatNumber(unit.bedrooms)} غرف</span>
        <span><Bath size={13} />{formatNumber(unit.bathrooms)} حمام</span>
        <span><Building2 size={13} />{formatNumber(unit.areaM2)} م²</span>
      </div>
      <div className="vc-unit-editor">
        <div className="vc-price-wrap">
          <label htmlFor={`unit-price-${unit.id}`}>السعر المطلوب</label>
          <div className="vc-price-input">
            <input
              id={`unit-price-${unit.id}`}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={priceDraft}
              onChange={(event) => setPriceDraft(event.target.value)}
              aria-label={`سعر المسكن ${unit.id}`}
              data-testid={`input-unit-price-${unit.id}`}
            />
            <span className="vc-currency">{unit.currency}</span>
          </div>
        </div>
        <button
          className="vc-save-button"
          type="button"
          disabled={saving || (Number(priceDraft) === unit.price && statusDraft === unit.status)}
          onClick={() => onSave(unit.id, statusDraft, Number(priceDraft))}
          data-testid={`button-save-unit-${unit.id}`}
        >
          {saving ? <RefreshCw size={13} className="vc-spin" /> : <Check size={14} />}
          {saving ? 'جارٍ الحفظ' : 'حفظ التعديل'}
        </button>
      </div>
    </article>
  );
}

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DashboardTab>('leads');
  const [search, setSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('all');
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [savingUnitId, setSavingUnitId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  usePageMetadata('لوحة المبيعات | VIVID City', 'مساحة خاصة لفريق المبيعات لإدارة طلبات العملاء وحالة المساكن.');

  const leadsQuery = useGetAdminLeads({
    query: {
      enabled: Boolean(isLoaded && isSignedIn),
      queryKey: getGetAdminLeadsQueryKey(),
      refetchInterval: 45_000,
    },
  });
  const canLoadInventory = leadsQuery.isSuccess;
  const unitsQuery = useGetUnits({}, {
    query: {
      enabled: canLoadInventory,
      queryKey: getGetUnitsQueryKey({}),
      refetchInterval: 45_000,
    },
  });
  const updateLead = useUpdateAdminLead();
  const updateUnit = useUpdateAdminUnit();
  const leads = leadsQuery.data ?? [];
  const units = unitsQuery.data ?? [];

  const filteredLeads = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = leadFilter === 'all' || lead.status === leadFilter;
      const searchable = [lead.name, lead.phone, lead.email ?? '', lead.unitId, lead.message ?? '']
        .join(' ')
        .toLocaleLowerCase();
      return matchesStatus && (!searchTerm || searchable.includes(searchTerm));
    });
  }, [leadFilter, leads, search]);

  const filteredUnits = useMemo(
    () => units.filter((unit) => unitFilter === 'all' || unit.status === unitFilter),
    [unitFilter, units],
  );

  if (!isLoaded) {
    return <div className="vc-auth-wait" role="status">جارٍ التحقق من الجلسة…</div>;
  }

  if (!isSignedIn) {
    return <AccessMessage mode="signed-out" />;
  }

  const leadErrorStatus = responseStatus(leadsQuery.error);
  if (leadsQuery.isError && leadErrorStatus === 403) {
    return <AccessMessage mode="forbidden" />;
  }
  if (leadsQuery.isError && leadErrorStatus === 401) {
    return <AccessMessage mode="session" />;
  }
  if (leadsQuery.isError) {
    return <AccessMessage mode="error" onRetry={() => void leadsQuery.refetch()} />;
  }

  const updateLeadStatus = (leadId: string, status: AdminLeadStatus) => {
    setActionMessage(null);
    setSavingLeadId(leadId);
    updateLead.mutate(
      { leadId, data: { status } },
      {
        onSuccess: (updatedLead) => {
          queryClient.setQueryData<AdminLead[]>(getGetAdminLeadsQueryKey(), (current) =>
            current?.map((lead) => lead.id === updatedLead.id ? updatedLead : lead),
          );
          setActionMessage('تم تحديث حالة طلب العميل.');
        },
        onError: () => setActionMessage('تعذر حفظ الحالة. حاول مرة أخرى.'),
        onSettled: () => setSavingLeadId(null),
      },
    );
  };

  const saveUnit = (unitId: string, status: UnitStatus, price: number) => {
    if (!Number.isInteger(price) || price < 1) {
      setActionMessage('أدخل سعراً صحيحاً أكبر من صفر.');
      return;
    }
    setActionMessage(null);
    setSavingUnitId(unitId);
    updateUnit.mutate(
      { unitId, data: { status, price } },
      {
        onSuccess: (updatedUnit) => {
          queryClient.setQueryData<Unit[]>(getGetUnitsQueryKey({}), (current) =>
            current?.map((unit) => unit.id === updatedUnit.id ? updatedUnit : unit),
          );
          void queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetBuildingsQueryKey() });
          setActionMessage('تم تحديث بيانات المسكن.');
        },
        onError: () => setActionMessage('تعذر حفظ بيانات المسكن. حاول مرة أخرى.'),
        onSettled: () => setSavingUnitId(null),
      },
    );
  };

  const totalNew = leads.filter((lead) => lead.status === 'new').length;
  const scheduledVisits = leads.filter((lead) => lead.status === 'visit_scheduled').length;
  const availableUnits = units.filter((unit) => unit.status === 'available').length;

  return (
    <main className="vc-workspace" dir="rtl">
      <div className="vc-admin-shell">
        <header className="vc-admin-topbar">
          <Link href="/" className="vc-brand" aria-label="VIVID City" data-testid="link-admin-brand">
            <span className="vc-brand-symbol">V</span>
            <span className="vc-brand-word">VIVID</span>
            <span className="vc-brand-sub">مساحة فريق المبيعات</span>
          </Link>
          <div className="vc-top-actions">
            <span className="vc-workspace-label"><span className="vc-live-dot" /> مساحة خاصة</span>
            <span className="vc-admin-user" data-testid="text-admin-user">{user?.firstName || 'فريق المبيعات'}</span>
            <button
              className="vc-save-button vc-logout-button"
              type="button"
              onClick={() => void signOut({ redirectUrl: appBasePath || '/' })}
              data-testid="button-admin-sign-out"
            >
              <LogOut size={14} /> خروج
            </button>
          </div>
        </header>

        <div className="vc-admin-layout">
          <aside className="vc-side-rail">
            <div className="vc-side-heading">إدارة VIVID CITY</div>
            <nav className="vc-side-nav" aria-label="أقسام لوحة المبيعات">
              <button type="button" className={tab === 'leads' ? 'active' : ''} onClick={() => setTab('leads')} data-testid="tab-admin-leads">
                <Users size={16} /> طلبات العملاء
              </button>
              <button type="button" className={tab === 'units' ? 'active' : ''} onClick={() => setTab('units')} data-testid="tab-admin-units">
                <Home size={16} /> المساكن والأسعار
              </button>
            </nav>
            <div className="vc-rail-note">
              <strong>بيانات توضيحية</strong>
              <p>المخزون والأسعار المعروضة تجريبية، ويجب اعتمادها قبل استخدامها تجارياً.</p>
            </div>
          </aside>

          <section className="vc-content">
            <div className="vc-page-heading">
              <div>
                <div className="vc-kicker">VIVID CITY / SALES OVERVIEW</div>
                <h1>{tab === 'leads' ? 'نظرة عامة على المبيعات' : 'إدارة المساكن'}</h1>
                <p>متابعة طلبات الزيارة وتحديث معلومات الوحدات المتاحة.</p>
              </div>
              <time className="vc-date-stamp" dateTime={new Date().toISOString()}>{formatDate(new Date().toISOString())}</time>
            </div>

            <div className="vc-overview">
              <Metric label="طلبات العملاء" value={leads.length} note="إجمالي الطلبات المسجلة" primary />
              <Metric label="طلبات جديدة" value={totalNew} note="تحتاج إلى متابعة" />
              <Metric label="زيارات مجدولة" value={scheduledVisits} note="طلبات تم تحديد موعدها" />
              <Metric label="مساكن متاحة" value={availableUnits} note="من المخزون التجريبي" />
            </div>

            {actionMessage && (
              <div className="vc-action-notice" role="status" data-testid="status-admin-action">
                <Check size={15} /> {actionMessage}
              </div>
            )}

            <div className="vc-section-tabs" role="tablist" aria-label="محتوى لوحة المبيعات">
              <button type="button" role="tab" aria-selected={tab === 'leads'} className={tab === 'leads' ? 'active' : ''} onClick={() => setTab('leads')} data-testid="tab-overview-leads">
                طلبات العملاء <span className="vc-count">{formatNumber(leads.length)}</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === 'units'} className={tab === 'units' ? 'active' : ''} onClick={() => setTab('units')} data-testid="tab-overview-units">
                المساكن <span className="vc-count">{formatNumber(units.length)}</span>
              </button>
            </div>

            {tab === 'leads' ? (
              <section aria-label="طلبات العملاء" role="tabpanel">
                <div className="vc-section-head">
                  <div>
                    <h2>طلبات التواصل والزيارة</h2>
                    <p>تُعرض بيانات التواصل لفريق المبيعات المعتمد فقط.</p>
                  </div>
                  <div className="vc-filters">
                    <label className="vc-search">
                      <span className="sr-only">ابحث في الطلبات</span>
                      <Search size={15} aria-hidden="true" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="ابحث بالاسم أو الهاتف..."
                        data-testid="input-search-leads"
                      />
                    </label>
                    <label>
                      <span className="sr-only">تصفية الطلبات حسب الحالة</span>
                      <select className="vc-filter-select" value={leadFilter} onChange={(event) => setLeadFilter(event.target.value as LeadFilter)} data-testid="select-lead-filter">
                        <option value="all">كل الحالات</option>
                        {Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="vc-card vc-table-wrap">
                  {leadsQuery.isLoading ? (
                    <div className="vc-loading-stack" role="status" aria-label="جارٍ تحميل الطلبات">
                      {Array.from({ length: 5 }, (_, index) => <div className="vc-skeleton" key={index} />)}
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="vc-empty" data-testid="empty-admin-leads">
                      <div className="vc-empty-mark"><Users size={17} /></div>
                      <strong>{leads.length ? 'لا توجد نتائج مطابقة' : 'لا توجد طلبات حتى الآن'}</strong>
                      <p>{leads.length ? 'جرّب تغيير كلمات البحث أو التصفية.' : 'ستظهر طلبات العملاء الجديدة هنا.'}</p>
                    </div>
                  ) : (
                    <table className="vc-lead-table">
                      <thead>
                        <tr>
                          <th scope="col">العميل</th>
                          <th scope="col">الهاتف</th>
                          <th scope="col">المسكن</th>
                          <th scope="col">الرسالة</th>
                          <th scope="col">تاريخ الطلب</th>
                          <th scope="col">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead) => (
                          <LeadRow
                            key={lead.id}
                            lead={lead}
                            saving={savingLeadId === lead.id}
                            onStatusChange={updateLeadStatus}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            ) : (
              <section aria-label="إدارة المساكن" role="tabpanel">
                <div className="vc-section-head">
                  <div>
                    <h2>حالة المساكن وأسعارها</h2>
                    <p>تُحدّث حالة التوفر والسعر الابتدائي للمشروع تلقائياً بعد الحفظ.</p>
                  </div>
                  <div className="vc-filters">
                    <label>
                      <span className="sr-only">تصفية المساكن حسب الحالة</span>
                      <select className="vc-filter-select" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value as UnitFilter)} data-testid="select-unit-filter">
                        <option value="all">كل المساكن</option>
                        {Object.entries(unitStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                {unitsQuery.isLoading ? (
                  <div className="vc-unit-grid" role="status" aria-label="جارٍ تحميل المساكن">
                    {Array.from({ length: 4 }, (_, index) => <div className="vc-skeleton" key={index} />)}
                  </div>
                ) : unitsQuery.isError ? (
                  <div className="vc-error-banner" role="alert">
                    <span>تعذر تحميل بيانات المساكن.</span>
                    <button type="button" onClick={() => void unitsQuery.refetch()} data-testid="button-retry-units">إعادة المحاولة</button>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="vc-empty vc-card" data-testid="empty-admin-units">
                    <div className="vc-empty-mark"><Home size={17} /></div>
                    <strong>لا توجد مساكن في هذه الحالة</strong>
                    <p>اختر حالة أخرى لعرض بقية المساكن.</p>
                  </div>
                ) : (
                  <div className="vc-unit-grid">
                    {filteredUnits.map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        saving={savingUnitId === unit.id}
                        onSave={saveUnit}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
            <footer className="vc-admin-footer">
              <span><LayoutDashboard size={13} /> VIVID City · لوحة مبيعات خاصة</span>
              <span><Clock3 size={13} /> يتم تحديث البيانات تلقائياً</span>
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}
