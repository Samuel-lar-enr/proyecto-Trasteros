import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageService } from '../services/api';
import { useTrasteros } from '../contexts/TrasterosContext';
import type { StorageUnit, UpdateStorageUnitRequest } from '../types/apiTypes';

const EditTrastero: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { types, loadingTypes, refreshTypes } = useTrasteros();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trastero, setTrastero] = useState<StorageUnit | null>(null);
  const [isNewType, setIsNewType] = useState(false);

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

  useEffect(() => {
    const fetchTrastero = async () => {
      if (!id) return;

      try {
        const response = await storageService.getOne(parseInt(id));
        setTrastero(response.storageUnit);

        // Populate form with existing data
        setFormData({
          typeId: response.storageUnit.typeId.toString(),
          newTypeName: '',
          price: response.storageUnit.price.toString(),
          m2: response.storageUnit.m2.toString(),
          m3: response.storageUnit.m3.toString(),
          location: response.storageUnit.location,
          status: response.storageUnit.status,
          observations: response.storageUnit.observations || ''
        });
      } catch (err: any) {
        setError('Error al cargar el trastero');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTrastero();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'typeId') {
      if (value === 'NEW') {
        setIsNewType(true);
      } else {
        setIsNewType(false);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Check if status is changing to OCCUPIED without contract
      if (formData.status === 'OCCUPIED' && trastero?.status !== 'OCCUPIED') {
        const confirmChange = window.confirm(
          '¿Está seguro de cambiar el estado a "Ocupado"? Esto indica que el trastero tiene un contrato activo.'
        );
        if (!confirmChange) {
          setLoading(false);
          return;
        }
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