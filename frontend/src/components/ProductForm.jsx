import { useState } from "react";
import { Package, FileText, DollarSign, Layers, Percent, Check } from "lucide-react";

function ProductForm({ initialData, onSubmit, submitLabel = "Enregistrer" }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    unitPrice: initialData?.unitPrice || "",
    unit: initialData?.unit || "pièce",
    taxRate: initialData?.taxRate ?? 0,
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
      <div className="form-group">
        <label htmlFor="product-name">Désignation du produit ou service *</label>
        <div className="input-wrapper">
          <Package className="input-icon" size={18} />
          <input
            id="product-name"
            type="text"
            name="name"
            className="input-with-icon"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex : Sac de riz 50kg, Prestation de conseil, etc."
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="product-desc">Description complémentaire</label>
        <div className="input-wrapper">
          <FileText className="input-icon" size={18} />
          <input
            id="product-desc"
            type="text"
            name="description"
            className="input-with-icon"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ex : Riz brisé blanc de qualité supérieure"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="product-price">Prix unitaire (HT) *</label>
          <div className="input-wrapper">
            <DollarSign className="input-icon" size={18} />
            <input
              id="product-price"
              type="number"
              name="unitPrice"
              className="input-with-icon"
              value={formData.unitPrice}
              onChange={handleChange}
              placeholder="Ex : 25000"
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="product-unit">Unité de mesure *</label>
          <div className="input-wrapper">
            <Layers className="input-icon" size={18} />
            <input
              id="product-unit"
              type="text"
              name="unit"
              className="input-with-icon"
              value={formData.unit}
              onChange={handleChange}
              placeholder="Ex : pièce, sac, kg, heure, forfait"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="product-tax">Taux de TVA (%)</label>
          <div className="input-wrapper">
            <Percent className="input-icon" size={18} />
            <input
              id="product-tax"
              type="number"
              name="taxRate"
              className="input-with-icon"
              value={formData.taxRate}
              onChange={handleChange}
              placeholder="0"
              min="0"
              max="100"
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

export default ProductForm;