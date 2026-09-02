import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Building,
} from "lucide-react";
import api from "../api/axiosConfig";
import CustomerForm from "../components/CustomerForm";
import Modal from "../components/Modal";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la récupération des clients"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCreateCustomer = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/customers", formData);
      setCustomers([response.data.customer, ...customers]);
      setMessage("Client ajouté avec succès");
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du client"
      );
    }
  };

  const handleUpdateCustomer = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.put(
        `/customers/${selectedCustomer.id}`,
        formData
      );

      setCustomers(
        customers.map((c) =>
          c.id === selectedCustomer.id ? response.data.customer : c
        )
      );

      setMessage("Fiche client modifiée avec succès");
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la modification du client"
      );
    }
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le client "${customerName}" ?`
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/customers/${customerId}`);
      setCustomers(customers.filter((c) => c.id !== customerId));
      setMessage("Client supprimé avec succès");
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la suppression du client"
      );
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} color="var(--primary)" />
            Gestion des Clients
          </h1>
          <p className="page-subtitle">
            {customers.length} client{customers.length > 1 ? "s" : ""} enregistré{customers.length > 1 ? "s" : ""}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <UserPlus size={18} />
          Ajouter un client
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
              placeholder="Rechercher par nom, téléphone, email ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Chargement des clients...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={28} />
            </div>
            <h3 className="empty-state-title">
              {searchTerm ? "Aucun client ne correspond à votre recherche" : "Aucun client enregistré"}
            </h3>
            <p className="empty-state-desc">
              {searchTerm
                ? "Essayez avec d'autres termes de recherche."
                : "Créez votre premier contact client pour lui émettre des factures et devis."}
            </p>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                <UserPlus size={18} />
                Ajouter mon premier client
              </button>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Localisation</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="avatar-initials">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{customer.name}</div>
                          {customer.address && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Phone size={14} color="var(--text-light)" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>-</span>
                      )}
                    </td>
                    <td>
                      {customer.email ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Mail size={14} color="var(--text-light)" />
                          <span>{customer.email}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>-</span>
                      )}
                    </td>
                    <td>
                      {customer.city || customer.country ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={14} color="var(--text-light)" />
                          <span>
                            {[customer.city, customer.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(customer)}
                          title="Modifier la fiche client"
                        >
                          <Edit2 size={14} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          title="Supprimer ce client"
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

      {/* Modal pour Créer / Modifier un Client */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? "Modifier la fiche client" : "Ajouter un nouveau client"}
      >
        <CustomerForm
          initialData={selectedCustomer}
          onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
          submitLabel={selectedCustomer ? "Enregistrer les modifications" : "Créer le client"}
        />
      </Modal>
    </div>
  );
}

export default CustomersPage;