import { useEffect, useState } from "react";
import {
  Store,
  Upload,
  Image as ImageIcon,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Coins,
  Building,
  Globe,
  QrCode,
  CreditCard,
} from "lucide-react";
import api, { BACKEND_URL } from "../api/axiosConfig";
import BusinessProfileForm from "../components/BusinessProfileForm";
import Modal from "../components/Modal";

function BusinessProfilePage() {
  const [businessProfile, setBusinessProfile] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusinessProfile = async () => {
    try {
      const response = await api.get("/business-profile");
      setBusinessProfile(response.data.businessProfile);
    } catch (err) {
      if (err.response?.status === 404) {
        setBusinessProfile(null);
      } else {
        setError(
          err.response?.data?.message || "Erreur lors de la récupération du profil commerce"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const handleCreateProfile = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/business-profile", formData);
      setBusinessProfile(response.data.businessProfile);
      setMessage("Profil commerce configuré avec succès");
      setIsEditModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du profil"
      );
    }
  };

  const handleUpdateProfile = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.put("/business-profile", formData);
      setBusinessProfile(response.data.businessProfile);
      setMessage("Informations du profil mises à jour");
      setIsEditModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la modification du profil"
      );
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedLogo) {
      setError("Veuillez d'abord sélectionner une image de logo");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("logo", selectedLogo);

      const response = await api.post("/business-profile/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBusinessProfile(response.data.businessProfile);
      setMessage("Logo mis à jour avec succès ! Il sera inclus sur vos prochains PDF.");
      setSelectedLogo(null);
      setLogoPreview(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors du téléversement du logo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="empty-state">
        <p>Chargement du profil commerce...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Store size={28} color="var(--primary)" />
            Profil & Identité Visuelle
          </h1>
          <p className="page-subtitle">
            Configurez les coordonnées de votre entreprise et personnalisez vos factures
          </p>
        </div>

        {businessProfile && (
          <button
            className="btn btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 size={16} />
            Modifier mes coordonnées
          </button>
        )}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!businessProfile ? (
        <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="card-header">
            <h2 className="card-title">Initialiser votre commerce</h2>
          </div>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>
            Veuillez renseigner les informations de base de votre structure pour commencer à émettre des factures officielles.
          </p>
          <BusinessProfileForm
            initialData={null}
            onSubmit={handleCreateProfile}
            submitLabel="Créer le profil commerce"
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* Colonne 1 : Fiche Entreprise & Logo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Carte Coordonnées */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Store size={18} color="var(--primary)" />
                  Coordonnées officielles
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                {businessProfile.logoUrl ? (
                  <img
                    src={`${BACKEND_URL}${businessProfile.logoUrl}`}
                    alt="Logo"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "contain",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      backgroundColor: "white",
                      padding: "4px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-light)",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    <ImageIcon size={24} />
                    Sans logo
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800 }}>{businessProfile.businessName}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    {[businessProfile.city, businessProfile.country].filter(Boolean).join(", ") || "Ville / Pays non définis"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Phone size={16} color="var(--text-light)" />
                  <span><strong>Téléphone :</strong> {businessProfile.phone || "Non renseigné"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <MapPin size={16} color="var(--text-light)" />
                  <span><strong>Adresse / Rue :</strong> {businessProfile.address || "Non renseignée"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Building size={16} color="var(--text-light)" />
                  <span><strong>Ville :</strong> {businessProfile.city || "Non renseignée"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Globe size={16} color="var(--text-light)" />
                  <span><strong>Pays :</strong> {businessProfile.country || "Non renseigné"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Coins size={16} color="var(--text-light)" />
                  <span><strong>Devise par défaut :</strong> {businessProfile.currency}</span>
                </div>
              </div>

              {/* Bloc Mobile Money configuré */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed var(--border)" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-gold-hover)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <QrCode size={14} />
                  Paiements Mobile Money
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  {businessProfile.waveNumber ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#E0F2FE", color: "#0369A1", fontWeight: 700, fontSize: "11px" }}>Wave</span>
                      <span>{businessProfile.waveNumber}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-light)" }}>• Wave : Non configuré</span>
                  )}

                  {businessProfile.orangeMoneyNumber ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#FFEDD5", color: "#C2410C", fontWeight: 700, fontSize: "11px" }}>Orange Money</span>
                      <span>{businessProfile.orangeMoneyNumber}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-light)" }}>• Orange Money : Non configuré</span>
                  )}

                  {businessProfile.momoNumber && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#FEF08A", color: "#854D0E", fontWeight: 700, fontSize: "11px" }}>MoMo</span>
                      <span>{businessProfile.momoNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carte Upload Logo */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Upload size={18} color="var(--primary)" />
                  Logo de l'entreprise
                </h2>
              </div>

              <form onSubmit={handleLogoUpload}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Formats acceptés : PNG, JPEG, WEBP. La couleur dominante sera automatiquement extraite pour habiller vos PDF.
                </p>

                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "24px",
                    textAlign: "center",
                    marginBottom: "16px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {logoPreview ? (
                    <div>
                      <img
                        src={logoPreview}
                        alt="Aperçu sélectionné"
                        style={{ maxHeight: "70px", objectFit: "contain", marginBottom: "10px" }}
                      />
                      <p style={{ fontSize: "12px", color: "var(--success)" }}>Fichier sélectionné</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} color="var(--text-light)" style={{ marginBottom: "8px" }} />
                      <p style={{ fontSize: "14px", fontWeight: 600 }}>Cliquez pour choisir votre logo</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleLogoChange}
                    style={{ marginTop: "12px", fontSize: "13px" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUploading || !selectedLogo}
                >
                  <Upload size={16} />
                  {isUploading ? "Téléversement..." : "Enregistrer ce logo"}
                </button>
              </form>
            </div>
          </div>

          {/* Colonne 2 : Aperçu en direct de l'en-tête de facture */}
          <div>
            <div className="card" style={{ height: "100%" }}>
              <div className="card-header">
                <h2 className="card-title">
                  <FileText size={18} color="var(--primary)" />
                  Aperçu de vos documents PDF
                </h2>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Voici une simulation visuelle de la disposition de vos factures et devis générés avec QR Code :
              </p>

              {/* Simulation facture */}
              <div
                style={{
                  background: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "24px",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {/* En-tête simulation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "16px", borderBottom: "2px solid #111827" }}>
                  <div>
                    {businessProfile.logoUrl ? (
                      <img
                        src={`${BACKEND_URL}${businessProfile.logoUrl}`}
                        alt="Logo Preview"
                        style={{ height: "45px", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary)" }}>
                        VOTRE LOGO
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "var(--primary)" }}>FACTURE</h3>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#4b5563" }}>FAC-2026-0001</p>
                    <p style={{ fontSize: "11px", color: "#6b7280" }}>Date : 02/09/2026</p>
                  </div>
                </div>

                {/* Parties simulation */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "11px" }}>
                  <div>
                    <strong style={{ color: "#374151" }}>ÉMETTEUR :</strong>
                    <div style={{ fontWeight: 700, fontSize: "12px", marginTop: "2px" }}>
                      {businessProfile.businessName}
                    </div>
                    {businessProfile.phone && <div>Tél : {businessProfile.phone}</div>}
                    {businessProfile.address && <div>{businessProfile.address}</div>}
                    <div>{[businessProfile.city, businessProfile.country].filter(Boolean).join(", ")}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong style={{ color: "#374151" }}>DESTINATAIRE :</strong>
                    <div style={{ fontWeight: 700, fontSize: "12px", marginTop: "2px" }}>
                      Client Exemple
                    </div>
                    <div>Tél : +223 70 00 00 00</div>
                    <div>Quartier du Commerce</div>
                    <div>Ville, Pays</div>
                  </div>
                </div>

                {/* Tableau simulation */}
                <div style={{ marginTop: "20px", border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ background: "var(--primary)", color: "white", padding: "6px 10px", fontSize: "10px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Description</span>
                    <span>Montant ({businessProfile.currency})</span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "10px", display: "flex", justifyContent: "space-between", background: "#f9fafb" }}>
                    <span>Prestation ou Article vendu</span>
                    <span>50 000 {businessProfile.currency}</span>
                  </div>
                </div>

                {/* Bloc Bas : QR Code + Totaux */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", gap: "12px", alignItems: "flex-start" }}>
                  {/* Règlement & QR Code simulation */}
                  <div style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ width: "50px", height: "50px", background: "#f1f5f9", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <QrCode size={36} color="var(--primary)" />
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--text-main)", display: "block", marginBottom: "2px" }}>Paiement Mobile :</strong>
                      <div>Wave : {businessProfile.waveNumber || businessProfile.phone || "Non configuré"}</div>
                      <div>OM : {businessProfile.orangeMoneyNumber || "Non configuré"}</div>
                    </div>
                  </div>

                  {/* Totaux */}
                  <div style={{ width: "160px", padding: "10px", background: "var(--primary-light)", border: "1px solid var(--primary-border)", borderRadius: "6px", textAlign: "right" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>TOTAL TTC</span>
                    <strong style={{ fontSize: "15px", color: "var(--primary)" }}>50 000 {businessProfile.currency}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modification Coordonnées */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier les coordonnées du commerce"
      >
        <BusinessProfileForm
          initialData={businessProfile}
          onSubmit={handleUpdateProfile}
          submitLabel="Enregistrer les modifications"
        />
      </Modal>
    </div>
  );
}

export default BusinessProfilePage;