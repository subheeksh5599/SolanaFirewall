import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";

const Dashboard = lazy(() => import("./pages/Dashboard"));

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/dashboard" element={<Suspense fallback={<div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center text-zinc-500 text-sm">Loading...</div>}><Dashboard /></Suspense>} />
  </Routes>
);

export default App;
