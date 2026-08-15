import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
      <Link to="/register">Inscription</Link>
      <Link to="/login">Connexion</Link>
      <Link to="/dashboard">Tableau de bord</Link>
      <Link to="/business-profile">Profil commerce</Link>
      <Link to="/customers">Clients</Link>
      <Link to="/products">Produits</Link>

      <button onClick={handleLogout}>
        Déconnexion
      </button>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />

        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;