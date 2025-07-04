// src/auth/authContext.jsx
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseconfig'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const auth = getAuth()
    let unsubscribeUser = () => {}

    const unsubscribeAuth = onAuthStateChanged(auth, 
      async (firebaseUser) => {
        try {
          setLoading(true)
          setUser(firebaseUser)
          
          if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid)
            unsubscribeUser = onSnapshot(
              userRef, 
              (doc) => {
                setUserData(doc.exists() ? doc.data() : null)
                setLoading(false)
              },
              (err) => {
                console.error("Error fetching user data:", err)
                setError("Error loading user data")
                setLoading(false)
              }
            )
          } else {
            setUserData(null)
            setLoading(false)
          }
        } catch (err) {
          console.error("Auth state change error:", err)
          setError("Authentication error")
          setLoading(false)
        }
      },
      (error) => {
        console.error("Auth observer error:", error)
        setError("Authentication observer error")
        setLoading(false)
      }
    )

    return () => {
      unsubscribeAuth()
      unsubscribeUser()
    }
  }, [])

  const value = useMemo(() => ({
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: userData?.role === 'admin'
  }), [user, userData, loading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado con validación
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}