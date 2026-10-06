import { SignIn, SignUp } from '@clerk/react';
import { Link } from 'wouter';
import { usePageMetadata } from '@/hooks/use-page-metadata';

export const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');

type AuthMode = 'sign-in' | 'sign-up';

function AuthPage({ mode }: { mode: AuthMode }) {
  const signingIn = mode === 'sign-in';
  usePageMetadata(
    signingIn ? 'دخول فريق المبيعات | VIVID City' : 'إنشاء حساب | VIVID City',
    'بوابة خاصة لفريق المبيعات في VIVID City.',
  );

  return (
    <main className="vc-auth-page" dir="rtl">
      <aside className="vc-auth-story">
        <Link href="/" className="vc-brand" aria-label="VIVID City" data-testid="link-auth-brand">
          <span className="vc-brand-symbol">V</span>
          <span className="vc-brand-word">VIVID</span>
          <span className="vc-brand-sub">بوابة المبيعات</span>
        </Link>
        <div className="vc-auth-copy">
          <span className="vc-auth-kicker">VIVID CITY / SALES PORTAL</span>
          <h1>{signingIn ? 'كل تفاصيل العمل، في مكان واحد.' : 'مساحة عمل فريق VIVID City.'}</h1>
          <p>
            {signingIn
              ? 'سجّل الدخول لمتابعة طلبات العملاء وتحديث حالة المساكن.'
              : 'أنشئ حساباً للدخول إلى مساحة العمل. الاطلاع على بيانات العملاء يظل محصوراً بالمستخدمين المعتمدين.'}
          </p>
          <div className="vc-auth-ornament" />
        </div>
        <div className="vc-auth-foot">VIVID CITY · مساحة عمل خاصة بفريق المبيعات</div>
      </aside>

      <section className="vc-auth-form-side">
        <div className="vc-auth-form-top">
          <span>{signingIn ? 'دخول آمن إلى مساحة العمل' : 'تسجيل حساب جديد'}</span>
          <Link href="/">العودة إلى المشروع ↖</Link>
        </div>
        <div className="vc-auth-form-shell">
          {signingIn ? (
            <SignIn
              routing="path"
              path={`${appBasePath}/sign-in`}
              signUpUrl={`${appBasePath}/sign-up`}
            />
          ) : (
            <SignUp
              routing="path"
              path={`${appBasePath}/sign-up`}
              signInUrl={`${appBasePath}/sign-in`}
            />
          )}
          <p>
            {signingIn
              ? 'تحتاج إلى حساب؟ استخدم رابط إنشاء الحساب داخل النموذج.'
              : 'إنشاء الحساب لا يمنح صلاحية الاطلاع على بيانات العملاء تلقائياً.'}
          </p>
        </div>
      </section>
    </main>
  );
}

export function SignInPage() {
  return <AuthPage mode="sign-in" />;
}

export function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}
