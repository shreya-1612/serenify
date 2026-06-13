let inMemoryToken: string | null = null

type JwtPayload = {
  exp?: number
}

export const loadToken = () => inMemoryToken

export const saveToken = (token: string) => {
  inMemoryToken = token
}

export const clearToken = () => {
  inMemoryToken = null
}

export const isTokenValid = (token: string) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return false
    }
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    const exp = (decoded as JwtPayload).exp
    if (!exp) {
      return true
    }
    return exp * 1000 > Date.now()
  } catch {
    return false
  }
}
