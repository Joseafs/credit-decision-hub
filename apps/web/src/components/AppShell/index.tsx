import { Outlet } from "react-router-dom";

import { AppHeader } from "../AppHeader";

export const AppShell = () => (
  <div className="min-h-screen bg-canvas text-body">
    <AppHeader />
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Outlet />
    </main>
  </div>
);
