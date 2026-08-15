import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import CustomerForm from "../components/CustomerForm";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data.customers);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la récupération des clients"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (formData) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/customers", formData);

      setCustomers([response.data.customer, ...customers]);
      setMessage(response.data.message);
      setShowForm(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la création du client"
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
      customers.map((customer) =>
        customer.id === selectedCustomer.id
          ? response.data.customer
          : customer
      )
    );

    setMessage(response.data.message);
    setSelectedCustomer(null);
    setShowForm(false);
  } catch (error) {
    setError(
      error.response?.data?.message ||
        "Erreur lors de la modification du client"
    );
  }
};

const handleDeleteCustomer = async (customerId) => {
  const confirmDelete = window.confirm(
    "Voulez-vous vraiment supprimer ce client ?"
  );

  if (!confirmDelete) {
    return;
  }

  setMessage("");
  setError("");

  try {
    const response = await api.delete(`/customers/${customerId}`);

    setCustomers(customers.filter((customer) => customer.id !== customerId));
    setMessage(response.data.message);
  } catch (error) {
    setError(
      error.response?.data?.message ||
        "Erreur lors de la suppression du client"
    );
  }
};


  if (isLoading) {
    return <p>Chargement des clients...</p>;
  }

  return (
    <div>
      <h1>Clients</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <button
        onClick={() => {
            setSelectedCustomer(null);
            setShowForm(!showForm);
        }}
        >
        {showForm ? "Annuler" : "Ajouter un client"}
      </button>

      {showForm && (
        <div>
            <h2>{selectedCustomer ? "Modifier le client" : "Nouveau client"}</h2>

            <CustomerForm
            initialData={selectedCustomer}
            onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
            submitLabel={
                selectedCustomer
                ? "Enregistrer les modifications"
                : "Créer le client"
            }
            />
        </div>
        )}

      <hr />

      {customers.length === 0 ? (
        <p>Aucun client enregistré pour le moment.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Ville</th>
              <th>Pays</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.city}</td>
                <td>{customer.country}</td>
                 <td>
                    <button
                    onClick={() => {
                        setSelectedCustomer(customer);
                        setShowForm(true);
                    }}
                    >
                    Modifier
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer.id)}>
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

export default CustomersPage;