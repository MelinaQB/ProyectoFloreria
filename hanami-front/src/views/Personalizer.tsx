import { useState } from 'react';

export const Personalizer = () => {
  const [rosas, setRosas] = useState(0);
  const [tulipanes, setTulipanes] = useState(0);

  const total = (rosas * 10) + (tulipanes * 15);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#d63384' }}>✨ Personaliza tu Ramo</h2>
      <p>Elige la cantidad de flores de limpiapipas que deseas.</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '40px' }}>🌹</div>
          <h3>Rosa (10 Bs)</h3>
          <button onClick={() => setRosas(Math.max(0, rosas - 1))}>-</button>
          <span style={{ margin: '0 15px' }}>{rosas}</span>
          <button onClick={() => setRosas(rosas + 1)}>+</button>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '40px' }}>🌷</div>
          <h3>Tulipán (15 Bs)</h3>
          <button onClick={() => setTulipanes(Math.max(0, tulipanes - 1))}>-</button>
          <span style={{ margin: '0 15px' }}>{tulipanes}</span>
          <button onClick={() => setTulipanes(tulipanes + 1)}>+</button>
        </div>
      </div>

      <h3 style={{ marginTop: '30px' }}>Total Calculado: {total} Bs.</h3>
    </div>
  );
};