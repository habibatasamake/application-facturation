import { useState } from "react";
import { User, Phone, Mail, MapPin, Building, Globe, Check } from "lucide-react";

function CustomerForm({ initialData, onSubmit, submitLabel = "Enregistrer" }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
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
        <label htmlFor="customer-name">Nom complet ou Raison sociale *</label>
        <div className="input-wrapper">
          <User className="input-icon" size={18} />
          <input
            id="customer-name"
            type="text"
            name="name"
            className="input-with-icon"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex : Awa Traoré ou Entreprise Sahel SARL"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="customer-phone">Numéro de téléphone</label>
          <div className="input-wrapper">
            <Phone className="input-icon" size={18} />
            <input
              id="customer-phone"
              type="text"
              name="phone"
              className="input-with-icon"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex : +223 70 11 22 33"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="customer-email">Adresse email</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              id="customer-email"
              type="email"
              name="email"
              className="input-with-icon"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex : client@domaine.com"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="customer-address">Adresse physique</label>
        <div className="input-wrapper">
          <MapPin className="input-icon" size={18} />
          <input
            id="customer-address"
            type="text"
            name="address"
            className="input-with-icon"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ex : Quartier ACI 2000, Rue 412"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="customer-city">Ville</label>
          <div className="input-wrapper">
            <Building className="input-icon" size={18} />
            <input
              id="customer-city"
              type="text"
              name="city"
              className="input-with-icon"
              value={formData.city}
              onChange={handleChange}
              placeholder="Ex : Bamako"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="customer-country">Pays</label>
          <div className="input-wrapper">
            <Globe className="input-icon" size={18} />
            <input
              id="customer-country"
              type="text"
              name="country"
              className="input-with-icon"
              value={formData.country}
              onChange={handleChange}
              placeholder="Ex : Mali"
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

export default CustomerForm;