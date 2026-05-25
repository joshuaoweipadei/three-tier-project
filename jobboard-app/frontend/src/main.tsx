import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Toast from "@/components/ui/Toast";
import App from "./App";
import "./index.css";

// React Query client — the brain for all server state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 1 minute before refetching
      staleTime: 1000 * 60,
      // Retry failed requests twice before showing error
      retry: 2,
      // Refetch when user tabs back into the window
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toast />
      </BrowserRouter>
      {/* Only shown in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);