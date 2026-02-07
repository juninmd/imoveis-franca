import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './Home';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
