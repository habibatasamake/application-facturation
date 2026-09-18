export function registerServiceWorker() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker WariFact enregistré avec succès:", registration.scope);
        })
        .catch((error) => {
          console.error("Échec de l'enregistrement du Service Worker:", error);
        });
    });
  }
}
