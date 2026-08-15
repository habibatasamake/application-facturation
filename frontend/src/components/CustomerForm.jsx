import { useState } from "react";

function CustomerForm({ initialData, onSubmit, submitLabel }) {
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
        <label>Nom du client</label>
        <br />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex : Awa Traoré"
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
          placeholder="Ex : +223 70 11 22 33"
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
          placeholder="Ex : client@example.com"
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
          placeholder="Ex : Bamako"
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

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default CustomerForm;