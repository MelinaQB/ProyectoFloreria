import { useState, useEffect } from 'react';
import { Trash2, Plus, Layers, X } from 'lucide-react';
import { API_URL } from '../../config/api';
interface Material {
  id: number;
  nombre: string;
  detalle: string;
  stock: number; // Cantidad de paquetes (ej: 3, 10, 20)
  unidadesPorPaquete: number; // Cantidad de unidades reales x paquete (ej: 100, 50, 6)
}

interface ItemReceta {
  materialId: number;
  nombre: string;
  detalle: string;
  cantidadNecesaria: number; // Unidades sueltas que consumirá el ramo
}

interface Ramo {
  id: number;
  nombre: string;
  precio: string | number;
  receta: {
    id: number;
    cantidadNecesaria: number;
    material: {
      nombre: string;
      detalle: string;
      unidadesPorPaquete: number;
    };
  }[];
}

export const RamosCRUD = () => {
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [materialesDisponibles, setMaterialesDisponibles] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  const [recetaTemporal, setRecetaTemporal] = useState<ItemReceta[]>([]);
  const [materialSeleccionadoId, setMaterialSeleccionadoId] = useState('');
  const [cantidadMaterial, setCantidadMaterial] = useState(1);

  const API_RAMOS = `${API_URL}/ramos`;
  const API_MATERIALES = `${API_URL}/materiales`;

  const obtenerAdminIdReal = (): number => {
    return Number(localStorage.getItem('hanami_uid')) || 1;
  };

  const cargarDatosIniciales = async () => {
    try {
      const [resRamos, resMateriales] = await Promise.all([
        fetch(API_RAMOS),
        fetch(API_MATERIALES)
      ]);
      if (resRamos.ok) setRamos(await resRamos.json());
      if (resMateriales.ok) setMaterialesDisponibles(await resMateriales.json());
    } catch (err) {
      console.error("Error sincronizando catálogo:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleAgregarInsumoAReceta = () => {
    if (!materialSeleccionadoId) return;
    const matReal = materialesDisponibles.find(m => m.id === Number(materialSeleccionadoId));
    if (!matReal) return;

    // 🧮 VALIDACIÓN DE INGENIERÍA: Calculamos el total de unidades sueltas que hay en almacén
    const unidadesTotalesDisponibles = matReal.stock * matReal.unidadesPorPaquete;
    const cantidadA_Agregar = Number(cantidadMaterial);

    // Revisar si ya agregamos este material antes a la lista temporal
    const existente = recetaTemporal.find(r => r.materialId === matReal.id);
    const cantidadFinalSimulada = existente ? existente.cantidadNecesaria + cantidadA_Agregar : cantidadA_Agregar;

    // Control de seguridad: No dejar que el usuario asigne más unidades de las que físicamente existen
    if (cantidadFinalSimulada > unidadesTotalesDisponibles) {
      alert(`⚠️ Stock Insuficiente. Intentas usar ${cantidadFinalSimulada} unidades, pero en almacén solo tienes ${unidadesTotalesDisponibles} unidades totales (${matReal.stock} paquetes de ${matReal.unidadesPorPaquete}u).`);
      return;
    }

    if (existente) {
      setRecetaTemporal(recetaTemporal.map(r => 
        r.materialId === matReal.id ? { ...r, cantidadNecesaria: cantidadFinalSimulada } : r
      ));
    } else {
      setRecetaTemporal([...recetaTemporal, {
        materialId: matReal.id,
        nombre: matReal.nombre,
        detalle: matReal.detalle,
        cantidadNecesaria: cantidadA_Agregar
      }]);
    }
    setMaterialSeleccionadoId('');
    setCantidadMaterial(1);
  };

  const handleRemoverInsumoTemporal = (matId: number) => {
    setRecetaTemporal(recetaTemporal.filter(r => r.materialId !== matId));
  };

  const handleCrearRamo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoPrecio || recetaTemporal.length === 0) {
      alert("⚠️ Por favor, rellena los campos y añade al menos un insumo a tu fórmula técnica.");
      return;
    }

    const payload = {
      nombre: nuevoNombre,
      precio: Number(nuevoPrecio),
      adminId: obtenerAdminIdReal(),
      materiales: recetaTemporal.map(r => ({
        materialId: Number(r.materialId),
        cantidadNecesaria: Number(r.cantidadNecesaria)
      }))
    };

    try {
      const res = await fetch(API_RAMOS, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("🌸 ¡Excelente! Modelo de Ramo y su receta guardados correctamente en PostgreSQL.");
        setNuevoNombre('');
        setNuevoPrecio('');
        setRecetaTemporal([]);
        setMostrarForm(false);
        cargarDatosIniciales();
      } else {
        const errorData = await res.json();
        alert(`❌ Error al guardar: ${errorData.message}`);
      }
    } catch (err) {
      alert("❌ No hay comunicación con el servidor backend.");
    }
  };

  const handleEliminarRamo = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Deseas dar de baja el ramo "${nombre}" del catálogo público?`)) return;
    try {
      const res = await fetch(`${API_RAMOS}/${id}?adminId=${obtenerAdminIdReal()}`, { method: 'DELETE' });
      if (res.ok) {
        alert("🗑️ Ramo removido con éxito.");
        cargarDatosIniciales();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) return <p style={{ padding: '20px' }}>Sincronizando recetas de producción de Hanami...</p>;

  return (
    <div className="admin-container" style={{ padding: '10px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Layers size={26} style={{ color: 'var(--accent)' }} /> Catálogo de Ramos y Fórmulas
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px', margin: 0 }}>
            Configuración de arreglos y cálculo de consumo unitario mapeado a PostgreSQL.
          </p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="sidebar-btn-active" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '38px', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
          {mostrarForm ? <X size={16} /> : <Plus size={16} />} {mostrarForm ? 'Cancelar' : 'Diseñar Nuevo Ramo'}
        </button>
      </div>

      {/* FORMULARIO AVANZADO */}
      {mostrarForm && (
        <form onSubmit={handleCrearRamo} style={{ 
          backgroundColor: 'white', padding: '25px', borderRadius: '12px', 
          border: '1px solid var(--border)', marginBottom: '25px', textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'var(--accent)' }}>📐 Especificaciones del Arreglo</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Nombre del Ramo:</label>
              <input type="text" className="role-select" style={{ width: '100%', height: '38px' }} placeholder="Ej: Ramo Primavera" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Precio de Venta (Bs.):</label>
              <input type="number" className="role-select" style={{ width: '100%', height: '38px' }} placeholder="Ej: 150" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} min="1" required />
            </div>
          </div>

          {/* ASOCIADOR DE INSUMOS */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>🧪 Composición del Ramo (Receta de Insumos Sueltos)</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Seleccionar Insumo de Almacén:</label>
                <select className="role-select" style={{ width: '100%', height: '38px' }} value={materialSeleccionadoId} onChange={e => setMaterialSeleccionadoId(e.target.value)}>
  <option value="">-- Elige un insumo real --</option>
  {materialesDisponibles.map(m => {
    const sueltasTotales = m.stock * (m.unidadesPorPaquete || 100);
    return (
      <option key={m.id} value={m.id}>
        {/* 🔒 SOLUCIÓN: Metemos todo el texto formateado en un string seguro para evitar el quiebre de caracteres HTML */}
        {`${m.nombre} (${m.detalle}) -> Disp: ${sueltasTotales} unidades (${m.stock} paq. x ${m.unidadesPorPaquete}u)`}
      </option>
    );
  })}
</select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Unidades Requeridas:</label>
                <input type="number" className="role-select" style={{ width: '100%', height: '38px' }} value={cantidadMaterial} onChange={e => setCantidadMaterial(Math.max(1, Number(e.target.value)))} min="1" />
              </div>
              <button type="button" onClick={handleAgregarInsumoAReceta} className="sidebar-btn-active" style={{ height: '38px', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e3f2fd', color: '#0d47a1', fontWeight: 'bold' }}>
                + Incluir Fórmula
              </button>
            </div>
          </div>

          {/* LISTA TEMPORAL */}
          {recetaTemporal.length > 0 && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Estructura de consumo unitario para manufactura:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                {recetaTemporal.map(r => (
                  <span key={r.materialId} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'white', border: '1px solid #ced4da', padding: '5px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '500' }}>
                    <b style={{ color: 'var(--accent)' }}>{r.cantidadNecesaria} unidades</b> de {r.nombre} ({r.detalle})
                    <button type="button" onClick={() => handleRemoverInsumoTemporal(r.materialId)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: '3px' }}><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="sidebar-btn-active" style={{ width: '100%', height: '42px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>
            🔒 Registrar Ramo y Vincular Receta en Almacenes
          </button>
        </form>
      )}

      {/* REJILLA DE CATÁLOGO */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Ramo</th>
              <th>Descripción del Arreglo Floral</th>
              <th>Fórmula / Composición Técnica (Unidades Sueltas)</th>
              <th style={{ textAlign: 'right' }}>Precio de Venta</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ramos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No existen modelos de ramos registrados en el catálogo aún. 🌸
                </td>
              </tr>
            ) : (
              ramos.map((r) => (
                <tr key={r.id}>
                  <td><code>#{String(r.id).padStart(3, '0')}</code></td>
                  <td style={{ textAlign: 'left' }}><span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{r.nombre}</span></td>
                  <td style={{ textAlign: 'left', maxWidth: '350px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {r.receta && r.receta.map(item => (
                        <span key={item.id} style={{ fontSize: '0.75rem', backgroundColor: '#f1f8e9', color: '#33691e', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #dcedc8' }}>
                          {item.cantidadNecesaria}u {item.material?.nombre} ({item.material?.detalle})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {Number(r.precio).toFixed(2)} Bs.
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleEliminarRamo(r.id, r.nombre)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
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