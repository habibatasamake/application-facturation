import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import BrandLogo from "./BrandLogo";

function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Détecter si on est sur iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isIosDevice && !isInStandaloneMode) {
      // Pour iOS, afficher l'astuce d'installation "Sur l'écran d'accueil"
      const hasDismissed = localStorage.getItem("pwa_ios_dismissed");
      if (!hasDismissed) {
        setIsIOS(true);
        setIsVisible(true);
      }
    }

    // Écouter l'événement standard beforeinstallprompt pour Android et Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem("pwa_install_dismissed");
      if (!hasDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("L'utilisateur a installé WariFact en tant que PWA");
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIOS) {
      localStorage.setItem("pwa_ios_dismissed", "true");
    } else {
      localStorage.setItem("pwa_install_dismissed", "true");
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "520px",
        backgroundColor: "#ffffff",
        border: "1.5px solid var(--accent-gold-border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        boxShadow: "0 12px 32px rgba(107, 29, 39, 0.15)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <BrandLogo size="sm" showText={false} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>
              Installer WariFact
            </strong>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--accent-gold-hover)",
                backgroundColor: "var(--accent-gold-light)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              App Mobile
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {isIOS
              ? "Sur Safari, appuyez sur Partager puis 'Sur l'écran d'accueil'"
              : "Accédez à vos factures directement depuis votre écran d'accueil"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {!isIOS && deferredPrompt && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleInstallClick}
          >
            <Download size={14} />
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-light)",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Fermer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
