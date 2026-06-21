export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
  silent?: boolean
  toast?: {
    success?: string
    error?: string
  }
}

export type ApiResponse<T = unknown> = {
  data: T
  status: number
  headers?: Record<string, string>
}

export interface ApiClient {
  get<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  post<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  put<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  patch<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  delete<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>
}
