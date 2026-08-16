const prisma = require("../config/prisma");
const { generateInvoicePdf } = require("../services/invoicePdf.service");

const roundAmount = (value) => {
  return Math.round(value * 100) / 100;
};

const buildInvoiceData = async ({ userId, body, db }) => {
  const { customerId, customer, items, notes, type } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw {
      status: 400,
      message: "La facture doit contenir au moins une ligne",
    };
  }

  let customerSnapshot = null;

  if (customerId) {
    const existingCustomer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!existingCustomer) {
      throw {
        status: 404,
        message: "Client introuvable",
      };
    }

    customerSnapshot = {
      customerId: existingCustomer.id,
      customerName: existingCustomer.name,
      customerPhone: existingCustomer.phone,
      customerEmail: existingCustomer.email,
      customerAddress: existingCustomer.address,
      customerCity: existingCustomer.city,
      customerCountry: existingCustomer.country,
    };
  } else {
    if (!customer || !customer.name || !customer.name.trim()) {
      throw {
        status: 400,
        message: "Le nom du client est obligatoire",
      };
    }

    customerSnapshot = {
      customerId: null,
      customerName: customer.name.trim(),
      customerPhone: customer.phone || null,
      customerEmail: customer.email || null,
      customerAddress: customer.address || null,
      customerCity: customer.city || null,
      customerCountry: customer.country || null,
    };
  }

  const invoiceItems = [];

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (!quantity || Number.isNaN(quantity) || quantity <= 0) {
      throw {
        status: 400,
        message: "Chaque ligne doit avoir une quantité supérieure à 0",
      };
    }

    let lineData = null;

    if (item.productId) {
      const product = await db.product.findFirst({
        where: {
          id: item.productId,
          userId,
          isActive: true,
        },
      });

      if (!product) {
        throw {
          status: 404,
          message: "Produit introuvable ou désactivé",
        };
      }

      lineData = {
        productId: product.id,
        productName: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        quantity,
        unit: product.unit,
        taxRate: product.taxRate || 0,
      };
    } else {
      const unitPrice = Number(item.unitPrice);
      const taxRate =
        item.taxRate === undefined || item.taxRate === ""
          ? 0
          : Number(item.taxRate);

      if (!item.productName || !item.productName.trim()) {
        throw {
          status: 400,
          message:
            "Le libellé du produit est obligatoire pour une ligne manuelle",
        };
      }

      if (!unitPrice || Number.isNaN(unitPrice) || unitPrice <= 0) {
        throw {
          status: 400,
          message: "Le prix unitaire doit être supérieur à 0",
        };
      }

      lineData = {
        productId: null,
        productName: item.productName.trim(),
        description: item.description || null,
        unitPrice,
        quantity,
        unit: item.unit || null,
        taxRate: Number.isNaN(taxRate) ? 0 : taxRate,
      };
    }

    const lineSubTotal = roundAmount(lineData.unitPrice * quantity);
    const lineTaxTotal = roundAmount(lineSubTotal * (lineData.taxRate / 100));
    const lineTotal = roundAmount(lineSubTotal + lineTaxTotal);

    invoiceItems.push({
      ...lineData,
      lineSubTotal,
      lineTaxTotal,
      lineTotal,
    });
  }

  const subTotal = roundAmount(
    invoiceItems.reduce((sum, item) => sum + item.lineSubTotal, 0)
  );

  const taxTotal = roundAmount(
    invoiceItems.reduce((sum, item) => sum + item.lineTaxTotal, 0)
  );

  const total = roundAmount(subTotal + taxTotal);

  return {
    type: type || "INVOICE",
    notes: notes || null,
    customerSnapshot,
    invoiceItems,
    subTotal,
    taxTotal,
    total,
  };
};

const generateInvoiceNumber = async ({ userId, type, db }) => {
  const year = new Date().getFullYear();

  const sequence = await db.invoiceSequence.upsert({
    where: {
      userId_type_year: {
        userId,
        type,
        year,
      },
    },
    create: {
      userId,
      type,
      year,
      nextNumber: 2,
    },
    update: {
      nextNumber: {
        increment: 1,
      },
    },
  });

  const currentNumber = sequence.nextNumber - 1;
  const prefix = type === "QUOTE" ? "DEV" : "FAC";

  return `${prefix}-${year}-${String(currentNumber).padStart(4, "0")}`;
};

