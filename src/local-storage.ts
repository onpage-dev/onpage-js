export const LocalStorage = {
  get(name: string) {
    try {
      const data = window.localStorage.getItem(name)
      if (data === null) return undefined
      if (name == 'token' && data[0] != '"') return data
      return JSON.parse(data)
    } catch (e) {
      console.log('[storage] fail:', e)
    }
  },
  set(name: string, value: any) {
    try {
      if (value === undefined || value === null) {
        window.localStorage.removeItem(name)
      } else {
        window.localStorage.setItem(name, JSON.stringify(value))
      }
      return this.get(name)
    } catch (e) {
      console.log('[storage] fail:', e)
    }
  },
}
