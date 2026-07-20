import { useDispatch, useSelector } from "react-redux"
import { updateUser } from "@/features/auth/state/authSlice"

export function AuthProvider({ children }) {
  return children
}

export const useAuth = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  return {
    user,
    setUser: (nextUser) => dispatch(updateUser(nextUser)),
  }
}
