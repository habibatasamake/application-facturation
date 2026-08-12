import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import BusinessProfileForm from "../components/BusinessProfileForm";

const BACKEND_URL = "http://localhost:5001";

function BusinessProfilePage() {
  const [businessProfile, setBusinessProfile] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await api.get("/business-profile");
        setBusinessProfile(response.data.businessProfile);
      } catch (error) {
        if (error.response?.status === 404) {
          setBusinessProfile(null);
        } else {
          setError(
            error.response?.data?.message ||
              "Erreur lors de la récupération du profil commerce"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, []);

  const handleCreateProfile = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/business-profile", formData);

      setBusinessProfile(response.data.businessProfile);
      setMessage(response.data.message);
      setIsEditing(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la création du profil commerce"
      );
    }
  };

  const handleUpdateProfile = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.put("/business-profile", formData);

      setBusinessProfile(response.data.businessProfile);
      setMessage(response.data.message);
      setIsEditing(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la modification du profil commerce"
      );
    }
  };

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
        error.response?.data?.message || "Erreur lors de l'upload du logo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Profil commerce</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {!businessProfile && (
        <div>
          <p>Aucun profil commerce trouvé. Créez votre profil pour continuer.</p>

          <BusinessProfileForm
            initialData={null}
            onSubmit={handleCreateProfile}
            submitLabel="Créer le profil commerce"
          />
        </div>
      )}

      {businessProfile && !isEditing && (
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
              <p>
                {businessProfile.city}, {businessProfile.country}
              </p>
            </div>
          </div>

          <hr />

          <p>
            <strong>Téléphone :</strong> {businessProfile.phone}
          </p>
          <p>
            <strong>Adresse :</strong> {businessProfile.address}
          </p>
          <p>
            <strong>Ville :</strong> {businessProfile.city}
          </p>
          <p>
            <strong>Pays :</strong> {businessProfile.country}
          </p>
          <p>
            <strong>Devise :</strong> {businessProfile.currency}
          </p>

          <button onClick={() => setIsEditing(true)}>
            Modifier le profil
          </button>

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
      )}

      {businessProfile && isEditing && (
        <div>
          <h2>Modifier le profil commerce</h2>

          <BusinessProfileForm
            initialData={businessProfile}
            onSubmit={handleUpdateProfile}
            submitLabel="Enregistrer les modifications"
          />

          <br />

          <button onClick={() => setIsEditing(false)}>
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

export default BusinessProfilePage;