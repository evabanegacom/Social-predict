import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './global-context';
import { Suspense, lazy } from 'react';
import Navbar from './components/navbar';

// Lazy load pages
const Signup = lazy(() => import('./pages/auth/signup'));
const SignIn = lazy(() => import('./pages/auth/login'));
const Home = lazy(() => import('./pages/auth/home'));

const Dashboard = () => <div>Dashboard (Placeholder)</div>;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
