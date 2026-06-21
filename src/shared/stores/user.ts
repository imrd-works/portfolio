import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  function setUser(data: User | null) {
    user.value = data
  }

  function setToken(value: string | null) {
    token.value = value
  }

  function login(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    currentUser,
    setUser,
    setToken,
    login,
    logout,
  }
})
