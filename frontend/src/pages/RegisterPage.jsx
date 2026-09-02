import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import api from "../api/axiosConfig";
import BrandLogo from "../components/BrandLogo";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/register", formData);
      setMessage(response.data.message || "Compte créé avec succès ! Redirection...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du compte"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
            <BrandLogo size="lg" showText={false} />
          </div>
          <h1 className="auth-title">Créer votre compte sur WariFact</h1>
          <p className="auth-subtitle">Démarrez votre facturation professionnelle en Franc CFA en quelques clics</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Nom complet</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="reg-name"
                type="text"
                name="fullName"
                className="input-with-icon"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ex : Habibata Samake"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Adresse email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="reg-email"
                type="email"
                name="email"
                className="input-with-icon"
                value={formData.email}
                onChange={handleChange}
                placeholder="nom@exemple.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Mot de passe</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="input-with-icon"
                style={{ paddingRight: "40px" }}
                value={formData.password}
                onChange={handleChange}
                placeholder="Au moins 6 caractères"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "var(--text-light)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px" }}
            disabled={isLoading}
          >
            {isLoading ? (
              "Création en cours..."
            ) : (
              <>
                <UserPlus size={18} />
                Créer mon compte
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Vous possédez déjà un compte ?{" "}
          <Link to="/login" className="auth-link">
            <ArrowLeft size={14} style={{ verticalAlign: "middle" }} /> Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;