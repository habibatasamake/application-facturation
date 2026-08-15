import { useState } from "react";

function ProductForm({ initialData, onSubmit, submitLabel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    unitPrice: initialData?.unitPrice || "",
    unit: initialData?.unit || "",
    taxRate: initialData?.taxRate ?? 0,
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

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      unit: formData.unit.trim(),
      unitPrice: Number(formData.unitPrice),
      taxRate: Number(formData.taxRate || 0),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom du produit *</label>
        <br />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex : Sac de riz"
          required
        />
      </div>

      <div>
        <label>Description</label>
        <br />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Ex : Sac de riz 50kg"
        />
      </div>

      <div>
        <label>Prix unitaire *</label>
        <br />
        <input
          type="number"
          name="unitPrice"
          value={formData.unitPrice}
          onChange={handleChange}
          placeholder="Ex : 25000"
          min="1"
          required
        />
      </div>

      <div>
        <label>Unité *</label>
        <br />
        <input
          type="text"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          placeholder="Ex : sac, pièce, kg, litre"
          required
        />
      </div>

      <div>
        <label>Taux de taxe (%)</label>
        <br />
        <input
          type="number"
          name="taxRate"
          value={formData.taxRate}
          onChange={handleChange}
          placeholder="Ex : 0"
          min="0"
        />
      </div>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default ProductForm;