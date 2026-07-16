import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import LandingPage from '@/pages/landing';
import AuthPage from '@/pages/auth';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import SetupPage from '@/pages/setup';
import SetupBasicsPage from '@/pages/setup-basics';
import SetupIncomePage from '@/pages/setup-income';
import SetupCommitmentsPage from '@/pages/setup-commitments';
import SetupBudgetPage from '@/pages/setup-budget';
import SetupGoalsPage from '@/pages/setup-goals';
import LinkBankPage from '@/pages/link-bank';
import AnalyzingPage from '@/pages/analyzing';
import ResultPage from '@/pages/result';
import DashboardPage from '@/pages/dashboard';
import SavingsPage from '@/pages/savings';
import CalculatorPage from '@/pages/calculator';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/setup/basics" component={SetupBasicsPage} />
      <Route path="/setup/income" component={SetupIncomePage} />
      <Route path="/setup/commitments" component={SetupCommitmentsPage} />
      <Route path="/setup/budget" component={SetupBudgetPage} />
      <Route path="/setup/goals" component={SetupGoalsPage} />
      <Route path="/link-bank" component={LinkBankPage} />
      <Route path="/analyzing" component={AnalyzingPage} />
      <Route path="/result" component={ResultPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/savings" component={SavingsPage} />
      <Route path="/calculator" component={CalculatorPage} />
      <Route component={NotFound} />
    </Switch>
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
