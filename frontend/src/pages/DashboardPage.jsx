import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Erreur lors de la récupération de l'utilisateur"
        );
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h1>Tableau de bord</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {user ? (
        <div>
          <p>Bienvenue, {user.fullName}</p>
          <p>Email : {user.email}</p>

          <hr />

          <h2>Modules à venir</h2>

          <button>Clients</button>
          <button>Produits</button>
          <button>Nouvelle facture</button>
          <button>Historique des factures</button>
          <button>Devis</button>
          <button>Profil commerce</button>
        </div>
      ) : (
        !error && <p>Chargement...</p>
      )}
    </div>
  );
}

export default DashboardPage;