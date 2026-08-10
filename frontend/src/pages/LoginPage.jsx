import { useState } from "react";
import api from "../api/axiosConfig";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setUser(null);

    try {
      const response = await api.post("/auth/login", formData);

      const token = response.data.token;

      localStorage.setItem("token", token);

      setMessage(response.data.message);
      setUser(response.data.user);

      setFormData({
        email: "",
        password: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message || "Erreur lors de la connexion"
      );
    }
  };

  return (
    <div>
      <h1>Connexion</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="exemple@email.com"
          />
        </div>

        <div>
          <label>Mot de passe</label>
          <br />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Votre mot de passe"
          />
        </div>

        <br />

        <button type="submit">Se connecter</button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div>
          <h3>Utilisateur connecté</h3>
          <p>Nom : {user.fullName}</p>
          <p>Email : {user.email}</p>
        </div>
      )}
    </div>
  );
}

export default LoginPage;