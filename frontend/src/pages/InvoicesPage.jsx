import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5001";

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString("fr-FR")} FCFA`;
  };

  const formatDateTime = (date) => {
    const dateObj = new Date(date);

    const formattedDate = dateObj.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const formattedTime = dateObj.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${formattedDate} à ${formattedTime}`;
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get("/invoices");
      setInvoices(response.data.invoices);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la récupération des factures"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoices();
  }, []);

  const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return "";

  return phone.replace(/\D/g, "");
};

const handleShareWhatsApp = async (invoice) => {
  setError("");
  setMessage("");

  if (!invoice.pdfUrl) {
    setError("Cette facture n’a pas encore de PDF");
    return;
  }

  const pdfLink = `${BACKEND_URL}${invoice.pdfUrl}`;

  const whatsappMessage = `Bonjour ${invoice.customerName}, voici votre facture ${invoice.invoiceNumber} d'un montant de ${formatAmount(
    invoice.total
  )}. Vous pouvez consulter le PDF ici : ${pdfLink}`;

  const phone = formatPhoneForWhatsApp(invoice.customerPhone);

  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  window.open(whatsappUrl, "_blank");

  try {
    const response = await api.patch(
      `/invoices/${invoice.id}/share-status`,
      {
        shareStatus: "SHARED",
      }
    );

    setInvoices(
      invoices.map((item) =>
        item.id === invoice.id ? response.data.invoice : item
      )
    );

    setMessage("Facture partagée via WhatsApp");
  } catch (error) {
    setError(
      error.response?.data?.message ||
        "Erreur lors de la mise à jour du statut de partage"
    );
   }
  };

  if (isLoading) {
    return <p>Chargement des factures...</p>;
  }

  return (
    <div>
      <h1>Factures</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <Link to="/invoices/new">
        <button>Créer une facture</button>
      </Link>

      <hr />

      {invoices.length === 0 ? (
        <p>Aucune facture créée pour le moment.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Partage</th>
              <th>Date et heure d'émission</th>
              <th>PDF</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.customerName}</td>
                <td>{formatAmount(invoice.total)}</td>
                <td>{invoice.status}</td>
                <td>{invoice.shareStatus}</td>
                <td>
                  {formatDateTime(invoice.issuedAt)}
                </td>
                <td>
                  {invoice.pdfUrl ? (
                    <a
                      href={`${BACKEND_URL}${invoice.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir PDF
                    </a>
                  ) : (
                    "Aucun PDF"
                  )}
                  
                </td>
                <td>
                    <button onClick={() => handleShareWhatsApp(invoice)}>
                      Partager WhatsApp
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

export default InvoicesPage;