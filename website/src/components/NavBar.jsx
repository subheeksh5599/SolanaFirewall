import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="fixed top-0 left-0 z-50 p-3 md:p-9 flex items-center md:gap-8 gap-4">
    <Link to="/" className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
      SolanaFirewall
    </Link>
    <Link to="/dashboard" className="text-white/60 hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors">
      Dashboard
    </Link>
  </nav>
);

export default NavBar;
