import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AlertDetail from './pages/AlertDetail';
import AdminConfig from './pages/AdminConfig';
import Investigation from './pages/Investigation';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/alert/:id" element={<AlertDetail />} />
      <Route path="/investigation" element={<Investigation />} />
      <Route path="/admin" element={<AdminConfig />} />
    </Routes>
  );
}

export default App;
