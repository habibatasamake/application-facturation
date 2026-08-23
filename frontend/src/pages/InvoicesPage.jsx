import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5001";

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <p>Chargement des factures...</p>;
  }

  return (
    <div>
      <h1>Factures</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InvoicesPage;