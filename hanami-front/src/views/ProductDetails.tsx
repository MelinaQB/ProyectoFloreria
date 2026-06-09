import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Definimos cómo luce un producto para que TypeScript no se queje
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  contenido: string[];
  img: string;
}

export const ProductDetails = ({ producto, volverAlCatalogo }: { producto: Producto | null, volverAlCatalogo: () => void }) => {
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [ciudad, setCiudad] = useState('La Paz');
  
  // Agregamos el navegador
  const navigate = useNavigate();

  // Si por alguna razón no hay producto, mostramos error
  if (!producto) return <p>Cargando producto...</p>;

  const obtenerFechaMinima = () => {
    const hoy = new Date();
    // Si no hay stock, sumamos 24 horas (1 día) para la elaboración
    if (producto.stock === 0) {
      hoy.setDate(hoy.getDate() + 1);
    }
    return hoy.toISOString().split('T')[0];
  };

  // LA NUEVA LÓGICA DE COMPRA INTELIGENTE
  const procesarPedido = () => {
    if (!fechaEntrega) {
      alert("⚠️ Por favor, selecciona una fecha de entrega.");
      return;
    }

    // Leemos la "sesión" de la memoria
    const usuarioLogueado = localStorage.getItem('hanami_user');

    if (!usuarioLogueado) {
      // Si está vacío, ¡lo mandamos a loguearse!
      alert("🔒 Para finalizar tu compra y coordinar la entrega, necesitamos que inicies sesión o te registres.");
      navigate('/login');
      return;
    }

    // Si ya inició sesión, ¡pasa la compra!
    alert(`✅ ¡Pedido confirmado para ${usuarioLogueado}!\n\nSe entregará el ${fechaEntrega} en ${ciudad}.\nTotal: ${producto.precio} Bs.\n\nNos contactaremos a tu número celular para coordinar.`);
  };

  return (
    <div style={styles.container}>
      <button onClick={volverAlCatalogo} style={styles.backBtn}>← Volver al Catálogo</button>
      
      <div style={styles.layout}>
        {/* Imagen dinámica */}
        <div style={styles.imageCol}>
          <div style={{ fontSize: '150px' }}>{producto.img}</div>
        </div>

        {/* Datos dinámicos */}
        <div style={styles.detailsCol}>
          <p style={styles.locationTag}>BOLIVIA</p>
          <h1 style={{ color: '#333', marginTop: 0 }}>{producto.nombre}</h1>
          <h2 style={{ color: '#d63384' }}>{producto.precio} Bs.</h2>

          <div style={{ marginBottom: '20px', padding: '10px', borderRadius: '5px', backgroundColor: producto.stock > 0 ? '#e8f5e9' : '#fff3cd' }}>
            <strong>Disponibilidad: </strong> 
            {producto.stock > 0 
              ? `✅ ¡En Stock! (${producto.stock} disponibles)` 
              : `⏳ Bajo pedido (Elaboración: 24 horas)`}
          </div>

          <div style={styles.inputGroup}>
            <label>Ciudad</label>
            <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} style={styles.input}>
              <option value="La Paz">La Paz</option>
              <option value="El Alto">El Alto</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label>Fecha de entrega</label>
            <input 
              type="date" 
              min={obtenerFechaMinima()} 
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              style={styles.input}
            />
            {producto.stock === 0 && (
              <small style={{ color: '#856404' }}>*Al no tener stock inmediato, la entrega es a partir de mañana.</small>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p>Hágalo especial... agregue:</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={styles.extraBox}>🎈 Globo (+15 Bs)</div>
              <div style={styles.extraBox}>🧸 Peluche (+30 Bs)</div>
            </div>
          </div>

          <button onClick={procesarPedido} style={styles.buyBtn}>
            {producto.stock > 0 ? 'Comprar Ahora' : 'Hacer Pedido'}
          </button>

          <div style={styles.descriptionBox}>
            <p>{producto.descripcion}</p>
            <p><strong>Este arreglo contiene:</strong></p>
            <ul>
              {producto.contenido.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' },
  backBtn: { background: 'none', border: 'none', color: '#d63384', cursor: 'pointer', fontSize: '16px', marginBottom: '20px', fontWeight: 'bold' },
  layout: { display: 'flex', gap: '50px', flexWrap: 'wrap' },
  imageCol: { flex: '1', minWidth: '300px', backgroundColor: '#fafafa', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', border: '1px solid #eee' },
  detailsCol: { flex: '1', minWidth: '300px' },
  locationTag: { fontSize: '12px', color: '#888', letterSpacing: '2px' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '5px', fontSize: '16px' },
  extraBox: { border: '1px solid #eee', padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', backgroundColor: '#fff5f8' },
  buyBtn: { width: '100%', padding: '15px', backgroundColor: '#d63384', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },
  descriptionBox: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#555', lineHeight: '1.6' }
};