import { useState } from "react";
import { Store, Phone, MapPin, Building, Globe, Coins, Check } from "lucide-react";

function BusinessProfileForm({ initialData, onSubmit, submitLabel = "Enregistrer" }) {
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    currency: initialData?.currency || "FCFA",
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
          <label htmlFor="business-phone">Téléphone de contact</label>
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
          <div className="input-wrapper">
            <Coins className="input-icon" size={18} />
            <select
              id="business-currency"
              name="currency"
              className="input-with-icon"
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="FCFA">FCFA (Franc CFA)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="USD">USD ($ Dollar)</option>
              <option value="GNF">GNF (Franc Guinéen)</option>
            </select>
          </div>
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
              placeholder="Ex : Dakar ou Bamako"
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
              placeholder="Ex : Sénégal ou Mali"
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <button type="submit" className="btn btn-primary">
          <Check size={18} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default BusinessProfileForm;