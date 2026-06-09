import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Check, X, Scissors, AlertTriangle } from 'lucide-react';

interface Material {
  id: number;
  nombre: string;
  detalle: string;
  stock: number; // Paquetes cerrados
  unidadesPorPaquete: number;
  unidadesSueltas: number; 
}

export const MaterialesCRUD = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDetalle, setNuevoDetalle] = useState('');
  const [nuevoStock, setNuevoStock] = useState(0);
  const [nuevasUnidadesPorPaquete, setNuevasUnidadesPorPaquete] = useState(100); 

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDetalle, setEditDetalle] = useState('');
  const [editStock, setEditStock] = useState(0);

  const API_URL = 'http://localhost:3000/materiales';

  const obtenerAdminIdReal = (): number => {
    return Number(localStorage.getItem('hanami_uid')) || 1;
  };

  const cargarMateriales = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (res.ok) setMateriales(data);
    } catch (err) {
      console.error("Error cargando inventario:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoDetalle.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoNombre,
          detalle: nuevoDetalle,
          stock: Number(nuevoStock),
          unidadesPorPaquete: Number(nuevasUnidadesPorPaquete), 
          adminId: obtenerAdminIdReal()
        }),
      });
      if (res.ok) {
        alert("✨ Material registrado con éxito.");
        setNuevoNombre(''); setNuevoDetalle(''); setNuevoStock(0); setNuevasUnidadesPorPaquete(100);
        setMostrarForm(false);
        cargarMateriales();
      }
    } catch (err) {
      alert("❌ Error al guardar insumo.");
    }
  };

  const handleGuardarEdicion = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editNombre,
          detalle: editDetalle,
          stock: Number(editStock),
          adminId: obtenerAdminIdReal()
        }),
      });
      if (res.ok) {
        alert("📝 Insumo actualizado.");
        setEditandoId(null);
        cargarMateriales();
      }
    } catch (err) {
      alert("❌ Error al modificar.");
    }
  };

  const handleEliminar = async (id: number, descripcion: string) => {
    if (!window.confirm(`⚠️ ¿Deseas aplicar una baja lógica al material "${descripcion}"?`)) return;
    
    const adminId = obtenerAdminIdReal();
    try {
      const res = await fetch(`${API_URL}/${id}?adminId=${adminId}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        alert("🗑️ Insumo dado de baja de los almacenes.");
        cargarMateriales();
      }
    } catch (err) {
      alert("❌ Error al eliminar.");
    }
  };

  const handleIniciarEdicion = (m: Material) => {
    setEditandoId(m.id);
    setEditNombre(m.nombre);
    setEditDetalle(m.detalle);
    setEditStock(m.stock);
  };

  if (cargando) return <p style={{ padding: '20px' }}>Conectando con PostgreSQL...</p>;

  return (
    <div className="admin-container" style={{ padding: '10px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Scissors size={26} style={{ color: 'var(--accent)' }} /> Inventario de Materiales Real
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px', margin: 0 }}>
            Control de insumos por tipo y color exacto conectado de forma inmutable a PostgreSQL.
          </p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="sidebar-btn-active" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '38px', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
          {mostrarForm ? 'Cancelar' : 'Nuevo Material'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} style={{ 
          display: 'flex', gap: '15px', backgroundColor: 'white', padding: '20px', 
          borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '25px', alignItems: 'flex-end'
        }}>
          <div style={{ flex: 2, textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Material / Insumo:</label>
            <input type="text" className="role-select" style={{ width: '100%', height: '38px' }} placeholder="Ej: Limpiapipas o Silicona" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required />
          </div>
          <div style={{ flex: 2, textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Color / Detalle:</label>
            <input type="text" className="role-select" style={{ width: '100%', height: '38px' }} placeholder="Ej: Rosa Pastel o Transparente" value={nuevoDetalle} onChange={e => setNuevoDetalle(e.target.value)} required />
          </div>
          
          <div style={{ flex: 1, textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Unidades x Paquete:</label>
            <input type="number" className="role-select" style={{ width: '100%', height: '38px' }} value={nuevasUnidadesPorPaquete} onChange={e => setNuevasUnidadesPorPaquete(Number(e.target.value))} min="1" required />
          </div>

          <div style={{ flex: 1, textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Stock Inicial (Paquetes):</label>
            <input type="number" className="role-select" style={{ width: '100%', height: '38px' }} value={nuevoStock} onChange={e => setNuevoStock(Number(e.target.value))} min="0" required />
          </div>
          <button type="submit" className="sidebar-btn-active" style={{ height: '38px', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
            Guardar
          </button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Material / Insumo</th>
              <th>Color / Detalle</th>
              <th style={{ textAlign: 'center' }}>Contenido x Paquete</th>
              <th style={{ textAlign: 'center' }}>Stock Actual</th>
              <th style={{ textAlign: 'center' }}>Alerta</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materiales.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No existen insumos cargados en los repositorios todavía. 🌸
                </td>
              </tr>
            ) : (
              materiales.map((m) => {
                const esCritico = m.stock <= 5;
                return (
                  <tr key={m.id}>
                    <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                      {editandoId === m.id ? (
                        <input type="text" className="role-select" style={{ width: '90%' }} value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                      ) : ( m.nombre )}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {editandoId === m.id ? (
                        <input type="text" className="role-select" style={{ width: '90%' }} value={editDetalle} onChange={e => setEditDetalle(e.target.value)} />
                      ) : (
                        <span className="tag-badge" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {m.detalle}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span style={{ backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                        1 Paq. = {m.unidadesPorPaquete || 100} unidades
                      </span>
                    </td>

                    {/* 🔒 CELDA DE STOCK ACTUALIZADA: Muestra paquetes y unidades sueltas remanentes */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {editandoId === m.id ? (
                          <input type="number" className="role-select" style={{ width: '80px', textAlign: 'center' }} value={editStock} onChange={e => setEditStock(Number(e.target.value))} min="0" />
                        ) : ( 
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {m.stock} Paquetes
                          </span> 
                        )}
                        
                        {/* Insignia reactiva si el residuo es mayor a cero */}
                        {editandoId !== m.id && m.unidadesSueltas > 0 && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#673ab7', 
                            backgroundColor: '#f3e5f5', 
                            padding: '1px 8px', 
                            borderRadius: '50px', 
                            marginTop: '4px',
                            fontWeight: '600'
                          }}>
                            + {m.unidadesSueltas} uds. sueltas
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold',
                        color: esCritico ? '#ff8f00' : '#2e7d32', backgroundColor: esCritico ? '#fff8e1' : '#e8f5e9',
                        padding: '4px 10px', borderRadius: '6px'
                      }}>
                        {esCritico && <AlertTriangle size={12} />}
                        {esCritico ? '¡Comprar más!' : 'OK'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editandoId === m.id ? (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => handleGuardarEdicion(m.id)} style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer' }}><Check size={18} /></button>
                          <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                          <button onClick={() => handleIniciarEdicion(m)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleEliminar(m.id, `${m.nombre} ${m.detalle}`)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};