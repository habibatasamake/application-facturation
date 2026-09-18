import { useState } from "react";
import { Store, Phone, MapPin, Building, Globe, Coins, Check, CreditCard, QrCode, FileText } from "lucide-react";

function BusinessProfileForm({ initialData, onSubmit, submitLabel = "Enregistrer" }) {
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    currency: initialData?.currency || "FCFA",
    waveNumber: initialData?.waveNumber || "",
    orangeMoneyNumber: initialData?.orangeMoneyNumber || "",
    momoNumber: initialData?.momoNumber || "",
    paymentInstructions: initialData?.paymentInstructions || "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 1. Informations Générales */}
      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Store size={18} />
        Coordonnées de l'entreprise
      </h3>

      <div className="form-group">
        <label htmlFor="business-name">Nom commercial de l'entreprise *</label>
        <div className="input-wrapper">
          <Store className="input-icon" size={18} />
          <input
            id="business-name"
            type="text"
            name="businessName"
            className="input-with-icon"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Ex : Établissements Habibata & Frères"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="business-phone">Téléphone principal</label>
          <div className="input-wrapper">
            <Phone className="input-icon" size={18} />
            <input
              id="business-phone"
              type="text"
              name="phone"
              className="input-with-icon"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex : +223 70 00 00 00"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="business-currency">Devise principale</label>
          <select
            id="business-currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            style={{ fontWeight: 600 }}
          >
            <option value="FCFA">FCFA (Franc CFA)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="USD">USD ($ Dollar)</option>
            <option value="GNF">GNF (Franc Guinéen)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="business-address">Adresse physique / Quartier / Rue</label>
        <div className="input-wrapper">
          <MapPin className="input-icon" size={18} />
          <input
            id="business-address"
            type="text"
            name="address"
            className="input-with-icon"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ex : Quartier Médina, Rue 10 x 12"
          />
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
          Précisez le quartier, la rue ou le numéro de porte. La ville et le pays se renseignent ci-dessous.
        </span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="business-city">Ville</label>
          <div className="input-wrapper">
            <Building className="input-icon" size={18} />
            <input
              id="business-city"
              type="text"
              name="city"
              className="input-with-icon"
              value={formData.city}
              onChange={handleChange}
              placeholder="Ex : Bamako ou Dakar"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="business-country">Pays</label>
          <div className="input-wrapper">
            <Globe className="input-icon" size={18} />
            <input
              id="business-country"
              type="text"
              name="country"
              className="input-with-icon"
              value={formData.country}
              onChange={handleChange}
              placeholder="Ex : Mali ou Sénégal"
            />
          </div>
        </div>
      </div>

      {/* 2. Coordonnées Mobile Money & QR Code */}
      <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1.5px dashed var(--border)" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-gold-hover)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <QrCode size={18} />
          Paiements Mobile Money & QR Code
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Ces coordonnées seront encodées dans le QR Code de vos factures et partagées automatiquement par WhatsApp.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="business-wave" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0284C7", display: "inline-block" }}></span>
              Numéro ou lien Wave
            </label>
            <div className="input-wrapper">
              <CreditCard className="input-icon" size={18} />
              <input
                id="business-wave"
                type="text"
                name="waveNumber"
                className="input-with-icon"
                value={formData.waveNumber}
                onChange={handleChange}
                placeholder="Ex : +223 76 00 00 00 ou lien"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="business-om" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#EA580C", display: "inline-block" }}></span>
              Numéro Orange Money
            </label>
            <div className="input-wrapper">
              <CreditCard className="input-icon" size={18} />
              <input
                id="business-om"
                type="text"
                name="orangeMoneyNumber"
                className="input-with-icon"
                value={formData.orangeMoneyNumber}
                onChange={handleChange}
                placeholder="Ex : +223 70 00 00 00"
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="business-momo" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#CA8A04", display: "inline-block" }}></span>
              Numéro MTN / Moov MoMo (optionnel)
            </label>
            <div className="input-wrapper">
              <CreditCard className="input-icon" size={18} />
              <input
                id="business-momo"
                type="text"
                name="momoNumber"
                className="input-with-icon"
                value={formData.momoNumber}
                onChange={handleChange}
                placeholder="Ex : +229 97 00 00 00"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="business-instructions">Instructions de règlement</label>
            <div className="input-wrapper">
              <FileText className="input-icon" size={18} />
              <input
                id="business-instructions"
                type="text"
                name="paymentInstructions"
                className="input-with-icon"
                value={formData.paymentInstructions}
                onChange={handleChange}
                placeholder="Ex : Préciser le N° de facture en référence"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <button type="submit" className="btn btn-primary">
          <Check size={18} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default BusinessProfileForm;