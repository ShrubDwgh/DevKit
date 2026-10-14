import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { AllTools, CategoryPage } from './pages/Browse';
import ToolPage from './pages/ToolPage';
import Settings from './pages/Settings';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="alat" element={<AllTools />} />
        <Route path="alat/:slug" element={<ToolPage />} />
        <Route path="kategori/:id" element={<CategoryPage />} />
        <Route path="pengaturan" element={<Settings />} />
        <Route path="privasi" element={<Privacy />} />
        <Route path="ketentuan" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
