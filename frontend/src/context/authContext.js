import { createContext } from 'react'

// The context object lives in its own file so the provider component file only exports a component
// (required by the react-refresh lint rule).
export const AuthContext = createContext(null)
