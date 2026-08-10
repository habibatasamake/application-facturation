import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

const BACKEND_URL = "http://localhost:5001";

function BusinessProfilePage() {
  const [businessProfile, setBusinessProfile] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await api.get("/business-profile");
        setBusinessProfile(response.data.businessProfile);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Erreur lors de la récupération du profil commerce"
        );
      }
    };

    fetchBusinessProfile();
  }, []);

  const handleLogoChange = (event) => {
    setSelectedLogo(event.target.files[0]);
  };

  const handleLogoUpload = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedLogo) {
      setError("Veuillez sélectionner un logo");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("logo", selectedLogo);

      const response = await api.post("/business-profile/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setBusinessProfile(response.data.businessProfile);
      setMessage(response.data.message);
      setSelectedLogo(null);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de l'upload du logo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1>Profil commerce</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {businessProfile ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {businessProfile.logoUrl ? (
              <img
                src={`${BACKEND_URL}${businessProfile.logoUrl}`}
                alt="Logo du commerce"
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                Aucun logo
              </div>
            )}

            <div>
              <h2>{businessProfile.businessName}</h2>
              <p>{businessProfile.city}, {businessProfile.country}</p>
            </div>
          </div>

          <hr />

          <p><strong>Téléphone :</strong> {businessProfile.phone}</p>
          <p><strong>Adresse :</strong> {businessProfile.address}</p>
          <p><strong>Ville :</strong> {businessProfile.city}</p>
          <p><strong>Pays :</strong> {businessProfile.country}</p>
          <p><strong>Devise :</strong> {businessProfile.currency}</p>

          <hr />

          <h3>Changer le logo</h3>

          <form onSubmit={handleLogoUpload}>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleLogoChange}
            />

            <br />
            <br />

            <button type="submit" disabled={isUploading}>
              {isUploading ? "Upload en cours..." : "Enregistrer le logo"}
            </button>
          </form>
        </div>
      ) : (
        !error && <p>Chargement...</p>
      )}
    </div>
  );
}

export default BusinessProfilePage;