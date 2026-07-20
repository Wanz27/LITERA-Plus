const API_URL = import.meta.env.VITE_API_URL || 'https://litera-plus.vercel.app/api'

export type Role = 'admin' | 'petugas' | 'visitor'

export interface AuthUser {
  user_id: string
  full_name: string
  email: string
  role: Role
}

export interface ManagedUser {
  user_id: string
  full_name: string
  email: string
  role: Role
  created_at: string
}

export type LibraryStatus = 'Tersedia' | 'Penuh' | 'Pemeliharaan'
export type LibraryType = 'utama' | 'digital' | 'referensi' | 'arsip'

export interface Library {
  id: string
  nama: string
  lokasi: string
  status: LibraryStatus
  tipe: LibraryType
  total_koleksi: number
  jam_operasional: string
  kepala_unit: string
  foto_url?: string | null
  created_at: string
}

export type BookKondisi = 'Bagus' | 'Rusak'
export type BookStatus = 'tersedia' | 'dipinjam'

export interface Book {
  id: string
  library_id: string
  judul: string
  penulis: string
  penerbit: string
  tahun_terbit: number | null
  isbn: string
  kode_klasifikasi: string
  kondisi: BookKondisi
  subjek: string
  bahasa: string
  jumlah: number
  nomor_inventaris: string
  jumlah_halaman: number | null
  ukuran_buku: string
  ilustrasi: string
  cover_url: string
  batch_id: string
  status: BookStatus
  created_at: string
}

export type CirculationStatus = 'dipinjam' | 'kembali'

export interface Circulation {
  id: string
  book_id: string
  library_id: string
  borrower_name: string
  borrower_nis: string | null
  status: CirculationStatus
  borrow_date: string
  due_date: string | null
  return_date: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  aksi: string
  detail: string
  pelaku: string
  created_at: string
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function getToken() {
  return localStorage.getItem('litera_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok || body.success === false) {
    throw new ApiError(body.message || 'Terjadi kesalahan pada server', res.status)
  }

  return body.data as T
}

export const login = (identifier: string, password: string) =>
  request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })

export const register = (payload: {
  full_name: string
  email: string
  password: string
}) =>
  request<{ token: string; user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getMe = () => request<AuthUser>('/auth/me')

export const updateProfile = (payload: { full_name: string; email: string }) =>
  request<{ token: string; user: AuthUser }>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const changePassword = (payload: { current_password: string; new_password: string }) =>
  request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const checkEmail = (email: string) =>
  request<{ exists: boolean }>('/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const getUsers = () => request<ManagedUser[]>('/users')

export const updateUser = (id: string, payload: { full_name: string; email: string; role: Role }) =>
  request<ManagedUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUser = (id: string) =>
  request<{ id: string }>(`/users/${id}`, { method: 'DELETE' })

export const resetUserPassword = (id: string, newPassword: string) =>
  request<{ message: string }>(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ new_password: newPassword }),
  })

export const getLibraries = () => request<Library[]>('/libraries')

export const createLibrary = (payload: Partial<Library>) =>
  request<Library>('/libraries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateLibrary = (id: string, payload: Partial<Library>) =>
  request<Library>(`/libraries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteLibrary = (id: string) =>
  request<{ id: string }>(`/libraries/${id}`, { method: 'DELETE' })

export async function uploadLibraryImage(file: File): Promise<{ url: string }> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/libraries/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    throw new ApiError(body.message || 'Gagal mengunggah gambar', res.status)
  }
  return body.data as { url: string }
}

export interface BookInput {
  library_id?: string
  judul: string
  penulis: string
  penerbit?: string
  tahun_terbit?: string
  isbn?: string
  kode_klasifikasi?: string
  kondisi?: BookKondisi
  subjek?: string
  bahasa?: string
  jumlah?: string
  nomor_inventaris?: string
  jumlah_halaman?: string
  ukuran_buku?: string
  ilustrasi?: string
  cover_url?: string
}

export const getBooks = (libraryId: string) =>
  request<Book[]>(`/books?library_id=${encodeURIComponent(libraryId)}`)

export const createBook = (payload: BookInput) =>
  request<Book[]>('/books', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const importBooks = (libraryId: string, books: BookInput[]) =>
  request<Book[]>('/books/import', {
    method: 'POST',
    body: JSON.stringify({ library_id: libraryId, books }),
  })

export const updateBook = (id: string, payload: Partial<BookInput>) =>
  request<Book>(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteBook = (id: string) =>
  request<{ id: string }>(`/books/${id}`, { method: 'DELETE' })

export async function uploadBookCover(file: File): Promise<{ url: string }> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/books/cover`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    throw new ApiError(body.message || 'Gagal mengunggah gambar', res.status)
  }
  return body.data as { url: string }
}

export const getActivityLog = () => request<ActivityLog[]>('/activity-log')

export const getCirculations = (libraryId: string, status?: CirculationStatus) =>
  request<Circulation[]>(
    `/circulations?library_id=${encodeURIComponent(libraryId)}${status ? `&status=${status}` : ''}`,
  )

export const borrowBook = (payload: {
  library_id: string
  nomor_inventaris: string
  borrower_name: string
  borrower_nis?: string
  due_date?: string
}) =>
  request<{ book: Book; circulation: Circulation }>('/circulations/borrow', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const returnBook = (payload: { library_id: string; nomor_inventaris: string }) =>
  request<{ book: Book; circulation: Circulation }>('/circulations/return', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
