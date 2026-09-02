import { useEffect, useState } from "react";
import {
  Package,
  PlusCircle,
  Search,
  Tag,
  Edit2,
  Trash2,
  Percent,
} from "lucide-react";
import api from "../api/axiosConfig";
import ProductForm from "../components/ProductForm";
import Modal from "../components/Modal";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [currency, setCurrency] = useState("FCFA");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} ${currency}`;
  };

  const fetchProductsAndProfile = async () => {
    try {
      const [prodRes, profileRes] = await Promise.allSettled([
        api.get("/products"),
        api.get("/business-profile"),
      ]);

      if (prodRes.status === "fulfilled") {
        setProducts(prodRes.value.data.products || []);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.data.businessProfile?.currency) {
        setCurrency(profileRes.value.data.businessProfile.currency);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la récupération des produits"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndProfile();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCreateProduct = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/products", formData);
      setProducts([response.data.product, ...products]);
      setMessage("Produit ou prestation ajouté(e) au catalogue avec succès");
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du produit"
      );
    }
  };

  const handleUpdateProduct = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.put(
        `/products/${selectedProduct.id}`,
        formData
      );

      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id ? response.data.product : p
        )
      );

      setMessage("Produit mis à jour avec succès");
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la modification du produit"
      );
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir désactiver le produit "${productName}" du catalogue ?`
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p.id !== productId));
      setMessage("Produit désactivé avec succès");
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la désactivation du produit"
      );
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.unit && p.unit.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={28} color="var(--primary)" />
            Catalogue Produits & Services
          </h1>
          <p className="page-subtitle">
            {products.length} article{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <PlusCircle size={18} />
          Ajouter un article
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="input-with-icon"
              placeholder="Rechercher par libellé, description, unité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Chargement des articles...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package size={28} />
            </div>
            <h3 className="empty-state-title">
              {searchTerm ? "Aucun article ne correspond à votre recherche" : "Votre catalogue est vide"}
            </h3>
            <p className="empty-state-desc">
              {searchTerm
                ? "Essayez avec un autre mot-clé."
                : "Enregistrez vos produits ou prestations récurrentes pour les ajouter en 1 clic sur vos factures."}
            </p>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                <PlusCircle size={18} />
                Ajouter un premier article
              </button>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Description</th>
                  <th>Prix Unitaire</th>
                  <th>Unité</th>
                  <th>TVA</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--radius-sm)",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--secondary)",
                          }}
                        >
                          <Tag size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      {product.description || "-"}
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary)" }}>
                        {formatAmount(product.unitPrice)}
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-gray">{product.unit || "pièce"}</span>
                    </td>
                    <td>
                      {product.taxRate ? (
                        <span className="badge badge-warning">
                          <Percent size={12} /> {product.taxRate}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-light)", fontSize: "13px" }}>0%</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(product)}
                          title="Modifier cet article"
                        >
                          <Edit2 size={14} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          title="Désactiver cet article"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour Créer / Modifier un Produit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedProduct ? "Modifier l'article" : "Ajouter un nouvel article au catalogue"}
      >
        <ProductForm
          initialData={selectedProduct}
          onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
          submitLabel={selectedProduct ? "Enregistrer les modifications" : "Ajouter au catalogue"}
        />
      </Modal>
    </div>
  );
}

export default ProductsPage;