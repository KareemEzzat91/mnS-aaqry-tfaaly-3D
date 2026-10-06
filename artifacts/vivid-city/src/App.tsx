import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { arSA } from '@clerk/localizations';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import HomePage from '@/pages/home';
import AdminPage from '@/pages/admin';
import { SignInPage, SignUpPage, appBasePath } from '@/pages/auth';
import UnitPage from '@/pages/unit';
import VisitPage from '@/pages/visit';
import NotFound from '@/pages/not-found';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import './pages/admin.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return appBasePath && path.startsWith(appBasePath)
    ? path.slice(appBasePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: appBasePath || '/',
    logoImageUrl: `${window.location.origin}${appBasePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#315b4e',
    colorForeground: '#233c36',
    colorMutedForeground: '#687a70',
    colorDanger: '#a4443b',
    colorBackground: '#fbfbf7',
    colorInput: '#fffefa',
    colorInputForeground: '#233c36',
    colorNeutral: '#d9dfd5',
    fontFamily: "'IBM Plex Sans Arabic', 'DM Sans', sans-serif",
    borderRadius: '0.25rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: '!w-[440px] max-w-[calc(100vw-40px)] !bg-[#fbfbf7] !rounded-none overflow-hidden !border !border-[#d9dfd5] !shadow-none',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!text-[#233c36] !font-semibold',
    headerSubtitle: '!text-[#687a70]',
    socialButtonsBlockButtonText: '!text-[#233c36]',
    formFieldLabel: '!text-[#334b43]',
    footerActionLink: '!text-[#315b4e] hover:!text-[#24483e]',
    footerActionText: '!text-[#687a70]',
    dividerText: '!text-[#687a70]',
    identityPreviewEditButton: '!text-[#315b4e]',
    formFieldSuccessText: '!text-[#315b4e]',
    alertText: '!text-[#233c36]',
    logoBox: 'mb-4',
    logoImage: 'object-contain',
    socialButtonsBlockButton: '!border-[#d9dfd5] hover:!bg-[#f1f2eb]',
    formButtonPrimary: '!bg-[#315b4e] !text-[#fbfbf7] hover:!bg-[#24483e]',
    formFieldInput: '!border-[#d9dfd5] !bg-[#fffefa] !text-[#233c36]',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#d9dfd5]',
    alert: '!border-[#d9dfd5] !bg-[#f3f4ed]',
    otpCodeFieldInput: '!border-[#d9dfd5] !text-[#233c36]',
    formFieldRow: '',
    main: '',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        client.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="vc-auth-wait" role="status">جارٍ التحميل…</div>;
  }

  return isSignedIn ? <Redirect to="/admin" /> : <HomePage />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/unit/:unitId" component={UnitPage} />
        <Route path="/visit/:unitId" component={VisitPage} />
        <Route path="/" component={HomeRedirect} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkApplication() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={arSA}
      signInUrl={`${appBasePath}/sign-in`}
      signUpUrl={`${appBasePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={appBasePath}>
      <ClerkApplication />
    </WouterRouter>
  );
}

export default App;
