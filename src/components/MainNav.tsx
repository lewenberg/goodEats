import { useAuth } from "@/auth/AuthContext";
import { Button } from "./ui/button";
import UsernameMenu from "./UsernameMenu";

const MainNav = () => {
  const { isAuthenticated } = useAuth();

  return (
    <span className="flex space-x-2 items-center">
      {isAuthenticated ? (
        <UsernameMenu />
      ) : (
        <Button
          variant="outline"
          className="font-bold hover:text-blue-800 hover:bg-white"
          // In demo mode this never shows, but kept for completeness
          onClick={() => console.log("login")}
        >
          Log In
        </Button>
      )}
    </span>
  );
};

export default MainNav;