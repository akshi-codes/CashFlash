import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hydrateAuth } from "@/features/auth/state/authSlice";
import { readPersistedAuth } from "@/features/auth/state/authStorage";

export default function AuthBootstrapper({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateAuth(readPersistedAuth()));
  }, [dispatch]);

  return children;
}
