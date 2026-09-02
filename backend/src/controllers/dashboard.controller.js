const prisma = require("../config/prisma");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      invoices,
      customersCount,
      productsCount,
      businessProfile,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          customerName: true,
          customerPhone: true,
          total: true,
          subTotal: true,
          taxTotal: true,
          shareStatus: true,
          pdfUrl: true,
          issuedAt: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({
        where: { userId },
      }),
      prisma.product.count({
        where: { userId, isActive: true },
      }),
      prisma.businessProfile.findUnique({
        where: { userId },
      }),
    ]);

    const commercialInvoices = invoices.filter((inv) => inv.type === "INVOICE");
    const quotes = invoices.filter((inv) => inv.type === "QUOTE");

    // Calculs de chiffre d'affaires
    const totalRevenue = commercialInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidRevenue = commercialInvoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingRevenue = commercialInvoices
      .filter((inv) => inv.status === "ISSUED" || !inv.status)
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const quotesPotentialRevenue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);

    const totalShared = invoices.filter((inv) => inv.shareStatus === "SHARED").length;

    return res.status(200).json({
      message: "Statistiques récupérées avec succès",
      stats: {
        currency: businessProfile?.currency || "FCFA",
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        quotesPotentialRevenue,
        invoicesCount: commercialInvoices.length,
        quotesCount: quotes.length,
        totalDocumentsCount: invoices.length,
        totalSharedCount: totalShared,
        customersCount,
        productsCount,
        recentInvoices: invoices.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Erreur getDashboardStats :", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la récupération des statistiques",
    });
  }
};

module.exports = {
  getDashboardStats,
};
