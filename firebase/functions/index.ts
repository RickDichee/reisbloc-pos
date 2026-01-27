// Cloud Functions para Reisbloc POS
// Ubicación: firebase/functions/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const BCRYPT = require("bcrypt");

// ==================== AUTENTICACIÓN ====================

/**
 * Login con PIN
 * Busca el usuario por PIN y valida el dispositivo
 */
export const loginWithPin = functions.https.onCall(async (data, context) => {
  try {
    if (!data.pin) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "PIN requerido"
      );
    }

    // Buscar usuario por PIN
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    let userFound = null;

    for (const doc of snapshot.docs) {
      const user = doc.data();
      // Comparar PIN hasheado
      const pinMatch = await BCRYPT.compare(data.pin, user.pin);
      if (pinMatch) {
        userFound = {
          id: doc.id,
          ...user,
        };
        break;
      }
    }

    if (!userFound) {
      throw new functions.https.HttpsError(
        "not-found",
        "PIN incorrecto"
      );
    }

    // Validar dispositivo si está registrado
    if (!userFound.active) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Usuario no activo"
      );
    }

    // Generar custom token con el rol en claims
    const customToken = await admin
      .auth()
      .createCustomToken(userFound.id, { role: userFound.role });

    return {
      success: true,
      user: {
        id: userFound.id,
        username: userFound.username,
        role: userFound.role,
        devices: userFound.devices || [],
      },
      token: customToken,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
});

/**
 * Validar dispositivo
 * Verifica si el dispositivo está aprobado para el usuario
 */
export const validateDevice = functions.https.onCall(async (data, context) => {
  try {
    if (!data.deviceId || !data.userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "deviceId y userId requeridos"
      );
    }

    const deviceRef = db.collection("devices").doc(data.deviceId);
    const deviceSnap = await deviceRef.get();

    if (!deviceSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Dispositivo no encontrado"
      );
    }

    const device = deviceSnap.data()!;

    // Verificar que pertenece al usuario
    if (device.userId !== data.userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Dispositivo no autorizado para este usuario"
      );
    }

    // Verificar aprobación
    if (!device.isApproved) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Dispositivo pendiente de aprobación"
      );
    }

    // Actualizar último acceso
    await deviceRef.update({
      lastAccess: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      device: device,
    };
  } catch (error: any) {
    console.error("Validate device error:", error);
    throw error;
  }
});

// ==================== CIERRE DE CAJA ====================

/**
 * Generar cierre de caja del día
 */
export const generateDailyClose = functions.https.onCall(
  async (data, context) => {
    try {
      if (!data.date || !data.closedBy) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "date y closedBy requeridos"
        );
      }

      const date = new Date(data.date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener ventas del día
      const salesRef = db
        .collection("sales")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay));

      const salesSnapshot = await salesRef.get();
      const sales: any[] = [];

      salesSnapshot.forEach((doc) => {
        sales.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Calcular totales
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalCash = sales
        .filter((s) => s.paymentMethod === "cash" || s.paymentMethod === "mixed")
        .reduce((sum, s) => sum + (s.cashAmount || 0), 0);
      const totalDigital = sales
        .filter(
          (s) => s.paymentMethod === "digital" || s.paymentMethod === "clip"
        )
        .reduce((sum, s) => sum + s.total, 0);
      const totalTips = sales.reduce((sum, s) => sum + (s.tip || 0), 0);

      // Obtener usuarios
      const usersSnapshot = await db.collection("users").get();
      const users: any[] = [];
      usersSnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Calcular distribución de propinas
      const salesByUser: { [key: string]: any[] } = {};
      users.forEach((user) => {
        salesByUser[user.id] = [];
      });

      sales.forEach((sale) => {
        if (salesByUser[sale.saleBy]) {
          salesByUser[sale.saleBy].push(sale);
        }
      });

      const tipsDistribution = [];
      const workingUsers = Object.entries(salesByUser).filter(
        ([_, userSales]) => (userSales as any[]).length > 0
      );

      if (workingUsers.length > 0 && totalTips > 0) {
        const tipPerPerson = totalTips / workingUsers.length;

        for (const [userId, userSales] of workingUsers) {
          const user = users.find((u) => u.id === userId);
          tipsDistribution.push({
            userId,
            userName: user?.username || "Unknown",
            tipsGenerated: (userSales as any[]).reduce(
              (sum, s) => sum + (s.tip || 0),
              0
            ),
            salesCount: (userSales as any[]).length,
            sharePercentage: (
              ((userSales as any[]).length / sales.length) *
              100
            ).toFixed(1),
            amountToPay: tipPerPerson,
          });
        }
      }

      // Crear documento de cierre
      const closeData = {
        date: admin.firestore.Timestamp.fromDate(date),
        closedBy: data.closedBy,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        sales: sales.map((s) => s.id),
        totalSales,
        totalCash,
        totalDigital,
        totalTips,
        tipsDistribution,
        adjustments: data.adjustments || [],
      };

      const closeRef = await db.collection("daily_closes").add(closeData);

      return {
        success: true,
        closeId: closeRef.id,
        data: closeData,
      };
    } catch (error: any) {
      console.error("Generate daily close error:", error);
      throw error;
    }
  }
);

// ==================== PAGOS CON CLIP ====================

/**
 * Procesar pago con Clip
 * Se integra con la API de Clip
 */
export const processClipPayment = functions.https.onCall(
  async (data, context) => {
    try {
      if (!data.amount || !data.saleId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "amount y saleId requeridos"
        );
      }

      // TODO: Integrar con API de Clip
      // https://www.clipdinero.com/developers

      const clipPayment = {
        id: `clip_${Date.now()}`,
        saleId: data.saleId,
        amount: data.amount,
        transactionId: `CLIP_${Math.random().toString(36).substr(2, 9)}`,
        status: "completed",
        tip: data.tip || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      return {
        success: true,
        payment: clipPayment,
      };
    } catch (error: any) {
      console.error("Process Clip payment error:", error);
      throw error;
    }
  }
);

// ==================== AUDITORÍA ====================

/**
 * Crear log de auditoría
 */
export const createAuditLog = functions.https.onCall(async (data, context) => {
  try {
    if (!data.userId || !data.action || !data.entityType) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos de auditoría incompletos"
      );
    }

    const logData = {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || "",
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest.ip || "unknown",
      deviceId: data.deviceId || "unknown",
    };

    await db.collection("audit_logs").add(logData);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Create audit log error:", error);
    throw error;
  }
});

// ==================== SETUP INICIAL ====================

/**
 * Crear datos de prueba
 */
export const setupTestData = functions.https.onCall(async (data, context) => {
  try {
    // Hash del PIN 1234
    const hashedPin = await BCRYPT.hash("1234", 10);

    // Crear usuario admin
    const adminUserRef = await db.collection("users").add({
      username: "admin",
      pin: hashedPin,
      role: "admin",
      active: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Crear productos de ejemplo
    const products = [
      {
        name: "Tacos al Pastor",
        price: 85,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Quesadillas",
        price: 70,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Refresco",
        price: 30,
        category: "Bebidas",
        hasInventory: false,
        active: true,
      },
      {
        name: "Cerveza",
        price: 45,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 100,
        minimumStock: 10,
        active: true,
      },
      {
        name: "Tequila (Botella)",
        price: 850,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 20,
        minimumStock: 2,
        active: true,
      },
    ];

    for (const product of products) {
      await db.collection("products").add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      message: "Datos de prueba creados",
      adminUserId: adminUserRef.id,
    };
  } catch (error: any) {
    console.error("Setup test data error:", error);
    throw error;
  }
});
