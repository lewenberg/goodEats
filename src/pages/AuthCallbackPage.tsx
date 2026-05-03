import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

/**
 * AuthCallbackPage – formerly handled the Auth0 redirect.
 * Now just immediately navigates home since auth is always "on".
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return <></>;
};

export default AuthCallbackPage;