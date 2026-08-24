import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const BACKEND_URL = "http://localhost:5001";

import api from "../api/axiosConfig";

function CreateInvoicePage() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerMode, setCustomerMode] = useState("EXISTING");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [temporaryCustomer, setTemporaryCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [invoiceItems, setInvoiceItems] = useState([]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} FCFA`;
  };

  const fetchData = async () => {
    try {
      const [customersResponse, productsResponse] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
      ]);

      setCustomers(customersResponse.data.customers);
      setProducts(productsResponse.data.products);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors du chargement des données"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleTemporaryCustomerChange = (event) => {
    const { name, value } = event.target;

    setTemporaryCustomer({
      ...temporaryCustomer,
      [name]: value,
    });
  };

  const handleAddProductLine = () => {
    setError("");

    if (!selectedProductId) {
      setError("Veuillez sélectionner un produit");
      return;
    }

    const selectedProduct = products.find(
      (product) => product.id === selectedProductId
    );

    if (!selectedProduct) {
      setError("Produit introuvable");
      return;
    }

    const selectedQuantity = Number(quantity);

    if (!selectedQuantity || selectedQuantity <= 0) {
      setError("La quantité doit être supérieure à 0");
      return;
    }

    const existingItem = invoiceItems.find(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItem) {
      const updatedItems = invoiceItems.map((item) => {
        if (item.productId !== selectedProduct.id) {
          return item;
        }

        const newQuantity = item.quantity + selectedQuantity;
        const lineSubTotal = item.unitPrice * newQuantity;
        const lineTaxTotal = lineSubTotal * ((item.taxRate || 0) / 100);
        const lineTotal = lineSubTotal + lineTaxTotal;

        return {
          ...item,
          quantity: newQuantity,
          lineSubTotal,
          lineTaxTotal,
          lineTotal,
        };
      });

      setInvoiceItems(updatedItems);
    } else {
      const unitPrice = Number(selectedProduct.unitPrice);
      const taxRate = Number(selectedProduct.taxRate || 0);

      const lineSubTotal = unitPrice * selectedQuantity;
      const lineTaxTotal = lineSubTotal * (taxRate / 100);
      const lineTotal = lineSubTotal + lineTaxTotal;

      const newItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        description: selectedProduct.description,
        unitPrice,
        unit: selectedProduct.unit,
        taxRate,
        quantity: selectedQuantity,
        lineSubTotal,
        lineTaxTotal,
        lineTotal,
      };

      setInvoiceItems([...invoiceItems, newItem]);
    }

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveItem = (productId) => {
    setInvoiceItems(
      invoiceItems.filter((item) => item.productId !== productId)
    );
  };

  const buildInvoicePayload = () => {
    const payload = {
      items: invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      notes,
    };

    if (customerMode === "EXISTING") {
      if (!selectedCustomerId) {
        throw new Error("Veuillez sélectionner un client");
      }

      payload.customerId = selectedCustomerId;
    }

    if (customerMode === "TEMPORARY") {
      if (!temporaryCustomer.name.trim()) {
        throw new Error("Le nom du client ponctuel est obligatoire");
      }

      payload.customer = {
        name: temporaryCustomer.name.trim(),
        phone: temporaryCustomer.phone || null,
        email: temporaryCustomer.email || null,
        address: temporaryCustomer.address || null,
        city: temporaryCustomer.city || null,
        country: temporaryCustomer.country || null,
      };
    }

    if (invoiceItems.length === 0) {
      throw new Error("Veuillez ajouter au moins un produit à la facture");
    }

    return payload;
  };

  const handlePreviewInvoice = async () => {
    setError("");
    setMessage("");
    setPreview(null);
    setIsPreviewLoading(true);

    try {
      const payload = buildInvoicePayload();

      const response = await api.post("/invoices/preview", payload);

      setPreview(response.data.preview);
      setMessage(response.data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de la prévisualisation"
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setError("");
    setMessage("");
    setCreatedInvoice(null);
    setIsCreateLoading(true);

    try {
      const payload = buildInvoicePayload();

      const response = await api.post("/invoices", payload);

      setCreatedInvoice(response.data.invoice);
      setMessage(response.data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de la validation de la facture"
      );
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!createdInvoice) {
      return;
    }

    const pdfLink = `${BACKEND_URL}${createdInvoice.pdfUrl}`;

    const message = `Bonjour ${createdInvoice.customerName}, voici votre facture ${createdInvoice.invoiceNumber} d'un montant de ${formatAmount(
      createdInvoice.total
    )}. Vous pouvez consulter le PDF ici : ${pdfLink}`;

    const phone = formatPhoneForWhatsApp(createdInvoice.customerPhone);

    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");

    try {
      const response = await api.patch(
        `/invoices/${createdInvoice.id}/share-status`,
        {
          shareStatus: "SHARED",
        }
      );

      setCreatedInvoice(response.data.invoice);
      setMessage("Lien WhatsApp ouvert et statut de partage mis à jour");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du statut de partage"
      );
    }
  };

  const subTotal = invoiceItems.reduce(
    (sum, item) => sum + item.lineSubTotal,
    0
  );

  const taxTotal = invoiceItems.reduce(
    (sum, item) => sum + item.lineTaxTotal,
    0
  );

  const total = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const formatPhoneForWhatsApp = (phone) => {
      if (!phone) return "";

      return phone.replace(/\D/g, "");
    };

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Créer une facture</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2>Client</h2>

      <div>
        <label>
          <input
            type="radio"
            value="EXISTING"
            checked={customerMode === "EXISTING"}
            onChange={() => setCustomerMode("EXISTING")}
          />
          Client existant
        </label>

        <br />

        <label>
          <input
            type="radio"
            value="TEMPORARY"
            checked={customerMode === "TEMPORARY"}
            onChange={() => setCustomerMode("TEMPORARY")}
          />
          Client ponctuel
        </label>
      </div>

      <br />

      {customerMode === "EXISTING" && (
        <div>
          <label>Choisir un client existant</label>
          <br />
          <select
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
          >
            <option value="">-- Sélectionner un client --</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {customerMode === "TEMPORARY" && (
        <div>
          <h3>Informations du client ponctuel</h3>

          <div>
            <label>Nom du client *</label>
            <br />
            <input
              type="text"
              name="name"
              value={temporaryCustomer.name}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : Awa Traoré"
            />
          </div>

          <div>
            <label>Téléphone</label>
            <br />
            <input
              type="text"
              name="phone"
              value={temporaryCustomer.phone}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : +223 70 11 22 33"
            />
          </div>

          <div>
            <label>Email</label>
            <br />
            <input
              type="email"
              name="email"
              value={temporaryCustomer.email}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : client@example.com"
            />
          </div>

          <div>
            <label>Adresse</label>
            <br />
            <input
              type="text"
              name="address"
              value={temporaryCustomer.address}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : Quartier ACI"
            />
          </div>

          <div>
            <label>Ville</label>
            <br />
            <input
              type="text"
              name="city"
              value={temporaryCustomer.city}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : Bamako"
            />
          </div>

          <div>
            <label>Pays</label>
            <br />
            <input
              type="text"
              name="country"
              value={temporaryCustomer.country}
              onChange={handleTemporaryCustomerChange}
              placeholder="Ex : Mali"
            />
          </div>
        </div>
      )}

      <hr />

      <h2>Produits</h2>

      <div>
        <label>Choisir un produit</label>
        <br />
        <select
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
        >
          <option value="">-- Sélectionner un produit --</option>

          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {formatAmount(product.unitPrice)} /{" "}
              {product.unit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Quantité</label>
        <br />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </div>

      <br />

      <button onClick={handleAddProductLine}>Ajouter à la facture</button>

      <hr />

      <h2>Lignes de facture</h2>

      {invoiceItems.length === 0 ? (
        <p>Aucun produit ajouté à la facture.</p>
      ) : (
        <>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix unitaire</th>
                <th>Unité</th>
                <th>Quantité</th>
                <th>Taxe</th>
                <th>Total ligne</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{formatAmount(item.unitPrice)}</td>
                  <td>{item.unit}</td>
                  <td>{item.quantity}</td>
                  <td>{item.taxRate}%</td>
                  <td>{formatAmount(item.lineTotal)}</td>
                  <td>
                    <button onClick={() => handleRemoveItem(item.productId)}>
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Totaux</h3>

          <p>Sous-total : {formatAmount(subTotal)}</p>
          <p>Taxe : {formatAmount(taxTotal)}</p>
          <p>
            <strong>Total : {formatAmount(total)}</strong>
          </p>


        <div>
          <label>Notes</label>
          <br />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex : Paiement à la livraison. Merci pour votre confiance."
            rows="4"
            cols="50"
          />
        </div>  

        <br />

        <button onClick={handlePreviewInvoice} disabled={isPreviewLoading}>
          {isPreviewLoading ? "Prévisualisation..." : "Prévisualiser la facture"}
        </button>


        {preview && (
          <div>
            <hr />

            <h2>Prévisualisation</h2>

            <p>
              <strong>Client :</strong> {preview.customerName}
            </p>

            {preview.customerPhone && (
              <p>
                <strong>Téléphone :</strong> {preview.customerPhone}
              </p>
            )}

            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix unitaire</th>
                  <th>Quantité</th>
                  <th>Taxe</th>
                  <th>Total ligne</th>
                </tr>
              </thead>

              <tbody>
                {preview.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.productName}</td>
                    <td>{formatAmount(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>{item.taxRate}%</td>
                    <td>{formatAmount(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Total prévisualisé</h3>

            <p>Sous-total : {formatAmount(preview.subTotal)}</p>
            <p>Taxe : {formatAmount(preview.taxTotal)}</p>
            <p>
              <strong>Total : {formatAmount(preview.total)}</strong>
            </p>

            {preview.notes && (
              <p>
                <strong>Notes :</strong> {preview.notes}
              </p>
            )}

            <br />

            <button onClick={handleCreateInvoice} disabled={isCreateLoading}>
              {isCreateLoading ? "Validation..." : "Valider la facture"}
            </button>
          </div>
        )}

        {createdInvoice && (
          <div>
            <hr />

            <h2>Facture créée</h2>

            <p>
              <strong>Numéro :</strong> {createdInvoice.invoiceNumber}
            </p>

            <p>
              <strong>Total :</strong> {formatAmount(createdInvoice.total)}
            </p>

            {createdInvoice.pdfUrl && (
              <p>
                <a
                  href={`${BACKEND_URL}${createdInvoice.pdfUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir le PDF
                </a>
              </p>
            )}
            <button onClick={handleShareWhatsApp}>
              Partager via WhatsApp
            </button>
            
            <br />
            <br />

            <Link to="/invoices">
              <button>Retour à l’historique des factures</button>
            </Link>
          </div>
        )}
        </>
        
      )}
    </div>
  );
}

export default CreateInvoicePage;