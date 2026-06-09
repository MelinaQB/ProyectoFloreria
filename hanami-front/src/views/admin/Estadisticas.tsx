import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Activity } from 'lucide-react';

interface MetricData {
  name: string;
  ingresos: number;
  carga: number;
}

export const Estadisticas = () => {
  const [datos, setDatos] = useState<MetricData[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estructura base de la semana para asegurar que el gráfico siempre se vea ordenado
  const diasSemanaBase = [
    { name: 'Lun', ingresos: 0, carga: 0 },
    { name: 'Mar', ingresos: 0, carga: 0 },
    { name: 'Mié', ingresos: 0, carga: 0 },
    { name: 'Jue', ingresos: 0, carga: 0 },
    { name: 'Vie', ingresos: 0, carga: 0 },
    { name: 'Sáb', ingresos: 0, carga: 0 },
    { name: 'Dom', ingresos: 0, carga: 0 },
  ];

  const cargarMetricasReal = async () => {
    try {
      const response = await fetch('http://localhost:3000/estadisticas/dashboard');
      const dataReal: MetricData[] = await response.json();

      if (response.ok) {
        // Sincronizamos los datos del Backend con la base semanal fija
        const datosSincronizados = diasSemanaBase.map(diaBase => {
          const coincidencia = dataReal.find(d => d.name.toLowerCase() === diaBase.name.toLowerCase());
          return coincidencia ? coincidencia : diaBase;
        });
        setDatos(datosSincronizados);
      }
    } catch (error) {
      console.error("Error al conectar con el endpoint de métricas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMetricasReal();
  }, []);

  // Totales acumulados rápidos en memoria para las tarjetas de arriba
  const totalIngresos = datos.reduce((acc, curr) => acc + curr.ingresos, 0);
  const totalRamos = datos.reduce((acc, curr) => acc + curr.carga, 0);

  if (cargando) {
    return <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>Calculando proyecciones con PostgreSQL...</p>;
  }

  return (
    <div className="admin-container" style={{ padding: '15px' }}>
      
      {/* Encabezado Principal */}
      <div style={{ textAlign: 'left', marginBottom: '25px' }}>
        <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Activity size={26} style={{ color: 'var(--accent)' }} /> Panel de Analítica Comercial
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
          Métricas e indicadores de rendimiento operativo calculados dinámicamente desde los históricos de Hanami.
        </p>
      </div>

      {/* Tarjetas Informativas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Tarjeta 1: Ingresos Totales de la Semana */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'left' }}>
          <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '10px', color: '#2e7d32' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Ingresos Semanales</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalIngresos.toFixed(2)} Bs.</span>
          </div>
        </div>

        {/* Tarjeta 2: Volumen de Producción de la Semana */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'left' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '10px', color: '#0d47a1' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Ramos Producidos</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalRamos} unidades</span>
          </div>
        </div>

      </div>

      {/* Bloque de Gráficas en Rejilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px' }}>
        
        {/* Gráfico 1: Ingresos Diarios */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: '#2e7d32' }} /> Histórico de Ingresos (Bs.)
          </h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${value}.00 Bs.`, 'Ingresos']} />
                <Bar dataKey="ingresos" fill="#81c784" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Carga de Trabajo Operativa */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#0d47a1' }} /> Carga de Trabajo (Ramos Vendidos)
          </h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={datos} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Cantidad Vendida']} />
                <Line type="monotone" dataKey="carga" stroke="#29b6f6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};