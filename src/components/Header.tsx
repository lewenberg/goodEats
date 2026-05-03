import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ChefHat, LogOut, Shield, Store, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

const roleIcon = {
  admin: Shield,
  owner: Store,
  customer: UserRound,
};

const Header = () => {
  const { user, logout } = useAuth();
  const Icon = user ? roleIcon[user.role] : ChefHat;

  return (
    <header className="sticky top-0 z-30 border-b-2 border-slate-950 bg-[#f4ead8]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-3 py-3 sm:px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-950 bg-[#f05d3b] text-white shadow-[3px_3px_0_#17201e]">
            <ChefHat className="h-5 w-5" />
          </span>
          <span>
            <span className="font-display block text-2xl font-black text-slate-950">GoodEats</span>
            <span className="block text-[10px] font-black uppercase text-emerald-900">restaurant OS</span>
          </span>
        </Link>

        {user ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 items-center gap-3 rounded-full border-2 border-slate-950 bg-card px-3 py-2 shadow-[3px_3px_0_#17201e] sm:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-amber-50">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">{user.name}</span>
                <span className="block truncate text-xs font-semibold text-slate-500">{user.email}</span>
              </span>
              <span className="rounded-full bg-[#f6c54e] px-2 py-1 text-xs font-black uppercase text-slate-950">{user.role}</span>
            </div>
            <Button variant="outline" onClick={logout} className="h-11 shrink-0 gap-2 rounded-full border-2 border-slate-950 bg-card px-3 shadow-[2px_2px_0_#17201e] hover:bg-[#f6c54e] sm:px-4">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
