import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Lazy-load every page — only the active route is downloaded
const NotFound          = lazy(() => import('@/pages/not-found'));
const LandingPage       = lazy(() => import('@/pages/landing'));
const AuthPage          = lazy(() => import('@/pages/auth'));
const LoginPage         = lazy(() => import('@/pages/login'));
const RegisterPage      = lazy(() => import('@/pages/register'));
const SetupPage         = lazy(() => import('@/pages/setup'));
const SetupBasicsPage   = lazy(() => import('@/pages/setup-basics'));
const SetupIncomePage   = lazy(() => import('@/pages/setup-income'));
const SetupCommitmentsPage = lazy(() => import('@/pages/setup-commitments'));
const SetupBudgetPage   = lazy(() => import('@/pages/setup-budget'));
const SetupGoalsPage    = lazy(() => import('@/pages/setup-goals'));
const LinkBankPage      = lazy(() => import('@/pages/link-bank'));
const AnalyzingPage     = lazy(() => import('@/pages/analyzing'));
const ResultPage        = lazy(() => import('@/pages/result'));
const DashboardPage     = lazy(() => import('@/pages/dashboard'));
const SavingsPage       = lazy(() => import('@/pages/savings'));
const CalculatorPage    = lazy(() => import('@/pages/calculator'));

const queryClient = new QueryClient();

function Router() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/"                    component={LandingPage} />
        <Route path="/auth"                component={AuthPage} />
        <Route path="/login"               component={LoginPage} />
        <Route path="/register"            component={RegisterPage} />
        <Route path="/setup"               component={SetupPage} />
        <Route path="/setup/basics"        component={SetupBasicsPage} />
        <Route path="/setup/income"        component={SetupIncomePage} />
        <Route path="/setup/commitments"   component={SetupCommitmentsPage} />
        <Route path="/setup/budget"        component={SetupBudgetPage} />
        <Route path="/setup/goals"         component={SetupGoalsPage} />
        <Route path="/link-bank"           component={LinkBankPage} />
        <Route path="/analyzing"           component={AnalyzingPage} />
        <Route path="/result"              component={ResultPage} />
        <Route path="/dashboard"           component={DashboardPage} />
        <Route path="/savings"             component={SavingsPage} />
        <Route path="/calculator"          component={CalculatorPage} />
        <Route                             component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
