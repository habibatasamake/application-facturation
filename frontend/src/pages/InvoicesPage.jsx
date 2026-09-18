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
      ? `\n\n💳 Modalités de règlement :\n${payParts.join("\n")}`
      : "";

    const docTypeLabel = invoice.type === "QUOTE" ? "devis" : "facture";
    const whatsappMessage = `Bonjour ${invoice.customerName},\nVoici votre ${docTypeLabel} N° *${invoice.invoiceNumber}* d'un montant de *${formatAmount(invoice.total)}*.\n\n📄 Consulter / Télécharger le PDF : ${pdfLink}${paySection}\n\nMerci pour votre confiance !`;

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

  const handleTogglePaymentStatus = async (invoice) => {
    setMessage("");
    setError("");
    const newStatus = invoice.status === "PAID" ? "ISSUED" : "PAID";

    try {
      const response = await api.patch(`/invoices/${invoice.id}/payment-status`, {
        status: newStatus,
      });

      setInvoices(
        invoices.map((item) =>
          item.id === invoice.id ? response.data.invoice : item
        )
      );

      if (selectedInvoice && selectedInvoice.id === invoice.id) {
        setSelectedInvoice(response.data.invoice);
      }

      setMessage(`Statut de paiement de ${invoice.invoiceNumber} mis à jour (${newStatus === "PAID" ? "Payée" : "En attente"})`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut de paiement");
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
    else if (filterTab === "PENDING") matchesFilter = inv.type === "INVOICE" && inv.status !== "PAID";

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
              className={`btn btn-sm ${filterTab === "PENDING" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterTab("PENDING")}
            >
              En attente ({invoices.filter((i) => i.type === "INVOICE" && i.status !== "PAID").length})
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
                      ) : (
                        <span className="badge badge-warning">
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
                            title="Transformer ce devis en facture officielle"
                          >
                            <RefreshCw size={13} />
                            En Facture
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`btn btn-sm ${inv.status === "PAID" ? "btn-secondary" : "btn-success"}`}
                            onClick={() => handleTogglePaymentStatus(inv)}
                            title={inv.status === "PAID" ? "Marquer comme en attente" : "Marquer comme payée"}
                          >
                            <CreditCard size={13} />
                            {inv.status === "PAID" ? "Payée" : "Encaisser"}
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
                {selectedInvoice.customerPhone && <p style={{ fontSize: "13px" }}>📞 {selectedInvoice.customerPhone}</p>}
                {selectedInvoice.customerEmail && <p style={{ fontSize: "13px" }}>✉️ {selectedInvoice.customerEmail}</p>}
                {selectedInvoice.customerAddress && <p style={{ fontSize: "13px" }}>📍 {selectedInvoice.customerAddress}</p>}
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
              <div style={{ width: "260px", background: "#f8fafc", padding: "16px", borderRadius: "var(--radius-md)" }}>
                <div className="receipt-row">
                  <span>Sous-total :</span>
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
                  <RefreshCw size={16} /> Convertir ce devis en Facture
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn ${selectedInvoice.status === "PAID" ? "btn-secondary" : "btn-success"}`}
                  onClick={() => handleTogglePaymentStatus(selectedInvoice)}
                >
                  <CreditCard size={16} />
                  {selectedInvoice.status === "PAID" ? "Marquer comme non payée" : "Marquer comme encaissée"}
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
    </div>
  );
}

export default InvoicesPage;