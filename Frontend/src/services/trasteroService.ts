import type { Trastero } from '../types/trasteroTypes';

export const mockTrasteros: Trastero[] = [
  {
    id: 1,
    numero: 'T001',
    m2: 10,
    clienteNombre: 'Juan Pérez',
    precio: 50,
    estado: 'Disponible',
    descripcion: 'Trastero pequeño en zona A',
    ubicacion: 'Planta baja',
    fechaCreacion: '01-01-2026',
  },
  {
    id: 2,
    numero: 'T002',
    m2: 20,
    clienteNombre: 'María García',
    precio: 80,
    estado: 'Ocupado',
    descripcion: 'Trastero mediano en zona B',
    ubicacion: 'Primer piso',
    fechaCreacion: '01-02-2026',
  },
  {
    id: 3,
    numero: 'T003',
    m2: 15,
    clienteNombre: 'Carlos López',
    precio: 65,
    estado: 'Disponible',
    descripcion: 'Trastero mediano en zona C',
    ubicacion: 'Segundo piso',
    fechaCreacion: '01-03-2026',
  },
  // Añadir más si es necesario
];

export const getTrasteros = (): Trastero[] => {
  return mockTrasteros;
};

export const getTrasteroById = (id: number): Trastero | undefined => {
  return mockTrasteros.find(t => t.id === id);
};