const previewInvoice = async (req, res) => {
  try {
    const invoiceData = await buildInvoiceData({
      userId: req.user.id,
      body: req.body,
      db: prisma,
    });

    return res.status(200).json({
      message: "Prévisualisation générée avec succès",
      preview: {
        type: invoiceData.type,
        status: "PREVIEW",
        ...invoiceData.customerSnapshot,
        items: invoiceData.invoiceItems,
        subTotal: invoiceData.subTotal,
        taxTotal: invoiceData.taxTotal,
        total: invoiceData.total,
        notes: invoiceData.notes,
      },
    });
  } catch (error) {
    console.error("Erreur previewInvoice :", error);

    return res.status(error.status || 500).json({
      message:
        error.message ||
        "Erreur serveur lors de la prévisualisation de la facture",
    });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceData = await buildInvoiceData({
        userId: req.user.id,
        body: req.body,
        db: tx,
      });

      const invoiceNumber = await generateInvoiceNumber({
        userId: req.user.id,
        type: invoiceData.type,
        db: tx,
      });

      const createdInvoice = await tx.invoice.create({
        data: {
          userId: req.user.id,
          customerId: invoiceData.customerSnapshot.customerId,

          invoiceNumber,
          type: invoiceData.type,
          status: "ISSUED",

          customerName: invoiceData.customerSnapshot.customerName,
          customerPhone: invoiceData.customerSnapshot.customerPhone,
          customerEmail: invoiceData.customerSnapshot.customerEmail,
          customerAddress: invoiceData.customerSnapshot.customerAddress,
          customerCity: invoiceData.customerSnapshot.customerCity,
          customerCountry: invoiceData.customerSnapshot.customerCountry,

          subTotal: invoiceData.subTotal,
          taxTotal: invoiceData.taxTotal,
          total: invoiceData.total,

          notes: invoiceData.notes,

          items: {
            create: invoiceData.invoiceItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              unit: item.unit,
              taxRate: item.taxRate,
              lineSubTotal: item.lineSubTotal,
              lineTaxTotal: item.lineTaxTotal,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return createdInvoice;
    });

    const businessProfile = await prisma.businessProfile.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    const { pdfUrl } = await generateInvoicePdf({
      invoice,
      businessProfile,
    });

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        pdfUrl,
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      message: "Facture créée avec succès",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Erreur createInvoice :", error);

    return res.status(error.status || 500).json({
      message:
        error.message || "Erreur serveur lors de la création de la facture",
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        customerName: true,
        customerPhone: true,
        subTotal: true,
        taxTotal: true,
        total: true,
        pdfUrl: true,
        shareStatus: true,
        issuedAt: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Factures récupérées avec succès",
      invoices,
    });
  } catch (error) {
    console.error("Erreur getInvoices :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération des factures",
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Facture introuvable",
      });
    }

    return res.status(200).json({
      message: "Facture récupérée avec succès",
      invoice,
    });
  } catch (error) {
    console.error("Erreur getInvoiceById :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération de la facture",
    });
  }
};

const updateInvoiceShareStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shareStatus } = req.body;

    const allowedStatuses = ["NOT_SHARED", "SHARED", "FAILED"];

    if (!shareStatus || !allowedStatuses.includes(shareStatus)) {
      return res.status(400).json({
        message: "Statut de partage invalide",
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Facture introuvable",
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id,
      },
      data: {
        shareStatus,
        sharedAt: shareStatus === "SHARED" ? new Date() : null,
      },
    });

    return res.status(200).json({
      message: "Statut de partage mis à jour avec succès",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Erreur updateInvoiceShareStatus :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du statut de partage",
    });
  }
};

module.exports = {
  previewInvoice,
  createInvoice,
  getInvoices,
  updateInvoiceShareStatus,
  getInvoiceById,
};