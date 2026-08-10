import { useState } from "react";
import api from "../api/axiosConfig";

function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    try {
      const response = await api.post("/auth/register", formData);

      setMessage(response.data.message);

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message || "Erreur lors de la création du compte"
      );
    }
  };

  return (
    <div>
      <h1>Créer un compte</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom complet</label>
          <br />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Ex : Habibata Samake"
          />
        </div>

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

        <button type="submit">Créer mon compte</button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default RegisterPage;