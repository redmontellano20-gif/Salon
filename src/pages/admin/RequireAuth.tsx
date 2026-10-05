import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { admin } from "../../api/client";
import { Loading } from "./ui";

/** Gate admin pages by validating the current signed admin session. */
export default function RequireAuth() {
  const loc = useLocation();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    admin.me().then(
      () => active && setAuthorized(true),
      () => active && setAuthorized(false)
    );
    return () => {
      active = false;
    };
  }, []);

  if (authorized === null) return <Loading />;
  if (!authorized)
    return <Navigate to="/admin/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
