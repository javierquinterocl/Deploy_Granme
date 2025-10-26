import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, Edit2, Trash2, ArrowUpDown, X } from "lucide-react"
import { userService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function UsersListPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" })
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { getAllUsers } = useAuth()
  const { toast } = useToast()

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, user: null })
  const [editDialog, setEditDialog] = useState({ open: false, user: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [createDialog, setCreateDialog] = useState(false)
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    code: "",
    idCard: "",
    phone: "",
    password: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizeUser = (raw) => {

    const first = raw.first_name || raw.fisrtName || raw.firstName || raw.nombre || raw.nombres || raw.name || ''
    const last = raw.last_name || raw.lastName || raw.apellido || raw.apellidos || raw.surname || ''
    
    // Construir nombre completo
    const fullName = [first, last].filter(Boolean).join(' ').trim() || 
                     raw.fullName || raw.full_name || raw.username || 'Sin nombre'
    
    return {
      ...raw,
      firstName: first,
      lastName: last,
      fullName,
      email: raw.email || raw.correo || '',
      code: raw.code || raw.codigo || raw.userCode || '',
      idCard: raw.idCard || raw.id_card || raw.cedula || raw.document || '',
      phone: raw.phone || raw.telefono || raw.celular || '',
      role: raw.role || raw.rol || 'PRACTICANTE' // Rol del usuario
    }
  }

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const usersData = await getAllUsers()
      setUsers(Array.isArray(usersData) ? usersData.map(normalizeUser) : [])
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [getAllUsers, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Funciones para abrir modales
  const handleView = (user) => {
    setViewDialog({ open: true, user })
  }

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      code: user.code || "",
      idCard: user.idCard || "",
      phone: user.phone || "",
      password: ""
    })
    setFormErrors({})
    setEditDialog({ open: true, user })
  }

  const handleDelete = (user) => {
    setDeleteDialog({ open: true, user })
  }

  const handleCreate = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      code: "",
      idCard: "",
      phone: "",
      password: ""
    })
    setFormErrors({})
    setCreateDialog(true)
  }

  // Funcion para validar formulario
  const validateForm = (isCreate = false) => {
    const errors = {}
    
    if (!formData.firstName.trim()) errors.firstName = "El nombre es requerido"
    if (!formData.lastName.trim()) errors.lastName = "El apellido es requerido"
    if (!formData.email.trim()) errors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email inválido"
    if (!formData.code.trim()) errors.code = "El código es requerido"
    if (!formData.idCard.trim()) errors.idCard = "La cédula es requerida"
    
    if (isCreate && !formData.password.trim()) {
      errors.password = "La contraseña es requerida"
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Funcion para crear usuario
  const handleCreateSubmit = async () => {
    if (!validateForm(true)) return
    
    setIsSubmitting(true)
    try {
      await userService.register(formData)
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
        variant: "default"
      })
      setCreateDialog(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funcion para actualizar usuario
  const handleEditSubmit = async () => {
    if (!validateForm(false)) return
    
    setIsSubmitting(true)
    try {
      await userService.updateUser(editDialog.user.id, formData)
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
        variant: "default"
      })
      setEditDialog({ open: false, user: null })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funcion para eliminar usuario
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true)
    try {
      await userService.deleteUser(deleteDialog.user.id)
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
        variant: "default"
      })
      setDeleteDialog({ open: false, user: null })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funcion para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim()
    let data = [...users]
    
    if (term) {
      const isNumeric = /^\d+$/.test(term)
      
      if (isNumeric) {
        const searchId = parseInt(term, 10)
        data = data.filter(u => u.id === searchId)
      } else {
        const termLower = term.toLowerCase()
        data = data.filter(u => {
          return [u.fullName, u.firstName, u.lastName, u.email, u.code, u.idCard]
            .filter(Boolean)
            .some(v => v.toLowerCase().includes(termLower))
        })
      }
    }
    
    data.sort((a,b) => {
      const { key, direction } = sortConfig
      const av = (a[key] ?? "").toString().toLowerCase()
      const bv = (b[key] ?? "").toString().toLowerCase()
      if (av < bv) return direction === "asc" ? -1 : 1
      if (av > bv) return direction === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [users, search, sortConfig])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const SortButton = ({ colKey, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(colKey)}
      className="inline-flex items-center gap-1 group"
    >
      {children}
      <ArrowUpDown className={`h-3.5 w-3.5 opacity-50 group-hover:opacity-80 ${sortConfig.key === colKey ? 'text-primary opacity-100' : ''}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header con titulo y boton */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button 
          onClick={handleCreate}
          className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
        >
          + Nuevo Usuario
        </Button>
      </div>

      {/* Card principal con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Usuarios</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nombre o categoría..."
                className="pl-9 bg-white border-gray-300"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" className="gap-2 border-gray-300">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2 border-gray-300">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="id">ID</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="fullName">Nombre</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="email">Email</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="role">Rol</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="code">Código</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="idCard">Cédula</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">Teléfono</TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{user.id}</TableCell>
                  <TableCell className="text-gray-700">{user.fullName}</TableCell>
                  <TableCell className="text-gray-600">{user.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.code || '-'}</TableCell>
                  <TableCell className="text-gray-600">{user.idCard || '-'}</TableCell>
                  <TableCell className="text-gray-600">{user.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                        title="Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer con paginacion */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {pageData.length} de {filtered.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-gray-300"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="border-gray-300"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para Ver Detalles */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewDialog.user && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID</Label>
                  <p className="text-sm mt-1">{viewDialog.user.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Código</Label>
                  <p className="text-sm mt-1">{viewDialog.user.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                  <p className="text-sm mt-1">{viewDialog.user.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Apellido</Label>
                  <p className="text-sm mt-1">{viewDialog.user.lastName}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm mt-1">{viewDialog.user.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cédula</Label>
                  <p className="text-sm mt-1">{viewDialog.user.idCard}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                  <p className="text-sm mt-1">{viewDialog.user.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Rol</Label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewDialog.user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {viewDialog.user.role}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog({ open: false, user: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Usuario */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Complete los campos para registrar un nuevo usuario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-firstName">Nombre *</Label>
                <Input
                  id="create-firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  className={formErrors.firstName ? 'border-red-500' : ''}
                />
                {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="create-lastName">Apellido *</Label>
                <Input
                  id="create-lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  className={formErrors.lastName ? 'border-red-500' : ''}
                />
                {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-code">Código *</Label>
                <Input
                  id="create-code"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  className={formErrors.code ? 'border-red-500' : ''}
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <Label htmlFor="create-idCard">Cédula *</Label>
                <Input
                  id="create-idCard"
                  value={formData.idCard}
                  onChange={(e) => handleFormChange('idCard', e.target.value)}
                  className={formErrors.idCard ? 'border-red-500' : ''}
                />
                {formErrors.idCard && <p className="text-xs text-red-500 mt-1">{formErrors.idCard}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="create-phone">Teléfono</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-password">Contraseña *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                className={formErrors.password ? 'border-red-500' : ''}
              />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35]"
            >
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Usuario */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Nombre *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  className={formErrors.firstName ? 'border-red-500' : ''}
                />
                {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="edit-lastName">Apellido *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  className={formErrors.lastName ? 'border-red-500' : ''}
                />
                {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">Nota: El código y la cédula no se pueden modificar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35]"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Eliminar Usuario */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.user && (
            <div className="py-4">
              <p className="text-sm text-gray-700">
                ¿Está seguro que desea eliminar al usuario{' '}
                <span className="font-semibold">{deleteDialog.user.fullName}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ID: {deleteDialog.user.id} | Email: {deleteDialog.user.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
