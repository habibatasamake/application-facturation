import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  ArrowRight,
  X,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Info,
  Package,
} from "lucide-react";
import api from "../api/axiosConfig";
import Modal from "./Modal";

export function AiInvoiceAssistant({
  onInvoiceParsed,
  products = [],
  customers = [],
  onProductsUpdated,
}) {
  const [promptText, setPromptText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [speechSupported, setSpeechSupported] = useState(false);

  // Gestion des produits hors catalogue
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [missingProducts, setMissingProducts] = useState([]);
  const [pendingAiData, setPendingAiData] = useState(null);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [missingModalError, setMissingModalError] = useState("");

  const recognitionRef = useRef(null);

  // Initialisation de la reconnaissance vocale Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "fr-FR";

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback({
          type: "info",
          message: "Enregistrement en cours... Énoncez votre commande (ex : 3 sacs de riz pour Diarra)",
        });
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPromptText(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Erreur reconnaissance vocale :", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          setFeedback({
            type: "error",
            message: "Impossible d'accéder au microphone ou dictée interrompue.",
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setFeedback({
        type: "error",
        message: "La reconnaissance vocale n'est pas supportée par votre navigateur. Vous pouvez utiliser le champ texte ci-dessous.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setFeedback(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Erreur start recognition :", e);
      }
    }
  };

  const handleUpdateMissingProduct = (index, field, value) => {
    setMissingProducts((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleConfirmMissingProducts = async () => {
    // 1. Validation : chaque article doit avoir un prix unitaire valide (> 0)
    for (const p of missingProducts) {
      const priceNum = Number(p.unitPrice);
      if (!priceNum || priceNum <= 0) {
        setMissingModalError(`Veuillez indiquer un prix unitaire valide pour "${p.name}".`);
        return;
      }
    }

    setIsSavingProducts(true);
    setMissingModalError("");

    try {
      // Articles existants déjà présents dans le catalogue
      const matchedItems = pendingAiData?.items?.filter((it) => it.productId) || [];
      const newlyAddedItems = [];
      let savedCatalogCount = 0;

      for (const p of missingProducts) {
        const priceNum = Number(p.unitPrice);
        const qtyNum = Math.max(1, Number(p.quantity) || 1);
        const lineSubTotal = priceNum * qtyNum;
        let createdProductId = null;
        const unitToUse = (p.unit || "unité").trim() || "unité";

        if (p.saveToCatalog) {
          try {
            const createRes = await api.post("/products", {
              name: p.name.trim(),
              unitPrice: priceNum,
              unit: unitToUse,
              taxRate: 0,
            });

            if (createRes.data?.product?.id) {
              createdProductId = createRes.data.product.id;
              savedCatalogCount++;
            }
          } catch (createErr) {
            console.error("Erreur création produit dans le catalogue :", createErr);
          }
        }

        newlyAddedItems.push({
          productId: createdProductId,
          productName: p.name.trim(),
          description: "",
          unitPrice: priceNum,
          unit: unitToUse,
          taxRate: 0,
          quantity: qtyNum,
          lineSubTotal,
          lineTaxTotal: 0,
          lineTotal: lineSubTotal,
        });
      }

      // Si au moins un produit a été ajouté au catalogue, rafraîchir le catalogue global
      if (savedCatalogCount > 0 && onProductsUpdated) {
        await onProductsUpdated();
      }

      // Regrouper tous les articles
      const allFinalItems = [...matchedItems, ...newlyAddedItems];

      // Transmettre la facture complète
      onInvoiceParsed({
        ...pendingAiData,
        items: allFinalItems,
      });

      const clientName = pendingAiData?.customer?.name || "Client non spécifié";
      setFeedback({
        type: "success",
        message: `${allFinalItems.length} article(s) prérempli(s) pour "${clientName}". ${savedCatalogCount > 0
          ? `(${savedCatalogCount} nouveau(x) produit(s) enregistré(s) dans le catalogue)`
          : ""
          }`,
      });

      setMissingModalOpen(false);
      setMissingProducts([]);
      setPendingAiData(null);
    } catch (err) {
      console.error("Erreur handleConfirmMissingProducts :", err);
      setMissingModalError(
        err.response?.data?.message || "Erreur lors de l'enregistrement des articles."
      );
    } finally {
      setIsSavingProducts(false);
    }
  };

  const handleParse = async (customPrompt = null) => {
    const textToAnalyze = (customPrompt !== null ? customPrompt : promptText).trim();

    if (!textToAnalyze) {
      setFeedback({
        type: "error",
        message: "Veuillez énoncer ou saisir ce que vous souhaitez facturer.",
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await api.post("/ai/parse-invoice", { prompt: textToAnalyze });
      const { data } = res.data;

      if (!data || (!data.items?.length && !data.customer)) {
        setFeedback({
          type: "error",
          message: "Impossible d'identifier clairement les articles ou le client. Veuillez préciser votre demande.",
        });
        return;
      }

      // Détecter les articles hors catalogue
      const uncataloged =
        (data.missingCatalogItems && data.missingCatalogItems.length > 0)
          ? data.missingCatalogItems
          : (data.items?.filter((it) => !it.productId || it.inCatalog === false) || []);

      if (uncataloged.length > 0) {
        setPendingAiData(data);
        setMissingProducts(
          uncataloged.map((it, idx) => ({
            id: idx,
            name: it.productName || "Nouvel article",
            quantity: it.quantity || 1,
            unit: it.unit || "unité",
            unitPrice: it.unitPrice && Number(it.unitPrice) > 0 ? it.unitPrice : "",
            saveToCatalog: true,
          }))
        );
        setMissingModalError("");
        setMissingModalOpen(true);
        setFeedback({
          type: "info",
          message: `${uncataloged.length} article(s) hors catalogue détecté(s). Veuillez renseigner leur prix unitaire.`,
        });
        return;
      }

      // Si tous les articles sont déjà dans le catalogue
      onInvoiceParsed(data);

      const itemsCount = data.items?.length || 0;
      const clientName = data.customer?.name || "Client non spécifié";
      setFeedback({
        type: "success",
        message: `${itemsCount} article(s) prérempli(s) pour "${clientName}". Vérifiez les montants ci-dessous.`,
      });
    } catch (err) {
      console.error("Erreur analyse commande :", err);
      const errMsg =
        err.response?.data?.message ||
        "Erreur lors de l'analyse. Vérifiez votre connexion ou les paramètres du service.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyExample = (exampleText) => {
    setPromptText(exampleText);
    handleParse(exampleText);
  };

  // Exemples dynamiques construits à partir du catalogue existant de la boutique
  const sampleProduct = products[0]?.name || "sac de riz";
  const sampleCustomer = customers[0]?.name || "Awa Traoré";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "18px 20px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* En-tête Transporeon Corporate */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "#1A1F26",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-gold)",
              flexShrink: 0,
            }}
          >
            <Mic size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1A1F26",
                  letterSpacing: "-0.01em",
                }}
              >
                Saisie assistée & commande vocale
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: "#F1F5F9",
                  color: "#475569",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  border: "1px solid #E2E8F0",
                }}
              >
                Transcription directe
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748B" }}>
              Dictez ou saisissez vos articles et votre client pour préremplir directement le document.
            </p>
          </div>
        </div>

        {speechSupported && (
          <div style={{ fontSize: "12px", color: isListening ? "#DC2626" : "#64748B", display: "flex", alignItems: "center", gap: "6px", fontWeight: isListening ? 600 : 500 }}>
            {isListening ? (
              <>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#DC2626",
                    display: "inline-block",
                    animation: "pulse 1.2s infinite",
                  }}
                />
                Enregistrement audio en cours...
              </>
            ) : (
              <>
                <Volume2 size={14} color="#64748B" />
                Support audio & texte
              </>
            )}
          </div>
        )}
      </div>

      {/* Barre de saisie vocale & textuelle */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
        {/* Bouton Microphone */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          title={isListening ? "Arrêter l'écoute" : "Démarrer la dictée vocale"}
          style={{
            height: "44px",
            width: "44px",
            borderRadius: "6px",
            border: isListening ? "1.5px solid #DC2626" : "1px solid #1A1F26",
            background: isListening ? "#DC2626" : "#1A1F26",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
            animation: isListening ? "pulse 1.5s infinite" : "none",
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Input texte */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleParse();
              }
            }}
            disabled={isLoading}
            placeholder={
              isListening
                ? "Écoute en cours... Énoncez votre commande..."
                : `Ex : "3 ${sampleProduct} pour ${sampleCustomer}" ou "2 bidons d'huile..."`
            }
            style={{
              width: "100%",
              height: "44px",
              padding: "0 38px 0 14px",
              borderRadius: "6px",
              border: "1px solid #CBD5E1",
              fontSize: "14px",
              background: "#FFFFFF",
              color: "#1A1F26",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {promptText && (
            <button
              type="button"
              onClick={() => setPromptText("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Effacer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Bouton d'analyse style Transporeon CTA */}
        <button
          type="button"
          onClick={() => handleParse()}
          disabled={isLoading || !promptText.trim()}
          style={{
            height: "44px",
            padding: "0 20px",
            borderRadius: "6px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            background: "var(--accent-gold)",
            color: "#1A1F26",
            fontWeight: 700,
            fontSize: "13.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: isLoading || !promptText.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !promptText.trim() ? 0.6 : 1,
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin-icon" />
              <span>Analyse...</span>
            </>
          ) : (
            <>
              <span>Remplir</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

      {/* Messages de retour épurés */}
      {feedback && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background:
              feedback.type === "success"
                ? "#ECFDF5"
                : feedback.type === "error"
                  ? "#FEF2F2"
                  : "#EFF6FF",
            color:
              feedback.type === "success"
                ? "#065F46"
                : feedback.type === "error"
                  ? "#991B1B"
                  : "#1E40AF",
            border: `1px solid ${feedback.type === "success"
              ? "#A7F3D0"
              : feedback.type === "error"
                ? "#FECACA"
                : "#BFDBFE"
              }`,
          }}
        >
          {feedback.type === "success" && <CheckCircle2 size={16} color="#059669" />}
          {feedback.type === "error" && <AlertCircle size={16} color="#DC2626" />}
          {feedback.type === "info" && <Info size={16} color="#2563EB" />}
          <span style={{ fontWeight: 500 }}>{feedback.message}</span>
        </div>
      )}

      {/* Suggestions rapides (chips B2B) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "11px",
            color: "#64748B",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Suggestions :
        </span>
        <button
          type="button"
          onClick={() => applyExample(`3 ${sampleProduct} pour ${sampleCustomer}`)}
          style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "4px",
            padding: "4px 10px",
            fontSize: "12.5px",
            color: "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 500,
          }}
        >
          <span>3 {sampleProduct} pour {sampleCustomer}</span>
          <ArrowRight size={12} color="#64748B" />
        </button>

        {products[1] && (
          <button
            type="button"
            onClick={() => applyExample(`2 ${products[1].name} et 1 ${sampleProduct}`)}
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "12.5px",
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            <span>2 {products[1].name} + 1 {sampleProduct}</span>
            <ArrowRight size={12} color="#64748B" />
          </button>
        )}
      </div>

      {/* Modale d'ajout des produits hors catalogue - style sobre & professionnel */}
      <Modal
        isOpen={missingModalOpen}
        onClose={() => {
          if (!isSavingProducts) {
            setMissingModalOpen(false);
            setMissingProducts([]);
            setPendingAiData(null);
          }
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1A1F26" }}>
            <AlertCircle size={18} color="#D97706" />
            <span>Articles non répertoriés au catalogue</span>
          </div>
        }
        size="md"
      >
        <div style={{ padding: "4px 0" }}>
          {/* Notification formelle & courtoise (sans emoji) */}
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "6px",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Info size={18} color="#D97706" style={{ marginTop: "2px", flexShrink: 0 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  fontWeight: 600,
                  color: "#92400E",
                }}
              >
                Vous avez cité ces produits mais ils ne sont pas dans le catalogue.
                Pouvez-vous indiquer leur prix unitaire et ainsi les rajouter dans le catalogue ?
              </p>
            </div>
          </div>

          {missingModalError && (
            <div
              className="alert alert-error"
              style={{
                marginBottom: "14px",
                padding: "8px 12px",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={16} />
              <span>{missingModalError}</span>
            </div>
          )}

          {/* Liste des produits à configurer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {missingProducts.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <Package size={16} color="#1A1F26" />
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleUpdateMissingProduct(idx, "name", e.target.value)}
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#1A1F26",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        background: "#FFFFFF",
                        padding: "4px 8px",
                        outline: "none",
                        flex: 1,
                        maxWidth: "260px",
                      }}
                      placeholder="Nom du produit"
                      title="Nom du produit"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Quantité : {p.quantity}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Prix unitaire (FCFA) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex : 15000"
                      value={p.unitPrice}
                      onChange={(e) => handleUpdateMissingProduct(idx, "unitPrice", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        border: "1px solid #CBD5E1",
                        fontSize: "13.5px",
                        boxSizing: "border-box",
                        outline: "none",
                        background: "#FFFFFF",
                      }}
                      autoFocus={idx === 0}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Unité
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : sac, kg, carton..."
                      value={p.unit}
                      onChange={(e) => handleUpdateMissingProduct(idx, "unit", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        border: "1px solid #CBD5E1",
                        fontSize: "13.5px",
                        boxSizing: "border-box",
                        outline: "none",
                        background: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12.5px",
                      color: "#334155",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={p.saveToCatalog}
                      onChange={(e) => handleUpdateMissingProduct(idx, "saveToCatalog", e.target.checked)}
                      style={{ cursor: "pointer", accentColor: "#1A1F26" }}
                    />
                    <span>Enregistrer dans mon catalogue permanent</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              borderTop: "1px solid #E2E8F0",
              paddingTop: "14px",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMissingModalOpen(false);
                setMissingProducts([]);
                setPendingAiData(null);
              }}
              disabled={isSavingProducts}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmMissingProducts}
              disabled={isSavingProducts}
            >
              {isSavingProducts ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Ajouter au catalogue et à la facture</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AiInvoiceAssistant;
