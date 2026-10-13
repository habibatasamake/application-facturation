import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Store,
  LogOut,
  PlusCircle,
  Menu,
  X,
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

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    // Fermer le menu mobile lors d'un changement de page
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
      setUser(null);
    }
  }, [token, location.pathname, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/dashboard" className="navbar-brand" style={{ textDecoration: "none" }}>
            <BrandLogo size="md" showText={true} />
          </NavLink>

          {/* Navigation Bureau */}
          <div className="navbar-nav desktop-only">
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

          {/* Utilisateur et bouton Bureau */}
          <div className="navbar-user desktop-only">
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

          {/* Actions Entête Mobile */}
          <div className="mobile-header-actions mobile-only">
            <NavLink to="/invoices/new" className="btn btn-primary btn-sm" style={{ padding: "6px 10px" }}>
              <PlusCircle size={16} />
              <span>Créer</span>
            </NavLink>

            <button
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu de navigation"
              style={{ width: "38px", height: "38px" }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Volet Menu Mobile (Drawer) */}
        {isMobileMenuOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
              {user && (
                <div className="mobile-user-card">
                  <div className="user-avatar" style={{ width: "38px", height: "38px", fontSize: "15px" }}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{user.fullName || "Commerçant"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</div>
                  </div>
                </div>
              )}

              <div className="mobile-drawer-links">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={19} />
                  <span>Tableau de bord</span>
                </NavLink>

                <NavLink
                  to="/invoices"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText size={19} />
                  <span>Factures & Devis</span>
                </NavLink>

                <NavLink
                  to="/invoices/new"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PlusCircle size={19} />
                  <span>Créer une facture</span>
                </NavLink>

                <NavLink
                  to="/customers"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users size={19} />
                  <span>Clients</span>
                </NavLink>

                <NavLink
                  to="/products"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package size={19} />
                  <span>Catalogue Produits</span>
                </NavLink>

                <NavLink
                  to="/business-profile"
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Store size={19} />
                  <span>Profil & Paiements</span>
                </NavLink>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", color: "var(--danger)" }}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Barre de navigation inférieure Smartphone (Bottom Bar) */}
      <nav className="mobile-bottom-nav mobile-only">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <LayoutDashboard size={20} />
          <span>Accueil</span>
        </NavLink>

        <NavLink
          to="/invoices"
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <FileText size={20} />
          <span>Factures</span>
        </NavLink>

        <NavLink
          to="/invoices/new"
          className="bottom-nav-create-btn"
          aria-label="Créer une facture"
        >
          <PlusCircle size={24} />
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <Users size={20} />
          <span>Clients</span>
        </NavLink>

        <NavLink
          to="/business-profile"
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <Store size={20} />
          <span>Profil</span>
        </NavLink>
      </nav>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />

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