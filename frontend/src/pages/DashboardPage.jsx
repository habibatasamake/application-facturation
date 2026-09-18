import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  FileText,
  Users,
  Package,
  PlusCircle,
  ExternalLink,
  Share2,
  AlertCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import api, { BACKEND_URL } from "../api/axiosConfig";

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currency = stats?.currency || businessProfile?.currency || "FCFA";

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} ${currency}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchDashboardData = async () => {
    try {
      const [meRes, profileRes, statsRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/business-profile"),
        api.get("/dashboard/stats"),
      ]);

      if (meRes.status === "fulfilled") setUser(meRes.value.data.user);
      if (profileRes.status === "fulfilled")
        setBusinessProfile(profileRes.value.data.businessProfile);
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data.stats);
        setRecentInvoices(statsRes.value.data.stats?.recentInvoices || []);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erreur lors de la récupération des données du tableau de bord");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, []);

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const handleShareWhatsApp = async (invoice) => {
    if (!invoice.pdfUrl) return;

    const pdfLink = `${BACKEND_URL}${invoice.pdfUrl}`;

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
      const response = await api.patch(`/invoices/${invoice.id}/share-status`, {
        shareStatus: "SHARED",
      });
      setRecentInvoices(
        recentInvoices.map((item) =>
          item.id === invoice.id ? response.data.invoice : item
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePaid = async (invoice) => {
    const newStatus = invoice.status === "PAID" ? "ISSUED" : "PAID";
    setMessage("");

    try {
      const response = await api.patch(`/invoices/${invoice.id}/payment-status`, {
        status: newStatus,
      });

      setRecentInvoices(
        recentInvoices.map((item) =>
          item.id === invoice.id ? response.data.invoice : item
        )
      );

      // Rafraîchir les stats globales
      const statsRes = await api.get("/dashboard/stats");
      setStats(statsRes.data.stats);

      setMessage(`Facture ${invoice.invoiceNumber} marquée comme ${newStatus === "PAID" ? "Payée" : "En attente"}`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut de paiement");
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

  if (isLoading) {
    return (
      <div className="empty-state">
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bonjour, {user?.fullName || "Bienvenue"} !
          </h1>
          <p className="page-subtitle">
            Activités et métriques pour{" "}
            <strong>{businessProfile?.businessName || "votre commerce"}</strong>
          </p>
        </div>

        <Link to="/invoices/new" className="btn btn-primary btn-lg">
          <PlusCircle size={20} />
          Créer une facture
        </Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!businessProfile && (
        <div className="alert alert-warning" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={20} />
            <span>
              Vous n'avez pas encore configuré le profil de votre commerce (Logo, coordonnées, devise).
            </span>
          </div>
          <Link to="/business-profile" className="btn btn-sm btn-secondary">
            Configurer mon profil
          </Link>
        </div>
      )}

      {/* Grille de statistiques complètes */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
          >
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total facturé émis</span>
            <span className="stat-value">{formatAmount(stats?.totalRevenue || 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}
          >
            <CreditCard size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Encaissé / Payé</span>
            <span className="stat-value" style={{ color: "var(--success)" }}>
              {formatAmount(stats?.paidRevenue || 0)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: "#fffbeb", color: "#d97706" }}
          >
            <Clock size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">En attente de règlement</span>
            <span className="stat-value" style={{ color: "var(--warning-text)" }}>
              {formatAmount(stats?.pendingRevenue || 0)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: "#f3e8ff", color: "#9333ea" }}
          >
            <FileSpreadsheet size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Devis en cours</span>
            <span className="stat-value">
              {stats?.quotesCount || 0}{" "}
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "normal" }}>
                ({formatAmount(stats?.quotesPotentialRevenue || 0)})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Raccourcis rapides */}
      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-header">
          <h2 className="card-title">
            <ArrowUpRight size={20} color="var(--primary)" />
            Actions rapides
          </h2>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link to="/invoices/new" className="btn btn-primary">
            <PlusCircle size={18} />
            Nouvelle facture
          </Link>
          <Link to="/customers" className="btn btn-secondary">
            <Users size={18} />
            Carnet clients ({stats?.customersCount || 0})
          </Link>
          <Link to="/products" className="btn btn-secondary">
            <Package size={18} />
            Catalogue produits ({stats?.productsCount || 0})
          </Link>
          <Link to="/business-profile" className="btn btn-secondary">
            Profil & Logo
          </Link>
        </div>
      </div>

      {/* Dernières factures avec gestion de paiement */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FileText size={20} color="var(--primary)" />
            Derniers documents émis
          </h2>
          <Link to="/invoices" className="auth-link" style={{ fontSize: "14px" }}>
            Voir tout l'historique ({stats?.totalDocumentsCount || 0}) &rarr;
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <h3 className="empty-state-title">Aucune facture émise pour le moment</h3>
            <p className="empty-state-desc">
              Commencez à créer votre première facture ou devis pour vos clients en un instant.
            </p>
            <Link to="/invoices/new" className="btn btn-primary">
              <PlusCircle size={18} />
              Créer ma première facture
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant Total</th>
                  <th>Paiement</th>
                  <th>Partage</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                          {inv.invoiceNumber}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {inv.type === "QUOTE" ? "DEVIS" : "FACTURE"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{inv.customerName}</span>
                    </td>
                    <td>{formatDate(inv.issuedAt || inv.createdAt)}</td>
                    <td>
                      <strong>{formatAmount(inv.total)}</strong>
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
                        <span className="badge badge-gray">Non partagée</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {inv.type === "INVOICE" && (
                          <button
                            type="button"
                            className={`btn btn-sm ${inv.status === "PAID" ? "btn-secondary" : "btn-success"}`}
                            onClick={() => handleTogglePaid(inv)}
                            title={inv.status === "PAID" ? "Marquer comme non payée" : "Marquer comme encaissée"}
                          >
                            <CreditCard size={13} />
                            {inv.status === "PAID" ? "Encaissée" : "Encaisser"}
                          </button>
                        )}
                        {inv.pdfUrl && (
                          <>
                            <a
                              href={`${BACKEND_URL}${inv.pdfUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              title="Ouvrir le PDF"
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
                          title="Partager directement par WhatsApp"
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
    </div>
  );
}

export default DashboardPage;