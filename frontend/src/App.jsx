import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Receipt,
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Store,
  LogOut,
  PlusCircle,
} from "lucide-react";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import InvoicesPage from "./pages/InvoicesPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import api from "./api/axiosConfig";

import BrandLogo from "./components/BrandLogo";
import PwaInstallPrompt from "./components/PwaInstallPrompt";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    if (token && !isAuthPage) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
    }
  }, [token, location.pathname, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand" style={{ textDecoration: "none" }}>
          <BrandLogo size="md" showText={true} />
        </NavLink>

        <div className="navbar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Tableau de bord</span>
          </NavLink>

          <NavLink
            to="/invoices"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <FileText size={18} />
            <span>Factures</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Users size={18} />
            <span>Clients</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Package size={18} />
            <span>Produits</span>
          </NavLink>

          <NavLink
            to="/business-profile"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Store size={18} />
            <span>Profil</span>
          </NavLink>
        </div>

        <div className="navbar-user">
          <NavLink to="/invoices/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Nouvelle Facture</span>
          </NavLink>

          {user && (
            <div className="user-badge" title={user.email}>
              <div className="user-avatar">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="user-name">{user.fullName || "Utilisateur"}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <PwaInstallPrompt />

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/business-profile"
              element={
                <ProtectedRoute>
                  <BusinessProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices/new"
              element={
                <ProtectedRoute>
                  <CreateInvoicePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;