/**
 * TEST DE FACTURACIÓN CON DETALLE DE ERRORES/AVISOS
 */
const BASE_URL = 'http://localhost:3000/api';

async function testInvoiceSequence() {
  console.log('🧪 Probando secuencia de facturación (lanzamiento repetido):');
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  try {
    // 1. Lanzamos facturación para el mes actual
    const res = await fetch(`${BASE_URL}/invoices/batch-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, series: 'A' })
    });
    
    const data = await res.json();
    console.log(`\n📅 MENSAJE PRINCIPAL: ${data.message}`);

    // 2. Si hay avisos (como duplicados), los mostramos uno a uno
    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️ DETALLES DE AVISOS/ERRORES:');
      data.errors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ Proceso completado sin avisos.');
    }

    // 3. Consultamos la última factura creada
    const listRes = await fetch(`${BASE_URL}/invoices`);
    const listData = await listRes.json();
    
    if (listData.invoices && listData.invoices.length > 0) {
      const last = listData.invoices[0];
      console.log(`\n📊 ÚLTIMA FACTURA EN BD: ${last.number}`);
    }

  } catch (error) {
    console.error('❌ Error crítico en el test:', error.message);
  }
}

testInvoiceSequence();
