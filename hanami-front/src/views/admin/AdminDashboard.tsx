import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Scissors, BarChart3, User, ShieldAlert, Clock, Mail, LogOut, ShoppingBag } from 'lucide-react'; 
import { API_URL } from '../../config/api';

// IMPORTAMOS TUS MÓDULOS EXISTENTES Y EL NUEVO DE VENTAS
import { Estadisticas } from './Estadisticas';
import { RamosCRUD } from './RamosCRUD';
import { MaterialesCRUD } from './MaterialesCRUD';
import { ClientesCRUD } from './ClientesCRUD';
import { VentasCRUD } from './VentasCRUD'; 

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  celular: string;
  rol: string;
}

interface LogAuditoria {
  id: number;
  usuarioId: number | null;
  usuarioEmail: string;
  evento: string; // 🔒 Sincronizado con la entidad real de NestJS
  descripcion: string;
  fechaHora: string; // 🔒 Sincronizado con la entidad real de NestJS
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pestaña, setPestaña] = useState('stats');
  
  // Estados para la gestión de usuarios y logs
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoLogs, setCargandoLogs] = useState(true);
  
  // 🔒 EXTRACCIÓN 100% REAL DE LA SESIÓN ACTIVA DESDE LA BASE DE DATOS
  //const adminIdReal = Number(localStorage.getItem('hanami_uid'));
  const adminEmailReal = localStorage.getItem('hanami_user') || 'admin@hanami.com';
  const adminNombreReal = adminEmailReal.split('@')[0];

  // 1. Obtener la lista real de usuarios desde NestJS
  const obtenerUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios`);
      const data = await response.json();
      if (response.ok) {
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Error al conectar con NestJS:", error);
    } finally {
      setCargando(false);
    }
  };

  // 2. Obtener los logs de auditoría reales de PostgreSQL
  const obtenerLogsAuditoria = async () => {
    try {
      const response = await fetch(`${API_URL}/auditoria`);
      const data = await response.json();
      if (response.ok) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Error al jalar logs de auditoría:", error);
    } finally {
      setCargandoLogs(false);
    }
  };

  // Carga reactiva de datos al cambiar de pestaña
  useEffect(() => {
    if (pestaña === 'seguridad') {
      obtenerUsuarios();
      obtenerLogsAuditoria();
    }
  }, [pestaña]);

  // Función para modificar los privilegios en PostgreSQL firmando con el Admin Real
  const handleCambioRol = async (id: number, nuevoRol: string) => {
    const uidLocal = localStorage.getItem('hanami_uid');
    const adminIdReal = uidLocal ? Number(uidLocal) : null;

    if (id === adminIdReal && nuevoRol !== 'Admin') {
      alert("⚠️ Operación cancelada: No puedes revocar tus propios permisos de Administrador.");
      return;
    }

    console.log("🚀 FRONTEND ENVIANDO AL BACKEND -> adminId:", adminIdReal, "modificando al usuario ID:", id);

    if (!adminIdReal) {
      alert("❌ Error crítico: No se encontró el ID de tu sesión de Administrador. Por favor, vuelve a ingresar.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/${id}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoRol: nuevoRol,
          adminId: adminIdReal
        })
      });

      if (response.ok) {
        alert(`✨ Privilegios de usuario actualizados con éxito.`);
        obtenerUsuarios();     
        obtenerLogsAuditoria(); 
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      alert("❌ No se pudo establecer conexión con el servidor.");
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('hanami_user');
    localStorage.removeItem('hanami_role');
    localStorage.removeItem('hanami_uid');
    localStorage.removeItem('hanami_celular');
    alert("👋 Sesión administrativa finalizada de forma segura.");
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      
      {/* MENÚ LATERAL ACCESIBLE */}
      <aside className="sidebar">
        <div style={{ padding: '0 10px', marginBottom: '20px' }}>
          <h2 className="sidebar-title" style={{ marginBottom: '5px' }}>Hanami Admin</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            👑 Mod: {adminNombreReal}
          </span>
        </div>
        
        <div className="sidebar-nav">
          <button onClick={() => setPestaña('stats')} className={pestaña === 'stats' ? 'sidebar-btn-active' : 'sidebar-btn'}><BarChart3 size={20} /> Dashboard</button>
          <button onClick={() => setPestaña('ramos')} className={pestaña === 'ramos' ? 'sidebar-btn-active' : 'sidebar-btn'}><Package size={20} /> Ramos</button>
          <button onClick={() => setPestaña('materiales')} className={pestaña === 'materiales' ? 'sidebar-btn-active' : 'sidebar-btn'}><Scissors size={20} /> Materiales</button>
          
          <button onClick={() => setPestaña('ventas')} className={pestaña === 'ventas' ? 'sidebar-btn-active' : 'sidebar-btn'}><ShoppingBag size={20} /> Pedidos y Ventas</button>
          
          <button onClick={() => setPestaña('clientes')} className={pestaña === 'clientes' ? 'sidebar-btn-active' : 'sidebar-btn'}><User size={20} /> Clientes</button>
          <button onClick={() => setPestaña('seguridad')} className={pestaña === 'seguridad' ? 'sidebar-btn-active' : 'sidebar-btn'}><ShieldAlert size={20} /> Roles y Auditoría</button>
        </div>

        <button onClick={handleCerrarSesion} className="sidebar-logout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </aside>

      {/* ÁREA CENTRAL DINÁMICA */}
      <main className="dashboard-main">
        {pestaña === 'stats' && <Estadisticas />}
        {pestaña === 'ramos' && <RamosCRUD />}
        {pestaña === 'materiales' && <MaterialesCRUD />}
        
        {pestaña === 'ventas' && <VentasCRUD />}
        
        {pestaña === 'clientes' && <ClientesCRUD />}
        
        {/* VISTA GESTIÓN DE SEGURIDAD Y LOGS REALES */}
        {pestaña === 'seguridad' && (
          <div className="admin-container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* BLOQUE UNO: TABLA DE ROLES */}
            <div>
              <h2 className="admin-title">Control de Roles (Multi-Administrador)</h2>
              {cargando ? (
                <p>Conectando con el repositorio de datos de NestJS...</p>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre de Usuario</th>
                        <th>Correo Electrónico</th>
                        <th>Celular</th>
                        <th>Rol Actual</th>
                        <th>Asignar Permisos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((user) => (
                        <tr key={user.id}>
                          <td><b>{user.id}</b></td>
                          <td>={user.nombre}</td>
                          <td>{user.email}</td>
                          <td>{user.celular || 'Sin registrar'}</td>
                          <td>
                            <span className={`role-badge ${user.rol === 'Admin' ? 'role-badge-admin' : 'role-badge-cliente'}`}>
                              {user.rol}
                            </span>
                          </td>
                          <td>
                            <select 
                              className="role-select" 
                              value={user.rol} 
                              onChange={(e) => handleCambioRol(user.id, e.target.value)}
                            >
                              <option value="Cliente">Cliente</option>
                              <option value="Admin">Administrador</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <hr style={{ border: '0', height: '1px', backgroundColor: 'var(--border)' }} />

            {/* BLOQUE DOS: HISTORIAL DE AUDITORÍA FÍSICA DESDE POSTGRESQL */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Clock size={24} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Historial de Auditoría Interna</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Registro transaccional inmutable extraído directamente de la tabla <code>logs_auditoria</code> en PostgreSQL.
              </p>

              {cargandoLogs ? (
                <p>Cargando trazas de auditoría relacionales...</p>
              ) : (
                <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                      <tr>
                        <th>ID Log</th>
                        <th>Acción</th>
                        <th>Actor / Responsable</th>
                        <th>Descripción Detallada del Suceso</th>
                        <th>Fecha y Hora (Bolivia)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                            No se han registrado eventos de auditoría en la base de datos aún.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => {
                          // Formateador seguro en memoria para asegurar que no tire "Invalid Date"
                          const parsearFechaLog = (fechaRaw: any) => {
                            if (!fechaRaw) return 'Sin fecha';
                            const f = new Date(fechaRaw);
                            return isNaN(f.getTime()) 
                              ? String(fechaRaw).replace('T', ' ').slice(0, 19) 
                              : f.toLocaleString('es-BO');
                          };

                          return (
                            <tr key={log.id}>
                              <td><code>#{log.id}</code></td>
                              <td>
                                <span className="tag-badge" style={{ 
                                  backgroundColor: '#f3e5f5', 
                                  color: '#7e57c2', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 'bold',
                                  display: 'inline-block'
                                }}>
                                  {log.evento || 'ACCION'} {/* 🔒 MAPEADO CORRECTO */}
                                </span>
                              </td>
                              <td>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                  <Mail size={12} /> {log.usuarioEmail}
                                </span>
                              </td>
                              <td style={{ textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.88rem', maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {log.descripcion}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {parsearFechaLog(log.fechaHora)} {/* 🔒 FORMATEADO CORRECTO */}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};