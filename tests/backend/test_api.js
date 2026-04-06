/**
 * SCRIPT DE PRUEBA INTEGRAL DE LA API BOXEN
 * Cubre: Trasteros, Contratos, Facturas e IPC.
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Iniciando pruebas integrales de la API Boxen...\n');

  try {
    // 1. Health Check
    console.log('--- 1. Health Check ---');
    const healthRes = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthRes.json();
    console.log('Status Server:', healthData.status === 'ok' ? '✅ OK' : '❌ ERROR');

    // 2. Crear un Tipo de Trastero
    console.log('\n--- 2. Gestión de Trasteros ---');
    const typeRes = await fetch(`${BASE_URL}/storage/types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Trastero Grande (Test)' })
    });
    const typeData = await typeRes.json();
    const typeId = typeData.storageType?.id || 1;
    console.log('✅ Tipo de trastero listo.');

    const unitNumber = `T-AUTO-${Math.floor(Math.random() * 1000)}`;
    const unitRes = await fetch(`${BASE_URL}/storage/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: unitNumber,
        typeId: typeId,
        price: 100, // Precio base 100 para probar bien el IPC después
        m2: 10,
        m3: 30,
        location: 'Zona Industrial',
        status: 'FREE'
      })
    });
    const unitData = await unitRes.json();
    const unitId = unitData.storageUnit?.id;
    console.log(`✅ Trastero ${unitNumber} creado con éxito.`);

    // 3. Crear un Contrato (Asumimos User ID 1 por ahora)
    // NOTA: Si no hay usuarios en la DB, este paso fallará.
    console.log('\n--- 3. Gestión de Contratos ---');
    const contractRes = await fetch(`${BASE_URL}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1, // <--- Ajustar si tu usuario tiene otro ID
        storageUnitId: unitId,
        startDate: new Date().toISOString(),
        currentPrice: 100,
        content: 'Muebles de oficina'
      })
    });
    const contractData = await contractRes.json();
    if (contractRes.ok) {
      console.log('✅ Contrato creado. El trastero ahora está OCCUPIED.');
    } else {
      console.log('⚠️ No se pudo crear contrato (¿Hay usuario con ID 1?):', contractData.message);
    }

    // 4. Generar Factura Mensual
    console.log('\n--- 4. Facturación ---');
    const invoiceRes = await fetch(`${BASE_URL}/invoices/batch-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        series: 'TEST'
      })
    });
    const invoiceData = await invoiceRes.json();
    console.log(`✅ Resultado facturación: ${invoiceData.message}`);

    // 5. Aplicar Subida de IPC (5%)
    console.log('\n--- 5. Subida de IPC (Massive Update) ---');
    const ipcRes = await fetch(`${BASE_URL}/ipc/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        percentage: 5,
        observations: "Subida anual de prueba"
      })
    });
    const ipcData = await ipcRes.json();
    if (ipcRes.ok) {
      console.log(`✅ IPC aplicado: ${ipcData.details.unitsAffected} unidades afectadas.`);
      console.log(`📈 El precio debería haber subido de 100€ a 105€.`);
    } else {
      console.log('❌ Error en IPC:', ipcData.message);
    }

    // 6. Verificar cambios finales
    console.log('\n--- 6. Verificación Final ---');
    const finalUnitRes = await fetch(`${BASE_URL}/storage/units/${unitId}`);
    const finalUnitData = await finalUnitRes.json();
    console.log(`💰 Precio final del trastero: ${finalUnitData.storageUnit.price}€`);
    
    console.log('\n\n✨ CICLO COMPLETO FINALIZADO.');

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
  }
}

runTests();
