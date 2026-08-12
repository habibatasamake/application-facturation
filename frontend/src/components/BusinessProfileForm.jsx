import { useState } from "react";

function BusinessProfileForm({ initialData, onSubmit, submitLabel }) {
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

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom du commerce</label>
        <br />
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="Ex : Boutique Habibata"
        />
      </div>

      <div>
        <label>Téléphone</label>
        <br />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Ex : +223 70 00 00 00"
        />
      </div>

      <div>
        <label>Adresse</label>
        <br />
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Ex : Bamako, Mali"
        />
      </div>

      <div>
        <label>Ville</label>
        <br />
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Ex : Bamako"
        />
      </div>

      <div>
        <label>Pays</label>
        <br />
        <input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          placeholder="Ex : Mali"
        />
      </div>

      <div>
        <label>Devise</label>
        <br />
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
        >
          <option value="FCFA">FCFA</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default BusinessProfileForm;