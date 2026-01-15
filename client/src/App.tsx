import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './Home';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Home />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
