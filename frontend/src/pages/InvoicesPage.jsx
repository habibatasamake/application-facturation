import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  PlusCircle,
  Search,
  ExternalLink,
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  Calendar,
  CreditCard,
  RefreshCw,
  // eslint-disable-next-line no-unused-vars
  FileSpreadsheet,
  Printer,
  Phone,
  Mail,
  MapPin,
  ArrowRightLeft,
  Coins,
} from "lucide-react";
import api, { BACKEND_URL } from "../api/axiosConfig";
import Modal from "../components/Modal";

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [currency, setCurrency] = useState("FCFA");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("ALL"); // ALL, INVOICE, QUOTE, PAID, PENDING
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal d'enregistrement de règlement / acompte
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [businessProfile, setBusinessProfile] = useState(null);

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} ${currency}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} à ${formattedTime}`;
  };

  const fetchInvoicesAndProfile = async () => {
    try {
      const [invRes, profileRes] = await Promise.allSettled([
        api.get("/invoices"),
        api.get("/business-profile"),
      ]);

      if (invRes.status === "fulfilled") {
        setInvoices(invRes.value.data.invoices || []);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.data.businessProfile) {
        setBusinessProfile(profileRes.value.data.businessProfile);
        if (profileRes.value.data.businessProfile.currency) {
          setCurrency(profileRes.value.data.businessProfile.currency);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la récupération des factures"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoicesAndProfile();
  }, []);

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const handleShareWhatsApp = async (invoice) => {
    setError("");
    setMessage("");

    if (!invoice.pdfUrl) {
      setError("Cette facture n’a pas encore de PDF associé");
      return;
    }

    const pdfLink = `${BACKEND_URL}${invoice.pdfUrl}`;
    
    // Coordonnées de paiement
    const payParts = [];
    if (businessProfile?.waveNumber) payParts.push(`• Wave : ${businessProfile.waveNumber}`);
    if (businessProfile?.orangeMoneyNumber) payParts.push(`• Orange Money : ${businessProfile.orangeMoneyNumber}`);
    if (businessProfile?.momoNumber) payParts.push(`• MoMo : ${businessProfile.momoNumber}`);
    
    const paySection = payParts.length > 0 
      ? `\n\nModalites de reglement :\n${payParts.join("\n")}`
      : "";

    const docTypeLabel = invoice.type === "QUOTE" ? "devis" : "facture";
    const whatsappMessage = `Bonjour ${invoice.customerName},\nVoici votre ${docTypeLabel} N° *${invoice.invoiceNumber}* d'un montant de *${formatAmount(invoice.total)}*.\n\nConsulter / Telecharger le PDF : ${pdfLink}${paySection}\n\nMerci pour votre confiance !`;

    const phone = formatPhoneForWhatsApp(invoice.customerPhone);
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, "_blank");

    try {
      const response = await api.patch(
        `/invoices/${invoice.id}/share-status`,
        { shareStatus: "SHARED" }
      );

      setInvoices(
        invoices.map((item) =>
          item.id === invoice.id ? response.data.invoice : item
        )
      );

      setMessage(`Document ${invoice.invoiceNumber} partagé avec succès`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la mise à jour du statut"
      );
    }
  };

  const handlePrintInvoice = (invoice) => {
    if (!invoice.pdfUrl) return;
    const pdfUrl = `${BACKEND_URL}${invoice.pdfUrl}`;
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

  const handleOpenPaymentModal = (invoice) => {
    setMessage("");
    setError("");
    setPaymentInvoice(invoice);
    const balance = Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0));
    setPaymentAmount(balance > 0 ? balance : "");
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentInvoice(null);
    setPaymentAmount("");
  };

  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    if (!paymentInvoice) return;

    const amountToAdd = Number(paymentAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert("Veuillez saisir un montant supérieur à 0");
      return;
    }

    setPaymentSubmitting(true);
    setError("");

    try {
      const currentPaid = Number(paymentInvoice.paidAmount || 0);
      const newTotalPaid = Math.min(Number(paymentInvoice.total), currentPaid + amountToAdd);

      const response = await api.patch(`/invoices/${paymentInvoice.id}/payment-status`, {
        paidAmount: newTotalPaid,
      });

      const updated = response.data.invoice;
      setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));

      if (selectedInvoice && selectedInvoice.id === updated.id) {
        setSelectedInvoice(updated);
      }

      setMessage(
        `Règlement de ${formatAmount(amountToAdd)} enregistré pour ${updated.invoiceNumber} (${updated.status === "PAID" ? "Soldée" : "Acompte partiel enregistré"})`
      );
      handleClosePaymentModal();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du règlement");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleResetPayment = async (invoice) => {
    if (!window.confirm(`Voulez-vous remettre les encaissements à 0 pour la facture ${invoice.invoiceNumber} ?`)) return;

    setError("");
    try {
      const response = await api.patch(`/invoices/${invoice.id}/payment-status`, {
        paidAmount: 0,
      });

      const updated = response.data.invoice;
      setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));

      if (selectedInvoice && selectedInvoice.id === updated.id) {
        setSelectedInvoice(updated);
      }

      setMessage(`Règlements réinitialisés pour la facture ${updated.invoiceNumber}`);
      if (isPaymentModalOpen) handleClosePaymentModal();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation");
    }
  };

  const handleConvertToInvoice = async (quote) => {
    const confirmConvert = window.confirm(
      `Voulez-vous convertir le devis "${quote.invoiceNumber}" en Facture commerciale ? Un nouveau numéro séquentiel sera attribué.`
    );

    if (!confirmConvert) return;

    setMessage("");
    setError("");

    try {
      const response = await api.post(`/invoices/${quote.id}/convert`);
      const converted = response.data.invoice;

      setInvoices(
        invoices.map((item) =>
          item.id === quote.id ? converted : item
        )
      );

      if (selectedInvoice && selectedInvoice.id === quote.id) {
        setSelectedInvoice(converted);
      }

      setMessage(`Devis converti avec succès en Facture : ${converted.invoiceNumber}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la conversion du devis"
      );
    }
  };

  const handleViewDetails = async (invoiceId) => {
    setDetailLoading(true);
    setIsDetailModalOpen(true);

    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data.invoice);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erreur lors de la récupération des détails");
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
      (inv.customerPhone && inv.customerPhone.toLowerCase().includes(term));

    let matchesFilter = true;
    if (filterTab === "INVOICE") matchesFilter = inv.type === "INVOICE";
    else if (filterTab === "QUOTE") matchesFilter = inv.type === "QUOTE";
    else if (filterTab === "PAID") matchesFilter = inv.type === "INVOICE" && inv.status === "PAID";
    else if (filterTab === "PARTIALLY_PAID") matchesFilter = inv.type === "INVOICE" && inv.status === "PARTIALLY_PAID";
    else if (filterTab === "PENDING") matchesFilter = inv.type === "INVOICE" && (inv.status === "ISSUED" || !inv.status);

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={28} color="var(--primary)" />
            Factures & Devis
          </h1>
          <p className="page-subtitle">
            {invoices.length} document{invoices.length > 1 ? "s" : ""} émis au total
          </p>
        </div>

        <Link to="/invoices/new" className="btn btn-primary">
          <PlusCircle size={18} />
          Créer un document
        </Link>
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
              placeholder="Rechercher par numéro, nom du client, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "ALL" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("ALL")}
            >
              Tous ({invoices.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "INVOICE" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("INVOICE")}
            >
              Factures ({invoices.filter((i) => i.type === "INVOICE").length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "QUOTE" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("QUOTE")}
            >
              Devis ({invoices.filter((i) => i.type === "QUOTE").length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "PAID" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("PAID")}
            >
              Payées ({invoices.filter((i) => i.type === "INVOICE" && i.status === "PAID").length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "PARTIALLY_PAID" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("PARTIALLY_PAID")}
            >
              Acomptes ({invoices.filter((i) => i.type === "INVOICE" && i.status === "PARTIALLY_PAID").length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterTab === "PENDING" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("PENDING")}
            >
              En attente ({invoices.filter((i) => i.type === "INVOICE" && (i.status === "ISSUED" || !i.status)).length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Chargement des documents...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <h3 className="empty-state-title">
              {searchTerm || filterTab !== "ALL"
                ? "Aucun document ne correspond à vos filtres"
                : "Aucune facture créée"}
            </h3>
            <p className="empty-state-desc">
              {searchTerm || filterTab !== "ALL"
                ? "Modifiez vos critères de recherche ou réinitialisez les filtres."
                : "Commencez dès maintenant en créant votre première facture ou devis."}
            </p>
            {!searchTerm && filterTab === "ALL" && (
              <Link to="/invoices/new" className="btn btn-primary">
                <PlusCircle size={18} />
                Créer ma première facture
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Numéro & Type</th>
                  <th>Client</th>
                  <th>Date d'émission</th>
                  <th>Montant TTC</th>
                  <th>Paiement</th>
                  <th>Partage</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--primary)" }}>
                          {inv.invoiceNumber}
                        </div>
                        <span
                          className={`badge ${inv.type === "QUOTE" ? "badge-primary" : "badge-gray"}`}
                          style={{ fontSize: "11px", marginTop: "4px" }}
                        >
                          {inv.type === "QUOTE" ? "DEVIS" : "FACTURE"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {inv.customerPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        <Calendar size={14} color="var(--text-light)" />
                        <span>{formatDateTime(inv.issuedAt || inv.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: "15px" }}>{formatAmount(inv.total)}</strong>
                    </td>
                    <td>
                      {inv.type === "QUOTE" ? (
                        <span className="badge badge-gray">Devis</span>
                      ) : inv.status === "PAID" ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Payée
                        </span>
                      ) : inv.status === "PARTIALLY_PAID" ? (
                        <span className="badge badge-warning" title={`Acompte: ${formatAmount(inv.paidAmount)} - Reste: ${formatAmount(inv.total - inv.paidAmount)}`}>
                          <Clock size={12} /> Acompte ({formatAmount(inv.paidAmount)})
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <Clock size={12} /> En attente
                        </span>
                      )}
                    </td>
                    <td>
                      {inv.shareStatus === "SHARED" ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Partagée
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <Clock size={12} /> Non partagée
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {inv.type === "QUOTE" ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConvertToInvoice(inv)}
                            title="Transformer ce devis en facture commerciale en 1 clic"
                          >
                            <ArrowRightLeft size={13} />
                            En Facture
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`btn btn-sm ${inv.status === "PAID" ? "btn-secondary" : "btn-primary"}`}
                            onClick={() => handleOpenPaymentModal(inv)}
                            title={inv.status === "PAID" ? "Voir ou réinitialiser le règlement" : "Encaisser un acompte ou le solde"}
                          >
                            <CreditCard size={13} />
                            {inv.status === "PAID" ? "Soldée" : inv.status === "PARTIALLY_PAID" ? "Compléter" : "Encaisser"}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(inv.id)}
                          title="Voir les détails"
                        >
                          <Eye size={13} />
                        </button>

                        {inv.pdfUrl && (
                          <>
                            <a
                              href={`${BACKEND_URL}${inv.pdfUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              title="Ouvrir le fichier PDF"
                            >
                              <ExternalLink size={13} />
                              PDF
                            </a>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePrintInvoice(inv)}
                              title="Imprimer directement le document"
                            >
                              <Printer size={13} />
                              Imprimer
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="btn btn-whatsapp btn-sm"
                          onClick={() => handleShareWhatsApp(inv)}
                          title="Partager par WhatsApp"
                        >
                          <Share2 size={13} />
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

      {/* Modal Détails Facture */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedInvoice ? `Détails : ${selectedInvoice.invoiceNumber}` : "Détails du document"}
        size="lg"
      >
        {detailLoading || !selectedInvoice ? (
          <p>Chargement des détails...</p>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Client Destinataire
                </span>
                <h4 style={{ fontSize: "16px", fontWeight: 700 }}>{selectedInvoice.customerName}</h4>
                {selectedInvoice.customerPhone && (
                  <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <Phone size={13} style={{ color: "var(--text-muted)" }} /> {selectedInvoice.customerPhone}
                  </p>
                )}
                {selectedInvoice.customerEmail && (
                  <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <Mail size={13} style={{ color: "var(--text-muted)" }} /> {selectedInvoice.customerEmail}
                  </p>
                )}
                {selectedInvoice.customerAddress && (
                  <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <MapPin size={13} style={{ color: "var(--text-muted)" }} /> {selectedInvoice.customerAddress}
                  </p>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Informations Document
                </span>
                <p style={{ fontSize: "13px", fontWeight: 600 }}>Date : {formatDateTime(selectedInvoice.issuedAt)}</p>
                <p style={{ fontSize: "13px" }}>
                  Type : <strong>{selectedInvoice.type === "QUOTE" ? "Devis" : "Facture"}</strong>
                </p>
                {selectedInvoice.type === "INVOICE" && (
                  <p style={{ fontSize: "13px" }}>
                    Statut : <strong>{selectedInvoice.status === "PAID" ? "Payée" : "En attente"}</strong>
                  </p>
                )}
              </div>
            </div>

            <h4 style={{ marginBottom: "10px", fontSize: "14px", fontWeight: 700 }}>Articles facturés</h4>
            <div className="table-container" style={{ marginBottom: "20px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Taxe</th>
                    <th style={{ textAlign: "right" }}>Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        {item.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {item.description}
                          </div>
                        )}
                      </td>
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

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "280px", background: "#f8fafc", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <div className="receipt-row">
                  <span>Sous-total HT :</span>
                  <span>{formatAmount(selectedInvoice.subTotal)}</span>
                </div>
                <div className="receipt-row">
                  <span>TVA / Taxes :</span>
                  <span>{formatAmount(selectedInvoice.taxTotal)}</span>
                </div>
                <div className="receipt-row total-row">
                  <span>Total TTC :</span>
                  <span style={{ color: "var(--primary)" }}>{formatAmount(selectedInvoice.total)}</span>
                </div>
                {selectedInvoice.paidAmount > 0 && (
                  <>
                    <div className="receipt-row" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border)", color: "#166534", fontWeight: 600 }}>
                      <span>Acompte réglé :</span>
                      <span>- {formatAmount(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="receipt-row" style={{ fontWeight: 700, color: selectedInvoice.total - selectedInvoice.paidAmount <= 0 ? "#166534" : "#B45309" }}>
                      <span>Solde restant :</span>
                      <span>{selectedInvoice.total - selectedInvoice.paidAmount <= 0 ? "0 FCFA (Soldé)" : formatAmount(selectedInvoice.total - selectedInvoice.paidAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedInvoice.notes && (
              <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "var(--radius-md)" }}>
                <strong style={{ fontSize: "13px" }}>Notes / Instructions :</strong>
                <p style={{ fontSize: "13px", color: "var(--secondary)", marginTop: "4px" }}>
                  {selectedInvoice.notes}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
              {selectedInvoice.type === "QUOTE" ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConvertToInvoice(selectedInvoice)}
                >
                  <ArrowRightLeft size={16} /> Convertir ce devis en Facture commerciale
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn ${selectedInvoice.status === "PAID" ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => handleOpenPaymentModal(selectedInvoice)}
                >
                  <CreditCard size={16} />
                  {selectedInvoice.status === "PAID" ? "Gérer le règlement (Soldée)" : "Enregistrer un règlement"}
                </button>
              )}

              {selectedInvoice.pdfUrl && (
                <>
                  <a
                    href={`${BACKEND_URL}${selectedInvoice.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                  >
                    <ExternalLink size={16} /> Ouvrir le PDF
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                  >
                    <Printer size={16} /> Imprimer
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn btn-whatsapp"
                onClick={() => handleShareWhatsApp(selectedInvoice)}
              >
                <Share2 size={16} /> Partager via WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'enregistrement de règlement / acompte */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        title={`Enregistrer un règlement — ${paymentInvoice?.invoiceNumber || ""}`}
      >
        {paymentInvoice && (
          <form onSubmit={handleSavePayment}>
            <div style={{ background: "var(--bg-canvas)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Client</span>
                <strong style={{ fontSize: "13px" }}>{paymentInvoice.customerName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total facture</span>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>{formatAmount(paymentInvoice.total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Déjà encaissé</span>
                <span style={{ fontSize: "13px", color: "#166534", fontWeight: 600 }}>{formatAmount(paymentInvoice.paidAmount || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Reste à percevoir</span>
                <strong style={{ fontSize: "15px", color: "var(--primary)" }}>
                  {formatAmount(Math.max(0, paymentInvoice.total - (paymentInvoice.paidAmount || 0)))}
                </strong>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Montant encaissé lors de ce versement ({currency})
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, paymentInvoice.total - (paymentInvoice.paidAmount || 0))}
                className="form-control"
                placeholder="Ex: 50000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                autoFocus
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPaymentAmount(Math.max(0, paymentInvoice.total - (paymentInvoice.paidAmount || 0)))}
                >
                  Solde total ({formatAmount(Math.max(0, paymentInvoice.total - (paymentInvoice.paidAmount || 0)))})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPaymentAmount(Math.round(paymentInvoice.total * 0.5))}
                >
                  Acompte 50%
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPaymentAmount(Math.round(paymentInvoice.total * 0.3))}
                >
                  Acompte 30%
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label className="form-label">Canal d'encaissement</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Espèces</option>
                <option value="WAVE">Wave Mobile Money</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="MOMO">MTN MoMo</option>
                <option value="TRANSFER">Virement bancaire</option>
                <option value="CHEQUE">Chèque</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border)", gap: "10px" }}>
              {paymentInvoice.paidAmount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleResetPayment(paymentInvoice)}
                  style={{ color: "var(--danger)" }}
                >
                  Remettre à zéro
                </button>
              )}
              <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClosePaymentModal}
                  disabled={paymentSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={paymentSubmitting || !paymentAmount}
                >
                  <CheckCircle2 size={16} />
                  {paymentSubmitting ? "Enregistrement..." : "Valider l'encaissement"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default InvoicesPage;