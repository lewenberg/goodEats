import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ChefHat, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#fbf6ea]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-3 sm:px-5 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <ChefHat className="h-7 w-7 shrink-0 text-[#e94f2e]" />
          <span>
            <span className="font-display block text-xl font-black leading-5 text-slate-950">GoodEats</span>
            <span className="block text-[10px] font-black uppercase tracking-normal text-emerald-900">ordering app</span>
          </span>
        </Link>

        {user ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-700" />
              <span className="truncate text-sm font-bold text-slate-950">{user.name}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">{user.role}</span>
            </div>
            <Button variant="outline" onClick={logout} className="h-9 shrink-0 gap-2 rounded-full border-slate-300 bg-white px-3 text-sm font-bold hover:bg-amber-50">
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
