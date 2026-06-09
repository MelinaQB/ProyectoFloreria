import { useState, useEffect } from 'react';
import { Trash2, Users, Lightbulb } from 'lucide-react';
import { API_URL } from '../../config/api';
interface ClienteMetricas {
  id: number;
  nombre: string;
  email: string;
  celular: string;
  nroPedidos: number;
  totalGastado: number;
  nivel: string;
}

export const ClientesCRUD = () => {
  const [clientes, setClientes] = useState<ClienteMetricas[]>([]);
  const [cargando, setCargando] = useState(true);

  // 🔄 CONSULTA HTTP REAL AL ENDPOINT CENTRALIZADO DEL BACKEND
  const cargarClientesReal = async () => {
    try {
      // 🔒 Conectamos a la ruta central donde calculamos los conteos y sumas de PostgreSQL
      const response = await fetch(`${API_URL}/usuarios`);
      const data = await response.json();
      if (response.ok) {
        setClientes(data);
      }
    } catch (error) {
      console.error("Error al jalar clientes de la base de datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientesReal();
  }, []);

  // 🗑️ ELIMINACIÓN LÓGICA (SOFT DELETE) REAL EN POSTGRESQL
  const handleEliminarCliente = async (id: number, nombre: string) => {
    if (!window.confirm(`⚠️ ¿Estás segura de que deseas dar de baja al cliente ${nombre}? Se aplicará un borrado lógico en la base de datos.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("🌸 Cliente dado de baja correctamente de los repositorios.");
        cargarClientesReal(); // Sincroniza la UI de inmediato
      } else {
        alert("❌ No se pudo completar la baja del usuario.");
      }
    } catch (error) {
      alert("❌ Error de comunicación con el servidor NestJS.");
    }
  };

  // 📊 CÁLCULO EN TIEMPO REAL DE CLIENTES CON RANGO VIP PARA EL CUADRO DE SUGERENCIAS
  const totalVIPs = clientes.filter(c => c.nivel === 'VIP').length;

  if (cargando) {
    return <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>Conectando con la base de datos PostgreSQL...</p>;
  }

  return (
    <div className="admin-container" style={{ padding: '10px' }}>
      
      {/* Encabezado Dinámico */}
      <div style={{ textAlign: 'left', marginBottom: '25px' }}>
        <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 5px 0' }}>
          <Users size={26} style={{ color: 'var(--accent)' }} /> Gestión de Clientes Real
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Analiza el comportamiento de compra extraído directamente desde los registros de persistencia de PostgreSQL.
        </p>
      </div>

      {/* REJILLA DE DATOS COMPROBADA */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th style={{ textAlign: 'center' }}>Nro. Pedidos</th>
              <th style={{ textAlign: 'right' }}>Total Gastado</th>
              <th style={{ textAlign: 'center' }}>Nivel</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No existen clientes registrados en la base de datos aún. 🌸
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  {/* Bloque Nombre e ID Identitario */}
                  <td>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>{cliente.nombre}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{String(cliente.id).padStart(3, '0')}</span>
                    </div>
                  </td>
                  
                  {/* Bloque Datos de Contacto de la BD */}
                  <td>
                    <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'block' }}>📧 {cliente.email}</span>
                      <span style={{ display: 'block' }}>📞 {cliente.celular || 'Sin Celular'}</span>
                    </div>
                  </td>

                  {/* Número de Pedidos Reales */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#e3f2fd', padding: '4px 12px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.85rem', color: '#0d47a1' }}>
                      🛍️ {cliente.nroPedidos}
                    </span>
                  </td>

                  {/* Dinero Total Gastado en Bolivianos */}
                  <td style={{ textAlign: 'right', fontWeight: '800', color: '#2e7d32', fontSize: '1rem' }}>
                    {Number(cliente.totalGastado).toFixed(2)} Bs.
                  </td>

                  {/* Badge de Clasificación Algorítmica */}
                  <td style={{ textAlign: 'center' }}>
                    <span className="tag-badge" style={{
                      backgroundColor: cliente.nivel === 'VIP' ? '#fff3e0' : '#f5f5f5',
                      color: cliente.nivel === 'VIP' ? '#e65100' : '#616161',
                      fontWeight: 'bold', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem'
                    }}>
                      {cliente.nivel === 'VIP' ? '👑 VIP Hanami' : '🌱 Nuevo'}
                    </span>
                  </td>

                  {/* Botón de Borrado Lógico */}
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEliminarCliente(cliente.id, cliente.nombre)}
                      style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', transition: '0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 💡 CUADRO DE SUGERENCIA DINÁMICO E INTELIGENTE */}
      <div style={{ 
        marginTop: '25px', 
        padding: '20px', 
        backgroundColor: '#fffde7', 
        border: '1px dashed #f57f17', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px',
        textAlign: 'left'
      }}>
        <Lightbulb style={{ color: '#f57f17', flexShrink: 0, marginTop: '2px' }} size={20} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#f57f17', fontWeight: 'bold' }}>Sugerencia Automática de Hanami:</h4>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Detectamos un total de <b>{totalVIPs} clientes en la categoría VIP</b> dentro de PostgreSQL. Podrías premiar su lealtad enviándoles un cupón automatizado de descuento a través de sus números de WhatsApp para su próximo pedido de flores eternas.
          </p>
        </div>
      </div>

    </div>
  );
};