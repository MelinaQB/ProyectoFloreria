import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, User, Calendar, X, FileText } from 'lucide-react';
// 📄 MOTORES PARA LA GENERACIÓN DEL REPORTE INMUTABLE EN PDF
import jsPDF from 'jspdf';
import { API_URL } from '../../config/api';
import autoTable from 'jspdf-autotable';

interface Ramo {
  id: number;
  nombre: string;
  precio: number;
}

interface Venta {
  id: number;
  cantidad: number;
  totalBs: string | number;
  fechaVenta: string;
  ramo: {
    nombre: string;
    precio: number;
  };
  // 🔒 MAPEO REAL: Reemplazamos el objeto ficticio 'cliente' por la entidad real que devuelve NestJS
  admin?: {
    id: number;
    nombre: string;
    email: string;
    celular: string;
  };
}

export const VentasCRUD = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ramosDisponibles, setRamosDisponibles] = useState<Ramo[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [ramoSeleccionadoId, setRamoSeleccionadoId] = useState('');
  const [cantidadVenta, setCantidadVenta] = useState(1);

  const API_VENTAS = `${API_URL}/ventas`;
  const API_RAMOS = `${API_URL}/ramos`;

  const obtenerAdminIdReal = (): number => {
    return Number(localStorage.getItem('hanami_uid')) || 1;
  };

  const cargarDatosVentas = async () => {
    try {
      const [resVentas, resRamos] = await Promise.all([
        fetch(API_VENTAS),
        fetch(API_RAMOS)
      ]);

      if (resVentas.ok) {
        const datosVentas = await resVentas.json();
        // 🔒 SIN MOCKS: Guardamos directamente el arreglo real y transparente de PostgreSQL
        setVentas(datosVentas);
      }
      
      if (resRamos.ok) {
        setRamosDisponibles(await resRamos.json());
      }
    } catch (err) {
      console.error("Error al sincronizar transacciones de ventas:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosVentas();
  }, []);

  const handleRegistrarVentaManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ramoSeleccionadoId) {
      alert("⚠️ Selecciona un modelo de ramo del catálogo.");
      return;
    }

    const payload = {
      ramoId: Number(ramoSeleccionadoId),
      cantidad: Number(cantidadVenta),
      adminId: obtenerAdminIdReal()
    };

    try {
      const res = await fetch(API_VENTAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("🛍️ ¡Venta procesada! Los paquetes de materiales han sido reducidos en PostgreSQL.");
        setRamoSeleccionadoId('');
        setCantidadVenta(1);
        setMostrarForm(false);
        cargarDatosVentas(); // Recarga la tabla de ventas e inventario
      } else {
        alert(`❌ Operación Rechazada por el Sistema: ${data.message}`);
      }
    } catch (err) {
      alert("❌ Error de comunicación con el motor transaccional.");
    }
  };

  // 📝 EXPORTACIÓN DE REPORTES TRANSACCIONALES EXCLUSIVOS A PDF (REQUISITO OBLIGATORIO)
  const exportarPDF = () => {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleString('es-BO');

    // 1. Diseño Estético y Membrete Superior de la Marca
    doc.setFillColor(126, 87, 194); // Tono de la marca Hanami (#7e57c2)
    doc.rect(0, 0, 220, 25, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("CREACIONES HANAMI - MONITOR DE VENTAS", 14, 16);

    // 2. Metadatos de Auditoría del Reporte
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de Emisión: ${fechaActual}`, 14, 34);
    doc.text(`Encargado: Administrador General`, 14, 40);
    doc.text(`Origen de Datos: Persistencia Relacional de PostgreSQL`, 14, 46);

    // 3. Mapear Arreglo del Estado de Ventas a Filas Nativas del PDF (Nombre + Celular con salto de línea)
    const filasTabla = ventas.map((v) => {
      const nombreComprador = v.admin?.nombre || 'Usuario Registrado';
      const celularComprador = v.admin?.celular ? `• ${v.admin.celular}` : '';
      const celdaCompradorDetalle = `${nombreComprador}${celularComprador ? `\n${celularComprador}` : ''}`;

      return [
        `#${String(v.id).padStart(4, '0')}`,
        new Date(v.fechaVenta).toLocaleString('es-BO'),
        celdaCompradorDetalle,
        v.ramo?.nombre || 'N/A',
        `${v.cantidad} ud.`,
        `${Number(v.totalBs).toFixed(2)} Bs.`
      ];
    });

    // Calcular la sumatoria absoluta de la caja actual
    const granTotal = ventas.reduce((acc, curr) => acc + Number(curr.totalBs), 0);

    // 4. Inyección de la Tabla Estructurada con jsPDF AutoTable
    autoTable(doc, {
      startY: 52,
      head: [['ID Venta', 'Fecha y Hora', 'Comprador / Cuenta', 'Detalle del Arreglo', 'Cantidad', 'Total Cobrado']],
      body: filasTabla,
      headStyles: { fillColor: [126, 87, 194], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        4: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      // Pie de página dinámico con el totalizado general
      didDrawPage: (data) => {
        const finalY = (data as any).cursor.y + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(46, 125, 50); // Color verde contable
        doc.text(`TOTAL ACUMULADO EN CAJA: ${granTotal.toFixed(2)} Bs.`, 14, finalY);
      }
    });

    // 5. Descarga Mandatoria Automática en el Navegador
    doc.save(`Reporte_Ventas_Hanami_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (cargando) return <p style={{ padding: '20px' }}>Sincronizando pasarela de pedidos relacionales...</p>;

  return (
    <div className="admin-container" style={{ padding: '10px' }}>
      
      {/* HEADER CARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <ShoppingBag size={26} style={{ color: 'var(--accent)' }} /> Monitor de Ventas y Pedidos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px', margin: 0 }}>
            Registro en tiempo real de compras de clientes con trigger de descuento automático de insumos.
          </p>
        </div>
        
        {/* 📋 BOTONES DE ACCIÓN COMPARTIDOS (NUEVO BOTÓN DE EXPORTACIÓN PDF INCLUIDO) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportarPDF} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', height: '38px', 
              padding: '0 15px', borderRadius: '8px', cursor: 'pointer', 
              border: '1px solid #7e57c2', backgroundColor: 'white', color: '#7e57c2', fontWeight: 'bold' 
            }}
          >
            <FileText size={16} /> Descargar PDF
          </button>

          <button onClick={() => setMostrarForm(!mostrarForm)} className="sidebar-btn-active" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '38px', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
            {mostrarForm ? <X size={16} /> : <Plus size={16} />} {mostrarForm ? 'Cancelar' : 'Registrar Venta Directa'}
          </button>
        </div>
      </div>

      {/* FORMULARIO DE VENTA MANUAL */}
      {mostrarForm && (
        <form onSubmit={handleRegistrarVentaManual} style={{ 
          backgroundColor: 'white', padding: '25px', borderRadius: '12px', 
          border: '1px solid var(--border)', marginBottom: '25px', textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'var(--accent)' }}>🛒 Nueva Transacción Directa (Mostrador / WhatsApp)</h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Seleccionar Ramo Vendido:</label>
              <select className="role-select" style={{ width: '100%', height: '38px' }} value={ramoSeleccionadoId} onChange={e => setRamoSeleccionadoId(e.target.value)} required>
                <option value="">-- Elige un ramo del catálogo público --</option>
                {ramosDisponibles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} ({Number(r.precio).toFixed(2)} Bs.)</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Cantidad de Arreglos:</label>
              <input type="number" className="role-select" style={{ width: '100%', height: '38px' }} value={cantidadVenta} onChange={e => setCantidadVenta(Math.max(1, Number(e.target.value)))} min="1" required />
            </div>
            <button type="submit" className="sidebar-btn-active" style={{ height: '38px', padding: '0 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              🔒 Confirmar Pago y Descontar Stock
            </button>
          </div>
        </form>
      )}

      {/* TABLA PRINCIPAL RELACIONAL */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Fecha y Hora</th>
              <th>Comprador / Cuenta</th>
              <th>Detalle del Arreglo</th>
              <th style={{ textAlign: 'center' }}>Cantidad</th>
              <th style={{ textAlign: 'right' }}>Total Cobrado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  Aún no se han registrado transacciones comerciales en el sistema. 🌸
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id}>
                  <td><code>#{String(v.id).padStart(4, '0')}</code></td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} /> {new Date(v.fechaVenta).toLocaleString('es-BO')}
                    </span>
                  </td>
                  
                  {/* 🔒 CELDA DE CONTROL REAL: Sincronizada con la relación 'admin' de la Base de Datos */}
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={14} style={{ color: 'var(--accent)' }} /> 
                        {v.admin?.nombre || 'Usuario Registrado'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '18px' }}>
                        {v.admin?.email || 'Sin correo electrónico'} {v.admin?.celular && `• ${v.admin.celular}`}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>{v.ramo?.nombre}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ backgroundColor: '#f5f5f5', padding: '3px 12px', borderRadius: '50px', fontSize: '0.85rem' }}>
                      {v.cantidad} ud.
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2e7d32', fontSize: '1.05rem' }}>
                    {Number(v.totalBs).toFixed(2)} Bs.
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};