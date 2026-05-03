import { CircleUserRound, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useAuth } from "@/auth/AuthContext";
import MobileNavLinks from "./MobileNavLinks";

const MobileNav = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Sheet>
      <SheetTrigger>
        <Menu className="" />
      </SheetTrigger>
      <SheetContent className="space-y-3">
        <SheetTitle>
          {isAuthenticated && user ? (
            <span className="flex items-center font-bold gap-2">
              <CircleUserRound className="" />
              {user.email.split("@")[0]}
            </span>
          ) : (
            <span>Welcome to GoodEats</span>
          )}
        </SheetTitle>
        <Separator className="" />
        <SheetDescription className="flex flex-col gap-4">
          {isAuthenticated && user ? (
            <MobileNavLinks />
          ) : (
            <Button
              onClick={() => console.log("login")}
              className="flex-1 font-bold"
            >
              Log In
            </Button>
          )}
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
