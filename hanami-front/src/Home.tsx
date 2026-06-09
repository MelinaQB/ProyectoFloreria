import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, X, LogOut, Phone, Mail } from 'lucide-react';
import { Footer } from './views/Footer';
import { ProductDetails } from './views/ProductDetails';
import { API_URL } from './config/api';

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  img: string;
  cantidad: number;
}

interface Ramo {
  id: number;
  nombre: string;
  precio: string | number;
  categoria?: string;
  ocasion?: string;
  descripcion?: string;
  imagenUrl?: string; 
}

export const Home = () => {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState('inicio');
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  // 🔒 CONEXIÓN DE DATOS REALES DE POSTGRESQL
  const [productosReales, setProductosReales] = useState<Ramo[]>([]);
  const [cargandoTienda, setCargandoTienda] = useState(true);

  // 🛒 ESTADOS DEL CARRITO TRANSACCIONAL
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  // 🔒 EXTRACCIÓN DE ATRIBUTOS DE SESIÓN DESDE LA BASE DE DATOS
  const usuarioEmail = localStorage.getItem('hanami_user');
  const usuarioRol = localStorage.getItem('hanami_role');
  const usuarioNombre = usuarioEmail ? usuarioEmail.split('@')[0] : '';
  const usuarioCelular = localStorage.getItem('hanami_celular');

  const API_RAMOS = `${API_URL}/ramos`;
  const API_VENTAS = `${API_URL}/ventas`;


  // 📥 JALAR CATÁLOGO REAL DESDE POSTGRESQL
  const cargarCatalogoPostgres = async () => {
    try {
      const res = await fetch(API_RAMOS);
      if (res.ok) {
        const data = await res.json();
        setProductosReales(data);
      }
    } catch (err) {
      console.error("Error al sincronizar catálogo con PostgreSQL:", err);
    } finally {
      setCargandoTienda(false);
    }
  };

  useEffect(() => {
    cargarCatalogoPostgres();
  }, []);

  // Helper local de fotos reales basadas en el nombre del ramo
  const obtenerFotoRealRamo = (ramo: Ramo) => {
    if (ramo.imagenUrl) return ramo.imagenUrl;
    
    // 1. Limpiamos el nombre de la BD: minúsculas, sin acentos y espacios por guiones
    const nombreLimpio = ramo.nombre
      ? ramo.nombre
          .toLowerCase()
          .trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          .replace(/\s+/g, '-') 
      : 'defecto';

    // 2. Mapeo condicional directo según las palabras clave que registres
    if (nombreLimpio.includes('primavera')) return '/ramos/primavera.JPG';
    if (nombreLimpio.includes('snopy') || nombreLimpio.includes('snoopy')) return '/ramos/snopy.jpg';
    if (nombreLimpio.includes('encanto')) return '/ramos/encanto.jpg';
    if (nombreLimpio.includes('girasol')) return '/ramos/girasoles.jpg';
    if (nombreLimpio.includes('rosa')) return '/ramos/rosas.jpg';
    if (nombreLimpio.includes('tulipan')) return '/ramos/tulipanes.jpg';
    
    // 3. Fallback dinámico automático para futuras imágenes
    return `/ramos/${nombreLimpio}.jpg`;
  };

  const asociarEmojiFlor = (nombre: string) => {
    const nom = nombre.toLowerCase();
    if (nom.includes('girasol') || nom.includes('sol')) return '🌻';
    if (nom.includes('rosa')) return '🌹';
    if (nom.includes('tulipan')) return '🌷';
    return '💐';
  };

  // 🔒 VALIDACIÓN DE PERMISOS E INICIO DE SESIÓN
  const agregarAlCarritoReal = (producto: Ramo) => {
    if (!usuarioEmail) {
      alert("🌸 ¡Hola! Para poder armar tu carrito y realizar pedidos en Hanami, primero necesitas iniciar sesión o registrarte.");
      navigate('/login');
      return;
    }

    setCarrito((carritoActual) => {
      const existe = carritoActual.find(item => item.id === producto.id);
      if (existe) {
        return carritoActual.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...carritoActual, 
        { 
          id: producto.id, 
          nombre: producto.nombre, 
          precio: Number(producto.precio), 
          img: asociarEmojiFlor(producto.nombre), 
          cantidad: 1 
        }
      ];
    });

    alert(`🛒 Se agregó "${producto.nombre}" a tu carrito de compras.`);
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const procesarPedidoFinal = async () => {
    if (!usuarioEmail) {
      alert("⚠️ Acción denegada: Tu sesión ha expirado o no has iniciado sesión. Inicia sesión para finalizar tu compra.");
      setCarritoAbierto(false);
      navigate('/login');
      return;
    }

    const clienteIdReal = Number(localStorage.getItem('hanami_uid')); 

    try {
      for (const item of carrito) {
        const payload = {
          ramoId: Number(item.id), 
          cantidad: Number(item.cantidad),
          adminId: clienteIdReal
        };

        const res = await fetch(API_VENTAS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error procesando ${item.nombre}`);
        }
      }

      alert(`🎉 ¡Pedido confirmado y registrado en el sistema por un total de ${calcularTotal()}.00 Bs.! Los insumos correspondientes acaban de ser descontados de los almacenes de Hanami. Nos contactaremos al número ${usuarioCelular || 'registrado'}.`);
      setCarrito([]);
      setCarritoAbierto(false);

    } catch (err: any) {
      alert(`⚠️ Operación Cortada por falta de Materiales: ${err.message}`);
    }
  };

  const cerrarSesionReal = () => {
    localStorage.removeItem('hanami_user');
    localStorage.removeItem('hanami_role');
    localStorage.removeItem('hanami_uid');
    localStorage.removeItem('hanami_celular');
    setCarrito([]);
    setPerfilAbierto(false);
    alert("👋 Sesión cerrada correctamente de la plataforma Hanami. ¡Vuelve pronto!");
    navigate('/');
  };

  // 🛠️ FUNCIÓN DE SCROLL SUAVE AL SECTOR DEL CATÁLOGO
  const manejarScrollAlCatalogo = () => {
    setSeccion('inicio');
    setTimeout(() => {
      const contenedor = document.getElementById('seccion-productos');
      contenedor?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // 🛠️ FUNCIÓN DE REDIRECCIÓN INTERACTIVA AL DETALLE DEL RAMO
  const irAlDetalleDelProducto = (producto: Ramo) => {
    setProductoSeleccionado({
      ...producto,
      imagenReal: obtenerFotoRealRamo(producto)
    });
    setSeccion('producto'); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  return (
    <div className="home-layout">
      
      {/* HEADER */}
      <header className="hanami-header">
        <div className="hanami-navbar">
          
          <div className="hanami-logo-section" onClick={() => setSeccion('inicio')} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem' }}>🌸</span>
            <div className="hanami-logo-text">
              <h1>HANAMI</h1>
              <span>Arte en Flores</span>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN SIMPLIFICADO Y SIN DROPDOWN */}
          <nav className="hanami-nav-links">
            <span onClick={() => setSeccion('inicio')} className={`hanami-nav-item ${seccion === 'inicio' ? 'active' : ''}`}>Home</span>
            <span onClick={manejarScrollAlCatalogo} className="hanami-nav-item">Catálogo</span>
            <span onClick={() => setSeccion('contacto')} className={`hanami-nav-item ${seccion === 'contacto' ? 'active' : ''}`}>Contactos</span>
            <span onClick={() => setSeccion('nosotros')} className={`hanami-nav-item ${seccion === 'nosotros' ? 'active' : ''}`}>Sobre Nosotros</span>
          </nav>

          <div className="hanami-nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setCarritoAbierto(true)}>
              <ShoppingCart size={22} className="icon-btn" />
              {carrito.length > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#8f7ad1', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              {usuarioEmail ? (
                <button onClick={() => setPerfilAbierto(!perfilAbierto)} className="user-avatar-btn">
                  {usuarioNombre.charAt(0)}
                </button>
              ) : (
                <User size={22} className="icon-btn" onClick={() => navigate('/login')} />
              )}

              {perfilAbierto && usuarioEmail && (
                <div className="dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '240px', padding: '15px' }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px', textAlign: 'left' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'capitalize', fontSize: '0.95rem' }}>✨ ¡Hola, {usuarioNombre}!</p>
                    <span className={`role-badge ${usuarioRol === 'Admin' ? 'role-badge-admin' : 'role-badge-cliente'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                      {usuarioRol || 'Cliente'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {usuarioEmail}</span>
                    {usuarioCelular && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {usuarioCelular}</span>}
                  </div>

                  {usuarioRol === 'Admin' && (
                    <button 
                      onClick={() => { setPerfilAbierto(false); navigate('/admin'); }}
                      className="card-add-btn"
                      style={{ width: '100%', marginBottom: '8px', textAlign: 'center' }}
                    >
                      🛠️ Panel de Control
                    </button>
                  )}

                  <button 
                    onClick={cerrarSesionReal}
                    className="dropdown-option" 
                    style={{ color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderTop: '1px solid var(--border)' }}
                  >
                    <LogOut size={14} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* DESPLEGABLE LATERAL DEL CARRITO */}
      {carritoAbierto && (
        <div className="cart-modal-overlay" onClick={() => setCarritoAbierto(false)}>
          <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Tu Carrito 🛒</h3>
              <button className="close-cart-btn" onClick={() => setCarritoAbierto(false)}><X size={24} /></button>
            </div>

            <div className="cart-items-list">
              {carrito.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>Tu carrito está vacío. ¡Añade flores eternas! 🌸</p>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="cart-item-row">
                    <span style={{ fontSize: '2.5rem' }}>{item.img}</span>
                    <div className="cart-item-info">
                      <h5>{item.nombre}</h5>
                      <p>{item.precio}.00 Bs. x {item.cantidad}</p>
                    </div>
                    <button className="remove-item-btn" onClick={() => eliminarDelCarrito(item.id)}>Quitar</button>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-row">
                  <span>Total:</span>
                  <span>{calcularTotal()}.00 Bs.</span>
                </div>
                <button className="checkout-btn" onClick={procesarPedidoFinal}>
                  Confirmar Compra 🌸
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL */}
      <main>
        {seccion === 'producto' && (
          <div className="hanami-section">
            <ProductDetails 
              producto={productoSeleccionado} 
              volverAlCatalogo={() => setSeccion('inicio')} 
            />
          </div>
        )}

        {seccion === 'inicio' && (
          <>
            <section className="hanami-hero">
              <div className="hanami-hero-container">
                <div className="hanami-hero-content">
                  <span className="hanami-hero-subtitle">Bienvenidos a</span>
                  <h2>CREACIONES HANAMI</h2>
                  <p className="hanami-hero-desc">Diseños uniques para cada ocasión. Expresa tus sentimientos con flores que duran para siempre.</p>
                  <button onClick={manejarScrollAlCatalogo} className="hero-action-btn">Ver Catálogo</button>
                </div>
                <div className="hanami-hero-visual"><span className="hero-main-emoji">💐</span></div>
              </div>
            </section>

            {/* SECCIÓN DEL CATÁLOGO VINCULADA POR ID */}
            <section className="hanami-section" id="seccion-productos">
              <h3 className="hanami-section-title">Nuestro Catálogo de Diseños</h3>
              
              {cargandoTienda ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sincronizando catálogo real con PostgreSQL...</p>
              ) : (
                <div className="featured-grid">
                  {productosReales.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', width: '100%' }}>No hay ramos registrados en la base de datos.</p>
                  ) : (
                    productosReales.map(p => (
                      <div key={p.id} className="horizontal-product-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        
                        {/* CONTENEDOR DE FOTO REAL INTERACTIVA CON DIRECCIÓN AL DETALLE */}
                        <div 
                          onClick={() => irAlDetalleDelProducto(p)} 
                          style={{ cursor: 'pointer', position: 'relative', width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f5f5f5', flexShrink: 0 }}
                        >
                          <img 
                            src={obtenerFotoRealRamo(p)} 
                            alt={p.nombre} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '6px', fontSize: '12px' }}>
                            {asociarEmojiFlor(p.nombre)}
                          </span>
                        </div>

                        {/* DETALLES DEL PRODUCTO */}
                        <div className="card-details" style={{ flex: 1, textAlign: 'left' }}>
                          <h4 
                            onClick={() => irAlDetalleDelProducto(p)} 
                            style={{ cursor: 'pointer', margin: '0 0 5px 0', color: '#1f2f2e', fontWeight: 'bold' }}
                          >
                            {p.nombre}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                            {p.descripcion || 'Arreglo artesanal de flores eternas manufacturado con limpiapipas premium de alta durabilidad.'}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                            <span className="card-price" style={{ fontWeight: 'bold', color: '#8f7ad1', fontSize: '1.1rem' }}>
                              {Number(p.precio).toFixed(2)} Bs.
                            </span>
                            <button onClick={() => agregarAlCarritoReal(p)} className="card-add-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              Agregar al Carrito
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            <section className="about-section-bg">
              <div className="about-layout-grid">
                <div className="about-visual-side">🌸</div>
                <div className="about-content-side">
                  <h3>Sobre Nosotros</h3>
                  <p>En Hanami creemos que cada flor cuenta una historia. Creamos arreglos florales únicos hechos 100% a mano con limpiapipas de alta calidad. Nuestro objetivo es materializar tus sentimientos en un detalle eterno en la ciudad de La Paz.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};