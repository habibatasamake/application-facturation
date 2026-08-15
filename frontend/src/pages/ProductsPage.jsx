import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import ProductForm from "../components/ProductForm";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.products);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la récupération des produits"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const handleCreateProduct = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/products", formData);

      setProducts([response.data.product, ...products]);
      setMessage(response.data.message);
      setShowForm(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la création du produit"
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
        products.map((product) =>
            product.id === selectedProduct.id
            ? response.data.product
            : product
        )
        );

        setMessage(response.data.message);
        setSelectedProduct(null);
        setShowForm(false);
    } catch (error) {
        setError(
        error.response?.data?.message ||
            "Erreur lors de la modification du produit"
        );
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm(
        "Voulez-vous vraiment désactiver ce produit ?"
    );

    if (!confirmDelete) {
        return;
    }

    setMessage("");
    setError("");

    try {
        const response = await api.delete(`/products/${productId}`);

        setProducts(products.filter((product) => product.id !== productId));
        setMessage(response.data.message);
    } catch (error) {
        setError(
        error.response?.data?.message ||
            "Erreur lors de la suppression du produit"
        );
    }
  };


  if (isLoading) {
    return <p>Chargement des produits...</p>;
  }

  return (
    <div>
      <h1>Catalogue produits</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <button
        onClick={() => {
            setSelectedProduct(null);
            setShowForm(!showForm);
        }}
        >
        {showForm ? "Annuler" : "Ajouter un produit"}
       </button>

      {showForm && (
        <div>
            <h2>{selectedProduct ? "Modifier le produit" : "Nouveau produit"}</h2>

            <ProductForm
            initialData={selectedProduct}
            onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
            submitLabel={
                selectedProduct
                ? "Enregistrer les modifications"
                : "Créer le produit"
            }
            />
        </div>
        )
      }

      <hr />

      {products.length === 0 ? (
        <p>Aucun produit enregistré pour le moment.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Prix unitaire</th>
              <th>Unité</th>
              <th>Taxe</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>{product.unitPrice}</td>
                <td>{product.unit}</td>
                <td>{product.taxRate ?? 0}%</td>
                <td>
                    <button
                    onClick={() => {
                        setSelectedProduct(product);
                        setShowForm(true);
                    }}
                    >
                    Modifier
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)}>
                        Supprimer
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductsPage;