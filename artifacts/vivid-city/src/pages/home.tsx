import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Box, LogIn, Map, MapPin } from 'lucide-react';
import { useGetBuildings, useGetProject, useGetUnits } from '@workspace/api-client-react';
import type { GetUnitsParams, Unit } from '@workspace/api-client-react';
import heroImage from '../assets/vivid-residences.jpg';
import { usePageMetadata } from '@/hooks/use-page-metadata';

const ThreeDMasterPlan = lazy(() => import('@/components/ThreeDMasterPlan'));

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value) + ' ' + currency;
}

export default function HomePage() {
  const [arabic, setArabic] = useState(true);
  const [planView, setPlanView] = useState<'2d' | '3d'>('2d');
  usePageMetadata('VIVID City — New Cairo residences', 'Browse the illustrative VIVID City development, explore sample homes, and request a private visit.');
  useEffect(() => {
    document.documentElement.lang = arabic ? 'ar' : 'en';
    document.documentElement.dir = arabic ? 'rtl' : 'ltr';
  }, [arabic]);
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState<number | undefined>();
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const projectQuery = useGetProject();
  const buildingsQuery = useGetBuildings();
  const filters: GetUnitsParams = useMemo(() => ({
    ...(buildingId ? { buildingId } : {}),
    ...(floor !== undefined ? { floor } : {}),
    ...(bedrooms !== undefined ? { bedrooms } : {}),
  }), [buildingId, floor, bedrooms]);
  const unitsQuery = useGetUnits(filters);
  const project = projectQuery.data;
  const buildings = buildingsQuery.data ?? [];
  const units = (unitsQuery.data ?? []).filter((unit) => unit.status === 'available');
  const selectedBuilding = buildings.find((building) => building.id === buildingId);

  const toggleBuilding = (nextBuildingId: string) => {
    setBuildingId((currentBuildingId) => currentBuildingId === nextBuildingId ? '' : nextBuildingId);
    setFloor(undefined);
  };

  return (
    <main dir={arabic ? 'rtl' : 'ltr'} className={arabic ? 'arabic' : ''}>
      <header className="shell topbar">
        <Link href="/" className="brand" aria-label="VIVID City home" data-testid="link-home">
          <span className="brand-mark">V</span><span className="brand-name">VIVID</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#residences">{arabic ? 'المساكن' : 'Residences'}</a>
          <a href="#explore">{arabic ? 'استكشف المخطط' : 'Explore the plan'}</a>
          <a href="#amenities">{arabic ? 'أسلوب الحياة' : 'Lifestyle'}</a>
        </nav>
        <div className="nav-actions">
          <button className="lang-button" onClick={() => setArabic(!arabic)} data-testid="button-language" aria-label="Switch language">{arabic ? 'EN' : 'عربي'}</button>
          <Link
            href="/sign-in"
            className="button small secondary staff-login-link"
            aria-label={arabic ? 'تسجيل دخول فريق المبيعات' : 'Sales team sign in'}
            data-testid="link-sales-login"
          >
            <span className="staff-login-full">{arabic ? 'دخول فريق المبيعات' : 'Sales login'}</span>
            <span className="staff-login-compact">{arabic ? 'دخول' : 'Sign in'}</span>
            <LogIn size={14} aria-hidden="true" />
          </Link>
          <a className="button small" href="#explore" data-testid="button-explore">{arabic ? 'اكتشف منزلك' : 'Find your home'} <ArrowLeft size={14} /></a>
        </div>
      </header>

      <section className="shell hero" id="residences">
        <div className="hero-copy fade-up">
          <div>
            <div className="eyebrow">{arabic ? 'وجهة سكنية جديدة · القاهرة الجديدة' : 'A new residential address · New Cairo'}</div>
            <h1 className={arabic ? 'arabic' : 'serif'}>{project?.name ?? 'VIVID City'}<br /><span style={{ color: '#71836c' }}>{arabic ? 'مساحة لحياة أوسع' : 'Room to live fully'}</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}><MapPin size={13} />{project?.location ?? 'New Cairo, Egypt'}</div>
          </div>
          <p className="hero-desc">{project?.description ?? (arabic ? 'حياة تتنفس بين العمارة الهادئة والمساحات الخضراء، في مجتمع صُمم ليمنح كل يوم إيقاعه الخاص.' : 'A considered neighbourhood where generous homes, shaded gardens and everyday rituals find their own rhythm.')}</p>
        </div>
        <div className="hero-image" data-testid="img-project-hero">
          <img src={heroImage} alt="Contemporary VIVID residences framed by landscaped gardens" />
            <span className="hero-index">01 — 04 &nbsp; / &nbsp; THE NEIGHBOURHOOD</span>
            <div className="image-caption"><strong>{project?.tagline ?? 'A quieter kind of city living'}</strong><span className="caption-side">{project?.completion ? `${arabic ? 'التسليم' : 'COMPLETION'} · ${project.completion}` : 'NEW CAIRO · EGYPT'}</span></div>
        </div>
        <div className="stats" aria-label="Project summary">
          <div className="stat"><span className="stat-value">{project?.availableHomes ?? '—'}</span><span className="stat-label">{arabic ? 'منزل متاح' : 'Homes available'}</span></div>
          <div className="stat"><span className="stat-value">{project?.totalHomes ?? '—'}</span><span className="stat-label">{arabic ? 'منزل في المجتمع' : 'Homes in the community'}</span></div>
          <div className="stat"><span className="stat-value">{project?.completion ?? '2027'}</span><span className="stat-label">{arabic ? 'موعد الإنجاز' : 'Expected completion'}</span></div>
          <div className="stat"><span className="stat-value" style={{ fontSize: 24 }}>{project ? formatPrice(project.startingPrice, project.currency) : '—'}</span><span className="stat-label">{arabic ? 'تبدأ الأسعار من' : 'Starting from'}</span></div>
        </div>
      </section>

      <section className="explore-section" id="explore">
        <div className="shell">
          <div className="section-head">
            <div><div className="eyebrow">THE SITE PLAN &nbsp; / &nbsp; 02</div><h2>{arabic ? 'اعثر على مكانك' : 'Find your place'}</h2></div>
            <div className="section-head-controls">
              <p className="section-note">{arabic ? 'اختر مبنى، ثم استكشف الطوابق والمنازل المتاحة حول الحدائق.' : 'Choose a building, then explore its floors and the homes looking out over the gardens.'}</p>
              <div className="site-plan-toggle" role="group" aria-label={arabic ? 'طريقة عرض المخطط' : 'Plan view'}>
                <button type="button" className={planView === '2d' ? 'active' : ''} onClick={() => setPlanView('2d')} aria-pressed={planView === '2d'} data-testid="button-plan-2d">
                  <Map size={14} aria-hidden="true" />{arabic ? 'المخطط 2D' : '2D plan'}
                </button>
                <button type="button" className={planView === '3d' ? 'active' : ''} onClick={() => setPlanView('3d')} aria-pressed={planView === '3d'} data-testid="button-plan-3d">
                  <Box size={14} aria-hidden="true" />{arabic ? 'المشهد 3D' : '3D view'}
                </button>
              </div>
            </div>
          </div>
          <div className="explorer">
            {planView === '3d' ? (
              buildingsQuery.isLoading ? (
                <div className="plan-view-loading" role="status" data-testid="status-3d-loading">
                  <Box size={21} aria-hidden="true" />
                  <span>{arabic ? 'جارٍ تحميل المخطط ثلاثي الأبعاد…' : 'Loading the 3D master plan…'}</span>
                </div>
              ) : buildingsQuery.isError ? (
                <div className="plan-view-loading is-error" role="alert" data-testid="error-3d-buildings">
                  <span>{arabic ? 'تعذر تحميل بيانات المباني.' : 'Building data could not be loaded.'}</span>
                  <button className="button small secondary" onClick={() => void buildingsQuery.refetch()}>{arabic ? 'إعادة المحاولة' : 'Retry'}</button>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="plan-view-loading" role="status" data-testid="status-3d-loading">
                    <Box size={21} aria-hidden="true" />
                    <span>{arabic ? 'جارٍ تحميل المخطط ثلاثي الأبعاد…' : 'Loading the 3D master plan…'}</span>
                  </div>
                }>
                  <ThreeDMasterPlan
                    buildings={buildings}
                    selectedBuildingId={buildingId}
                    arabic={arabic}
                    onSelectBuilding={toggleBuilding}
                  />
                </Suspense>
              )
            ) : (
              <div className="site-map" role="group" aria-label={arabic ? 'مخطط توضيحي تفاعلي للموقع' : 'Interactive illustrative site plan'}>
                <span className="map-label" style={{ top: '17%', left: '13%' }}>GARDEN COURT</span>
                <span className="map-label" style={{ top: '72%', right: '14%' }}>WADI WALK</span>
                <span className="map-label" style={{ top: '47%', left: '44%' }}>CENTRAL GARDEN</span>
                <span className="map-compass">N ↑</span><span className="map-scale">SITE PLAN · 1:1200</span>
                <div className="map-buildings">
                  {buildingsQuery.isLoading && <div className="skeleton" style={{ position: 'absolute', inset: '23% 18%', opacity: .55 }} />}
                  {buildings.map((building, index) => (
                    <button key={building.id} type="button" className={`map-building${building.id === buildingId ? ' selected' : ''}`}
                      style={{ left: `${building.x}%`, top: `${building.y}%`, transform: 'translate(-50%,-50%)' }}
                      onClick={() => toggleBuilding(building.id)} aria-pressed={building.id === buildingId}
                      data-testid={`button-building-${building.id}`} aria-label={`${building.name}, ${building.availableUnits} available`}>
                      <strong>{building.name || `B${String(index + 1).padStart(2, '0')}`}</strong><span>{building.availableUnits} AVAILABLE</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <aside className="explore-panel">
              <div className="panel-top">
                <div><div className="eyebrow" data-testid="text-selected-building-id">{selectedBuilding ? `${arabic ? 'المبنى' : 'BUILDING'} / ${selectedBuilding.id}` : (arabic ? 'مجموعتك المختارة' : 'YOUR SELECTION')}</div><h3>{selectedBuilding?.name ?? (arabic ? 'كل المساكن' : 'All residences')}</h3><div className="available">{selectedBuilding ? `${selectedBuilding.availableUnits} ${arabic ? 'منزل متاح' : 'homes available'}` : `${project?.availableHomes ?? units.length} ${arabic ? 'منزل متاح' : 'homes available'}`}</div></div>
                <span className="brand-mark" style={{ width: 30, height: 30, fontSize: 11 }}>V</span>
              </div>
              <div className="floor-label">{arabic ? 'اختر الطابق' : 'SELECT A FLOOR'}</div>
              <div className="floor-list" role="group" aria-label="Floor">
                <button className={`floor-chip${floor === undefined ? ' active' : ''}`} onClick={() => setFloor(undefined)} data-testid="button-floor-all">{arabic ? 'الكل' : 'All'}</button>
                {Array.from({ length: selectedBuilding?.floors ?? 6 }, (_, index) => index + 1).map((item) => <button key={item} className={`floor-chip${floor === item ? ' active' : ''}`} onClick={() => setFloor(item)} aria-pressed={floor === item} data-testid={`button-floor-${item}`}>{String(item).padStart(2, '0')}</button>)}
              </div>
              <div className="filter-row">
                <label htmlFor="bedrooms">{arabic ? 'غرف النوم' : 'Bedrooms'}</label>
                <select id="bedrooms" className="select-control" value={bedrooms ?? ''} onChange={(event) => setBedrooms(event.target.value ? Number(event.target.value) : undefined)} data-testid="select-bedrooms">
                  <option value="">{arabic ? 'جميع الأنواع' : 'All types'}</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4 bedrooms</option>
                </select>
              </div>
              <div className="unit-results" aria-live="polite">
                {unitsQuery.isLoading && <><div className="skeleton" style={{ height: 48, marginTop: 10 }} /><div className="skeleton" style={{ height: 48, marginTop: 10 }} /></>}
                {unitsQuery.isError && <div className="error-message">{arabic ? 'تعذر تحميل المساكن.' : 'Homes could not be loaded.'} <button onClick={() => void unitsQuery.refetch()}>{arabic ? 'إعادة المحاولة' : 'Retry'}</button></div>}
                {!unitsQuery.isLoading && !unitsQuery.isError && units.slice(0, 3).map((unit) => <UnitRow key={unit.id} unit={unit} arabic={arabic} />)}
                {!unitsQuery.isLoading && !unitsQuery.isError && units.length === 0 && <div className="available" style={{ padding: '17px 0' }}>{arabic ? 'لا توجد منازل مطابقة. جرّب تغيير الفلاتر.' : 'No matching homes. Try adjusting your filters.'}</div>}
              </div>
              <a className="text-link" href="#explore" onClick={(event) => { event.preventDefault(); setBuildingId(''); setFloor(undefined); setBedrooms(undefined); }}>{arabic ? 'عرض كل المنازل المتاحة ←' : 'View all available homes →'}</a>
            </aside>
          </div>
        </div>
      </section>

      <section className="amenities" id="amenities">
        <div className="shell amenity-grid">
          <div><div className="eyebrow">A LIFE IN BALANCE &nbsp; / &nbsp; 03</div><h2>{arabic ? <>تفاصيل صغيرة،<br />أيام أجمل.</> : <>Small details.<br />Better days.</>}</h2><p>{arabic ? 'كل مساحة مشتركة امتداد للمنزل؛ مكان للهدوء، الحركة، واللقاء.' : 'Spaces beyond your front door, shaped for unhurried mornings, movement and good company.'}</p></div>
          <div className="amenity-list">{(project?.amenities ?? ['Shaded garden walks', 'Residents’ lounge', 'Swimming pool', 'Fitness studio', 'Children’s play garden', 'Neighbourhood café']).map((amenity, index) => <div className="amenity-item" key={amenity}><span className="amenity-number">0{index + 1}</span><span>{amenity}</span><ArrowUpRight size={14} style={{ marginInlineStart: 'auto', color: '#84917a' }} /></div>)}</div>
        </div>
      </section>
      <footer className="shell footer"><Link href="/" className="brand"><span className="brand-mark">V</span><span className="brand-name">VIVID</span></Link><span>{arabic ? 'الأسعار والتوافر بيانات تجريبية' : 'Illustrative prices and availability'} · NEW CAIRO</span><a href="#explore" className="text-link" style={{ padding: 0 }}>{arabic ? 'استكشف المساكن' : 'Explore residences'} <ArrowDownLeft size={13} /></a></footer>
    </main>
  );
}

function UnitRow({ unit, arabic }: { unit: Unit; arabic: boolean }) {
  return <Link href={`/unit/${unit.id}`} className="unit-result" data-testid={`link-unit-${unit.id}`}>
    <span><strong>{unit.id}</strong><small>{unit.bedrooms} {arabic ? 'غرف نوم' : 'BED'} · {unit.areaM2} m² · {unit.view}</small></span>
    <span className="result-price">{formatPrice(unit.price, unit.currency)} <ArrowLeft className="result-arrow" size={13} /></span>
  </Link>;
}
