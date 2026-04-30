import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageService, contractService, authService } from '../services/api';
import { useTrasteros } from '../contexts/TrasterosContext';
import type { StorageUnit, UpdateStorageUnitRequest, AssignClientRequest, User } from '../types/apiTypes';

const EditTrastero: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { types, loadingTypes, refreshTypes } = useTrasteros();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trastero, setTrastero] = useState<StorageUnit | null>(null);
  const [isNewType, setIsNewType] = useState(false);

  // Client search state
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    typeId: '',
    newTypeName: '',
    price: '',
    m2: '',
    m3: '',
    location: '',
    status: 'FREE',
    observations: ''
  });

  const [assignData, setAssignData] = useState({
    clientName: '',
    dniNif: '',
    startDate: new Date().toISOString().split('T')[0],
    content: '',
    insuranceCoverage: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const [showAssignSection, setShowAssignSection] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [trasteroRes, usersRes] = await Promise.all([
          storageService.getOne(parseInt(id)),
          authService.getUsers()
        ]);

        setTrastero(trasteroRes.storageUnit);
        // Filtrar solo usuarios que tengan DNI/NIF para la asignación
        const validUsers = (usersRes || []).filter((u: any) => u.dniNif);
        setUsers(validUsers);

        // Populate form with existing data
        setFormData({
          typeId: trasteroRes.storageUnit.typeId.toString(),
          newTypeName: '',
          price: trasteroRes.storageUnit.price.toString(),
          m2: trasteroRes.storageUnit.m2.toString(),
          m3: trasteroRes.storageUnit.m3.toString(),
          location: trasteroRes.storageUnit.location,
          status: trasteroRes.storageUnit.status,
          observations: trasteroRes.storageUnit.observations || ''
        });
      } catch (err: any) {
        setError('Error al cargar datos');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'typeId') {
      if (value === 'NEW') {
        setIsNewType(true);
      } else {
        setIsNewType(false);
      }
    }

    if (name === 'status') {
      setShowAssignSection(
        value === 'OCCUPIED' && trastero?.status === 'FREE' ? true : false
      );
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'clientName') {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(value.toLowerCase()) || 
        (u.surname && u.surname.toLowerCase().includes(value.toLowerCase())) ||
        (u.dniNif && u.dniNif.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    }

    setAssignData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectUser = (user: User) => {
    setAssignData(prev => ({
      ...prev,
      clientName: `${user.name} ${user.surname || ''}`.trim(),
      dniNif: user.dniNif || ''
    }));
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Si estamos asignando un cliente
      if (showAssignSection) {
        const assignRequest: AssignClientRequest = {
          storageUnitId: parseInt(id),
          clientName: assignData.clientName,
          dniNif: assignData.dniNif,
          startDate: new Date(assignData.startDate).toISOString(),
          content: assignData.content || undefined,
          insuranceCoverage: assignData.insuranceCoverage ? parseFloat(assignData.insuranceCoverage) : undefined,
        };

        await contractService.assignClient(assignRequest);
        // El backend ya actualiza el estado del trastero a OCCUPIED
      }

      // Check if status is changing FROM OCCUPIED to any other status
      if (trastero?.status === 'OCCUPIED' && formData.status !== 'OCCUPIED') {
        const confirmChange = window.confirm(
          'Hay un contrato activo sobre este trastero. ¿Está seguro de que desea cambiar su estado? Necesita confirmar para proceder.'
        );
        if (!confirmChange) {
          setLoading(false);
          return;
        }
      }

      // Actualizar datos básicos del trastero (precio, metros, etc.)
      let finalTypeId = parseInt(formData.typeId);

      // Si es un nuevo tipo, crearlo primero
      if (isNewType) {
        if (!formData.newTypeName.trim()) {
          throw new Error('El nombre del nuevo tipo es requerido');
        }
        const typeRes = await storageService.createType({ description: formData.newTypeName });
        finalTypeId = typeRes.storageType.id;
        await refreshTypes(); // Actualizar tipos en el contexto global
      }

      const data: UpdateStorageUnitRequest = {
        typeId: finalTypeId,
        price: parseFloat(formData.price),
        m2: parseFloat(formData.m2),
        m3: parseFloat(formData.m3),
        location: formData.location,
        status: formData.status as 'FREE' | 'OCCUPIED' | 'RESERVED' | 'NOT_AVAILABLE',
        observations: formData.observations || undefined
      };

      await storageService.update(parseInt(id), data);
      navigate('/trasteros');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el trastero');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="edit-trastero-page">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">Cargando trastero...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trastero) {
    return (
      <div className="edit-trastero-page">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center text-red-600">Trastero no encontrado</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-trastero-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Editar Trastero {trastero.number}
              </h1>
              <button
                onClick={() => navigate('/trasteros')}
                className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
              >
                ← Volver
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={isNewType ? 'md:col-span-2' : ''}>
                  <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Trastero *
                  </label>
                  <div className={`grid gap-4 ${isNewType ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    <select
                      id="typeId"
                      name="typeId"
                      value={formData.typeId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {loadingTypes ? (
                        <option>Cargando tipos...</option>
                      ) : (
                        <>
                          {types.map(t => (
                            <option key={t.id} value={t.id}>{t.description}</option>
                          ))}
                          <option value="NEW" style={{ fontWeight: 'bold', color: '#2563eb' }}>+ Asignar nuevo tipo</option>
                        </>
                      )}
                    </select>

                    {isNewType && (
                      <input
                        type="text"
                        name="newTypeName"
                        value={formData.newTypeName}
                        onChange={handleInputChange}
                        placeholder="Nombre del nuevo tipo"
                        required
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FREE">Libre</option>
                    <option value="OCCUPIED">Ocupado</option>
                    <option value="RESERVED">Reservado</option>
                    <option value="NOT_AVAILABLE">No Disponible</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (€/mes) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Planta baja, Sector A"
                  />
                </div>

                <div>
                  <label htmlFor="m2" className="block text-sm font-medium text-gray-700 mb-2">
                    Metros Cuadrados (m²) *
                  </label>
                  <input
                    type="number"
                    id="m2"
                    name="m2"
                    value={formData.m2}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="m3" className="block text-sm font-medium text-gray-700 mb-2">
                    Metros Cúbicos (m³) *
                  </label>
                  <input
                    type="number"
                    id="m3"
                    name="m3"
                    value={formData.m3}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {showAssignSection && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mt-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <span className="mr-2">👤</span> Datos del cliente actual
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative" ref={dropdownRef}>
                      <label htmlFor="clientName" className="block text-sm font-medium text-blue-900 mb-2">
                        Nombre Cliente *
                      </label>
                      <input
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={assignData.clientName}
                        onChange={handleAssignChange}
                        onFocus={() => {
                          setFilteredUsers(users);
                          setShowUserDropdown(true);
                        }}
                        required={showAssignSection}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Escribe para buscar o seleccionar..."
                        autoComplete="off"
                      />
                      {showUserDropdown && filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredUsers.map(user => (
                            <div
                              key={user.id}
                              className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                              onClick={() => selectUser(user)}
                            >
                              <div className="font-medium text-gray-800">{user.name} {user.surname}</div>
                              <div className="text-xs text-gray-500">DNI: {user.dniNif} | {user.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="dniNif" className="block text-sm font-medium text-blue-900 mb-2">
                        DNI/CIF/NIF *
                      </label>
                      <input
                        type="text"
                        id="dniNif"
                        name="dniNif"
                        value={assignData.dniNif}
                        onChange={handleAssignChange}
                        required={showAssignSection}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Documento de identidad"
                      />
                    </div>
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-blue-900 mb-2">
                        Fecha de inicio *
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={assignData.startDate}
                        onChange={handleAssignChange}
                        max={today}
                        required={showAssignSection}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="insuranceCoverage" className="block text-sm font-medium text-blue-900 mb-2">
                        Cobertura de seguro (€)
                      </label>
                      <input
                        type="number"
                        id="insuranceCoverage"
                        name="insuranceCoverage"
                        value={assignData.insuranceCoverage}
                        onChange={handleAssignChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="content" className="block text-sm font-medium text-blue-900 mb-2">
                        Contenido declarado
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        value={assignData.content}
                        onChange={handleAssignChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descripción del contenido del trastero..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  id="observations"
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observaciones adicionales sobre el trastero..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/trasteros')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Trastero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTrastero;