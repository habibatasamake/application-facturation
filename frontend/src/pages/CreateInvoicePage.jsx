import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  User,
  Package,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  ExternalLink,
  Share2,
  ArrowLeft,
  Coins,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import api, { BACKEND_URL } from "../api/axiosConfig";
import Modal from "../components/Modal";

function CreateInvoicePage() {
  const [docType, setDocType] = useState("INVOICE");
  const [currency, setCurrency] = useState("FCFA");
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
  const [notes, setNotes] = useState("Paiement à réception. Merci pour votre confiance.");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const [businessProfile, setBusinessProfile] = useState(null);

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} ${currency}`;
  };

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, profileRes] = await Promise.allSettled([
        api.get("/customers"),
        api.get("/products"),
        api.get("/business-profile"),
      ]);

      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value.data.customers || []);
      }
      if (productsRes.status === "fulfilled") {
        setProducts(productsRes.value.data.products || []);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.data.businessProfile) {
        setBusinessProfile(profileRes.value.data.businessProfile);
        if (profileRes.value.data.businessProfile.currency) {
          setCurrency(profileRes.value.data.businessProfile.currency);
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleTemporaryCustomerChange = (e) => {
    const { name, value } = e.target;
    setTemporaryCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProductLine = () => {
    setError("");

    if (!selectedProductId) {
      setError("Veuillez sélectionner un article dans la liste");
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      setError("Produit introuvable");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("La quantité doit être supérieure à 0");
      return;
    }

    const existingIndex = invoiceItems.findIndex((item) => item.productId === prod.id);

    if (existingIndex > -1) {
      const updated = [...invoiceItems];
      const newQty = updated[existingIndex].quantity + qty;
      const lineSubTotal = updated[existingIndex].unitPrice * newQty;
      const lineTaxTotal = lineSubTotal * ((updated[existingIndex].taxRate || 0) / 100);
      const lineTotal = lineSubTotal + lineTaxTotal;

      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        lineSubTotal,
        lineTaxTotal,
        lineTotal,
      };
      setInvoiceItems(updated);
    } else {
      const unitPrice = Number(prod.unitPrice);
      const taxRate = Number(prod.taxRate || 0);
      const lineSubTotal = unitPrice * qty;
      const lineTaxTotal = lineSubTotal * (taxRate / 100);
      const lineTotal = lineSubTotal + lineTaxTotal;

      setInvoiceItems([
        ...invoiceItems,
        {
          productId: prod.id,
          productName: prod.name,
          description: prod.description,
          unitPrice,
          unit: prod.unit,
          taxRate,
          quantity: qty,
          lineSubTotal,
          lineTaxTotal,
          lineTotal,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveItem = (productId) => {
    setInvoiceItems(invoiceItems.filter((i) => i.productId !== productId));
  };

  const buildInvoicePayload = () => {
    const payload = {
      type: docType,
      items: invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      notes,
    };

    if (customerMode === "EXISTING") {
      if (!selectedCustomerId) {
        throw new Error("Veuillez sélectionner un client pour émettre la facture");
      }
      payload.customerId = selectedCustomerId;
    } else {
      if (!temporaryCustomer.name.trim()) {
        throw new Error("Le nom du client est obligatoire");
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
      throw new Error("Veuillez ajouter au moins un produit ou service à la facture");
    }

    return payload;
  };

  const handlePreviewInvoice = async () => {
    setError("");
    setMessage("");
    setIsPreviewLoading(true);

    try {
      const payload = buildInvoicePayload();
      const response = await api.post("/invoices/preview", payload);
      setPreview(response.data.preview);
      setIsPreviewModalOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Erreur lors de la prévisualisation"
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setError("");
    setMessage("");
    setIsCreateLoading(true);

    try {
      const payload = buildInvoicePayload();
      const response = await api.post("/invoices", payload);
      setCreatedInvoice(response.data.invoice);
      setIsPreviewModalOpen(false);
      setMessage("Facture créée et PDF généré avec succès !");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Erreur lors de l'enregistrement de la facture"
      );
    } finally {
      setIsCreateLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const handleShareWhatsApp = async () => {
    if (!createdInvoice) return;

    const pdfLink = `${BACKEND_URL}${createdInvoice.pdfUrl}`;

    const payParts = [];
    if (businessProfile?.waveNumber) payParts.push(`• Wave : ${businessProfile.waveNumber}`);
    if (businessProfile?.orangeMoneyNumber) payParts.push(`• Orange Money : ${businessProfile.orangeMoneyNumber}`);
    if (businessProfile?.momoNumber) payParts.push(`• MoMo : ${businessProfile.momoNumber}`);
    
    const paySection = payParts.length > 0 
      ? `\n\n💳 Modalités de règlement :\n${payParts.join("\n")}`
      : "";

    const docTypeLabel = createdInvoice.type === "QUOTE" ? "devis" : "facture";
    const whatsappMsg = `Bonjour ${createdInvoice.customerName},\nVoici votre ${docTypeLabel} N° *${createdInvoice.invoiceNumber}* d'un montant de *${formatAmount(createdInvoice.total)}*.\n\n📄 Consulter / Télécharger le PDF : ${pdfLink}${paySection}\n\nMerci pour votre confiance !`;

    const phone = formatPhoneForWhatsApp(createdInvoice.customerPhone);
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

    window.open(whatsappUrl, "_blank");

    try {
      const response = await api.patch(
        `/invoices/${createdInvoice.id}/share-status`,
        { shareStatus: "SHARED" }
      );
      setCreatedInvoice(response.data.invoice);
      setMessage("Lien WhatsApp ouvert et statut de partage mis à jour");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintInvoice = () => {
    if (!createdInvoice || !createdInvoice.pdfUrl) return;
    const pdfUrl = `${BACKEND_URL}${createdInvoice.pdfUrl}`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        window.open(pdfUrl, "_blank");
      }
    };
  };

  const subTotal = invoiceItems.reduce((sum, item) => sum + item.lineSubTotal, 0);
  const taxTotal = invoiceItems.reduce((sum, item) => sum + item.lineTaxTotal, 0);
  const grandTotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const selectedCustomerObj =
    customerMode === "EXISTING"
      ? customers.find((c) => c.id === selectedCustomerId)
      : temporaryCustomer;

  if (isLoading) {
    return (
      <div className="empty-state">
        <p>Chargement du module de facturation...</p>
      </div>
    );
  }

  // Écran de confirmation après création
  if (createdInvoice) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--success-light)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>
            Facture émise avec succès !
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Le document a été enregistré sous le numéro{" "}
            <strong style={{ color: "var(--primary)" }}>{createdInvoice.invoiceNumber}</strong>
          </p>

          <div
            style={{
              background: "var(--bg-main)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              marginBottom: "28px",
              textAlign: "left",
            }}
          >
            <div className="receipt-row">
              <span>Client :</span>
              <strong>{createdInvoice.customerName}</strong>
            </div>
            <div className="receipt-row">
              <span>Montant total :</span>
              <strong style={{ fontSize: "16px", color: "var(--text-main)" }}>
                {formatAmount(createdInvoice.total)}
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {createdInvoice.pdfUrl && (
              <>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href={`${BACKEND_URL}${createdInvoice.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-lg"
                    style={{ flex: 1 }}
                  >
                    <ExternalLink size={18} />
                    Ouvrir / PDF
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={handlePrintInvoice}
                    style={{ flex: 1 }}
                  >
                    <Printer size={18} />
                    Imprimer
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              className="btn btn-whatsapp btn-lg"
              onClick={handleShareWhatsApp}
            >
              <Share2 size={18} />
              Partager au client via WhatsApp
            </button>

            <Link
              to="/invoices"
              className="btn btn-primary"
              style={{ marginTop: "12px" }}
            >
              <ArrowLeft size={16} />
              Retour à la liste des factures
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={28} color="var(--primary)" />
            Nouvelle émission
          </h1>
          <p className="page-subtitle">Créez et envoyez une facture ou un devis personnalisé</p>
        </div>

        <Link to="/invoices" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Retour aux factures
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="invoice-creator-layout">
        {/* Colonne gauche : Formulaire */}
        <div>
          {/* Type de document */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <FileSpreadsheet size={18} color="var(--primary)" />
                1. Type de document
              </h2>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className={`btn ${docType === "INVOICE" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => setDocType("INVOICE")}
              >
                Facture commerciale
              </button>
              <button
                type="button"
                className={`btn ${docType === "QUOTE" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => setDocType("QUOTE")}
              >
                Devis estimatif
              </button>
            </div>
          </div>

          {/* Destinataire Client */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <User size={18} color="var(--primary)" />
                2. Destinataire (Client)
              </h2>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="customerMode"
                  checked={customerMode === "EXISTING"}
                  onChange={() => setCustomerMode("EXISTING")}
                />
                Client enregistré
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="customerMode"
                  checked={customerMode === "TEMPORARY"}
                  onChange={() => setCustomerMode("TEMPORARY")}
                />
                Client ponctuel
              </label>
            </div>

            {customerMode === "EXISTING" ? (
              <div className="form-group">
                <label>Sélectionner un client dans votre carnet</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choisir un client existant --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} {c.city ? `- ${c.city}` : ""}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                    Aucun client enregistré. Vous pouvez basculer sur "Client ponctuel" ou en créer dans le menu Clients.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>Nom ou Raison sociale *</label>
                  <input
                    type="text"
                    name="name"
                    value={temporaryCustomer.name}
                    onChange={handleTemporaryCustomerChange}
                    placeholder="Ex : Moussa Diarra"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      name="phone"
                      value={temporaryCustomer.phone}
                      onChange={handleTemporaryCustomerChange}
                      placeholder="Ex : +223 70 00 00 00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={temporaryCustomer.email}
                      onChange={handleTemporaryCustomerChange}
                      placeholder="Ex : client@mail.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      name="city"
                      value={temporaryCustomer.city}
                      onChange={handleTemporaryCustomerChange}
                      placeholder="Ex : Bamako"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pays</label>
                    <input
                      type="text"
                      name="country"
                      value={temporaryCustomer.country}
                      onChange={handleTemporaryCustomerChange}
                      placeholder="Ex : Mali"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lignes de facturation */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <Package size={18} color="var(--primary)" />
                3. Articles & Prestations
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px auto", gap: "12px", alignItems: "end", marginBottom: "20px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sélectionner un article du catalogue</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Choisir un produit ou service --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatAmount(p.unitPrice)} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddProductLine}
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>

            {/* Tableau des lignes */}
            {invoiceItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Aucun article ajouté pour le moment. Sélectionnez un produit ci-dessus et cliquez sur "Ajouter".
                </p>
              </div>
            ) : (
              <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Prix unitaire</th>
                      <th>Qté</th>
                      <th>TVA</th>
                      <th>Total</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.productId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        </td>
                        <td>{formatAmount(item.unitPrice)}</td>
                        <td>
                          {item.quantity} {item.unit || ""}
                        </td>
                        <td>{item.taxRate}%</td>
                        <td>
                          <strong>{formatAmount(item.lineTotal)}</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveItem(item.productId)}
                            title="Supprimer cette ligne"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Coins size={18} color="var(--primary)" />
                4. Conditions & Notes
              </h2>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Instructions de paiement ou message de remerciement</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : Paiement sous 30 jours. Coordonnées bancaires..."
              />
            </div>
          </div>
        </div>

        {/* Colonne droite : Récapitulatif Sticky */}
        <div>
          <div className="receipt-summary-card">
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
              Récapitulatif
            </h3>

            <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Client
              </span>
              <div style={{ fontWeight: 700, marginTop: "2px" }}>
                {selectedCustomerObj?.name || "Non sélectionné"}
              </div>
              {selectedCustomerObj?.phone && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  📞 {selectedCustomerObj.phone}
                </div>
              )}
            </div>

            <div className="receipt-row">
              <span>Articles ajoutés :</span>
              <strong>{invoiceItems.length}</strong>
            </div>

            <div className="receipt-row">
              <span>Sous-total HT :</span>
              <span>{formatAmount(subTotal)}</span>
            </div>

            <div className="receipt-row">
              <span>Total TVA :</span>
              <span>{formatAmount(taxTotal)}</span>
            </div>

            <div className="receipt-row total-row">
              <span>Total TTC :</span>
              <span style={{ color: "var(--primary)" }}>{formatAmount(grandTotal)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={handlePreviewInvoice}
                disabled={isPreviewLoading || invoiceItems.length === 0}
              >
                <Eye size={18} />
                {isPreviewLoading ? "Calcul..." : "Prévisualiser le document"}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleCreateInvoice}
                disabled={isCreateLoading || invoiceItems.length === 0}
              >
                <CheckCircle2 size={18} />
                {isCreateLoading ? "Génération..." : "Valider & Émettre"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Prévisualisation */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Aperçu avant validation (${docType === "QUOTE" ? "Devis" : "Facture"})`}
        size="lg"
      >
        {preview && (
          <div>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "20px" }}>
              <p><strong>Destinataire :</strong> {preview.customerName}</p>
              {preview.customerPhone && <p style={{ fontSize: "13px" }}>📞 {preview.customerPhone}</p>}
              {preview.customerAddress && <p style={{ fontSize: "13px" }}>📍 {preview.customerAddress}</p>}
            </div>

            <div className="table-container" style={{ marginBottom: "20px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>TVA</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td>{formatAmount(item.unitPrice)}</td>
                      <td>{item.quantity} {item.unit || ""}</td>
                      <td>{item.taxRate}%</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatAmount(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
              <div style={{ width: "260px", background: "#f8fafc", padding: "16px", borderRadius: "var(--radius-md)" }}>
                <div className="receipt-row">
                  <span>Sous-total :</span>
                  <span>{formatAmount(preview.subTotal)}</span>
                </div>
                <div className="receipt-row">
                  <span>Taxe :</span>
                  <span>{formatAmount(preview.taxTotal)}</span>
                </div>
                <div className="receipt-row total-row">
                  <span>Total TTC :</span>
                  <span style={{ color: "var(--primary)" }}>{formatAmount(preview.total)}</span>
                </div>
              </div>
            </div>

            {preview.notes && (
              <p style={{ fontSize: "13px", color: "var(--secondary)", fontStyle: "italic" }}>
                Notes : {preview.notes}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateInvoice}
                disabled={isCreateLoading}
              >
                <CheckCircle2 size={18} />
                {isCreateLoading ? "Émission en cours..." : "Confirmer et émettre"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CreateInvoicePage;