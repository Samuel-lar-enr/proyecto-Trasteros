# 📦 Documentación Técnica: Módulo Boxen (Gestión de Trasteros)

Este documento detalla la arquitectura del backend implementada para la gestión integral de trasteros, contratos, facturación e incrementos de IPC.

---

## 🗂️ 1. Modelo de Datos (Prisma Schema)

### **`StorageType`** (Categorías)
- **`id`**: `Int` (Autoincremental, PK)
- **`description`**: `String` (Nombre del tipo de trastero)
- **Relaciones**: Un tipo puede tener muchas unidades (`StorageUnit`).

### **`StorageUnit`** (Unidades Físicas)
- **`id`**: `Int` (PK)
- **`number`**: `String` (Identificador único, ej: "T-01")
- **`price`**: `Decimal` (Precio mensual base para nuevos alquileres)
- **`m2` / `m3`**: `Decimal` (Metros cuadrados y cúbicos)
- **`location`**: `String` (Ubicación física simple)
- **`status`**: `Enum` (`FREE`, `OCCUPIED`, `RESERVED`, `NOT_AVAILABLE`)
- **`observations`**: `String?` (Notas internas)
- **Relaciones**: Pertenece a un `StorageType`. Vinculado a `Contract` e `Invoice`.

### **`Contract`** (Alquileres)
- **`id`**: `Int` (PK)
- **`userId`**: `Int` (FK -> `User`)
- **`storageUnitId`**: `Int` (FK -> `StorageUnit`)
- **`startDate`**: `DateTime` (Inicio del alquiler)
- **`endDate`**: `DateTime?` (Fin del alquiler o rescisión)
- **`currentPrice`**: `Decimal` (Precio real que paga el cliente mensualmente)
- **`content`**: `String?` (Descripción de lo almacenado)
- **`insuranceCoverage`**: `Decimal?` (Importe asegurado)
- **`isActive`**: `Boolean` (Estado del alquiler actual)

### **`Invoice`** (Facturación)
- **`id`**: `Int` (PK)
- **`number`**: `String` (Número único de factura, ej: "A-202404-12")
- **`series`**: `String` (Serie de facturación, ej: "A")
- **`taxBase`**: `Decimal` (Base imponible)
- **`vatAmount`**: `Decimal` (Cuota de IVA - 21% por defecto)
- **`total`**: `Decimal` (Importe total con IVA)
- **`status`**: `Enum` (`PENDING`, `PAID`, `RETURNED`)

### **`IpcBatch` & `IpcHistory`** (Historial IPC)

### **`IpcBatch`** (Procesos de Subida)
- **`id`**: `Int` (PK)
- **`date`**: `DateTime` (Fecha en la que se aplicó la subida)
- **`percentage`**: `Decimal` (Porcentaje aplicado, ej: 5.00)
- **`observations`**: `String?` (Notas del administrador)
- **Relaciones**: Contiene muchas entradas de historial (`IpcHistory`).

### **`IpcHistory`** (Auditoría por Unidad)
- **`id`**: `Int` (PK)
- **`batchId`**: `Int` (FK -> `IpcBatch`)
- **`storageUnitId`**: `Int` (FK -> `StorageUnit`)
- **`oldPrice`**: `Decimal` (Precio base antes de la subida)
- **`newPrice`**: `Decimal` (Precio base después de la subida)
- **`difference`**: `Decimal` (Diferencia monetaria total en la base)
- **`oldContractPrice`**: `Decimal` (Precio del contrato vigente antes)
- **`newContractPrice`**: `Decimal` (Precio del contrato vigente después)

---

## 🛠️ 2. Lógica de Negocio Implementada

1.  **Sincronización Automática de Estado**: 
    - Al crear un `Contract` activo, la unidad asignada pasa automáticamente a `OCCUPIED`.
    - Al finalizar (`terminateContract`), la unidad vuelve a `FREE`.
2.  **Facturación Mensual por Lote**:
    - El sistema puede generar en segundos todas las facturas de los contratos activos para un mes dado, controlando duplicados mediante un número de factura inteligente.
3.  **Proceso Masivo de IPC**:
    - Aplica un porcentaje de subida a **Precios Base** y **Contratos Activos** simultáneamente dentro de una transacción de base de datos segura.
4.  **Validación de Datos (Zod)**:
    - Todos los datos entrantes (precios positivos, fechas válidas, estados correctos) son validados antes de tocar la base de datos.

---

## 🛣️ 3. Endpoints de la API

### **Gestión de Trasteros (`/api/storage`)**
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `GET` | `/units` | Listar trasteros con filtros (status, tipo) | Libre |
| `POST` | `/units` | Crear nuevo trastero | Admin |
| `GET` | `/units/:id` | Detalle de unidad (incluye contratos) | Auth |
| `PATCH` | `/units/:id` | Actualizar datos del trastero | Admin |
| `DELETE` | `/units/:id` | Borrar (solo si no hay contratos activos) | Admin |
| `GET` | `/types` | Listar tipos de trastero | Libre |

### **Gestión de Contratos (`/api/contracts`)**
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Crear nuevo alquiler (y ocupa unidad) | Admin |
| `GET` | `/` | Listar todos los contratos | Admin |
| `GET` | `/:id` | Ver detalle de un contrato | Auth |
| `POST` | `/:id/terminate` | Finalizar alquiler (y libera unidad) | Admin |

### **Facturación (`/api/invoices`)**
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Crear factura individual manual | Admin |
| `POST` | `/batch-generate` | Generar facturas de todos los activos | Admin |
| `GET` | `/` | Listar facturas | Admin |
| `PATCH` | `/:id/status` | Cambiar estado (Pagada, Pendiente, etc) | Admin |

### **Gestión de IPC (`/api/ipc`)**
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `POST` | `/apply` | Ejecutar subida porcentual masiva | Admin |
| `GET` | `/batches` | Ver historial de procesos IPC | Admin |

---

## 🛡️ 4. Seguridad y Autenticación
- El sistema utiliza **JWT (JSON Web Tokens)**.
- El middleware `requireAuth` protege el acceso individual.
- El middleware `requireAdmin` restringe las acciones críticas (crear, borrar, subir IPC) solo a administradores.
- Se puede desactivar globalmente mediante `AUTH_REQUIRED=false` en el `.env` para desarrollo.
