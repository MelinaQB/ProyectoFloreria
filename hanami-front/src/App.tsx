import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { AuthScreen } from './Register';
import { AdminDashboard } from './views/admin/AdminDashboard';  

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthScreen />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;