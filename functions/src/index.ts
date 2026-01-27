/**
 * TPV Solutions - Sistema POS Profesional
 * Copyright (C) 2026 TPV Solutions
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import bcrypt from "bcrypt";

admin.initializeApp();
const db = admin.firestore();

// Rate limiting simple en memoria para loginWithPin
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60_000;
const loginAttemptsByIp = new Map<string, number[]>();

const getClientIp = (req: functions.https.Request | undefined) => {
  const raw = req?.headers?.["x-forwarded-for"];
  if (typeof raw === "string" && raw.length > 0) {
    return raw.split(",")[0]?.trim() || "unknown";
  }
  return (req as any)?.ip || "unknown";
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const windowStart = now - LOGIN_WINDOW_MS;
  const attempts = loginAttemptsByIp.get(ip) || [];
  const recent = attempts.filter((ts) => ts >= windowStart);
  recent.push(now);
  loginAttemptsByIp.set(ip, recent);
  return recent.length > LOGIN_MAX_ATTEMPTS;
};

// Sanitiza strings para inputs controlados
const sanitizeString = (value: unknown, maxLength = 200) => {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.slice(0, maxLength);
};

const isBcryptHash = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("$2");

// ==================== INTERFACES ====================

interface LoginWithPinData {
  pin: string;
}

interface ValidateDeviceData {
  deviceId: string;
  userId: string;
}

interface GenerateDailyCloseData {
  date: string;
  closedBy: string;
  adjustments?: unknown[];
}

interface SaleDoc {
  id: string;
  total?: number;
  paymentMethod?: string;
  cashAmount?: number;
  tip?: number;
  saleBy?: string;
  [key: string]: unknown;
}

interface UserDoc {
  id: string;
  username?: string;
  [key: string]: unknown;
}

interface ProcessClipPaymentData {
  amount: number;
  saleId: string;
  tip?: number;
}

interface CreateAuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  deviceId?: string;
}

interface CreateUserData {
  username: string;
  pin: string;
  role: string;
  active: boolean;
  devices?: string[];
}

interface LogClosingEmailData {
  email: string;
  username?: string;
  date?: string;
  closingData?: unknown;
}

// ==================== AUTENTICACIÓN ====================

/**
 * Login con PIN (hash bcrypt en Firestore)
 * Verifica PIN server-side y crea custom token para autenticación
 */
export const loginWithPin = functions.https.onCall(
  async (request: functions.https.CallableRequest<LoginWithPinData>) => {
    try {
      const ip = getClientIp(request.rawRequest as any);
      if (isRateLimited(ip)) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Demasiados intentos, espera 60 segundos"
        );
      }

      const data = request.data;
      if (!data.pin) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "PIN requerido"
        );
      }

      // Validar formato del PIN
      if (data.pin.length !== 4 || !/^\d+$/.test(data.pin)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "PIN debe ser 4 dígitos"
        );
      }

      const usersSnap = await db.collection("users").get();
      let userFound: admin.firestore.DocumentData | null = null;
      let userId = "";

      // Buscar usuario por PIN comparando con bcrypt
      for (const doc of usersSnap.docs) {
        const user = doc.data();
        if (!user.hashedPin || !isBcryptHash(user.hashedPin)) continue;

        const isMatch = await bcrypt.compare(data.pin, user.hashedPin);
        if (isMatch) {
          userFound = user;
          userId = doc.id;
          break;
        }
      }

      if (!userFound) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "PIN incorrecto"
        );
      }

      if (!userFound.isActive) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Usuario inactivo"
        );
      }

      // Crear custom token para autenticación Firebase
      const customToken = await admin.auth().createCustomToken(userId, {
        role: userFound.role,
        username: userFound.username,
      });

      return {
        success: true,
        token: customToken,
        user: {
          id: userId,
          username: userFound.username,
          role: userFound.role,
          active: userFound.active,
          devices: userFound.devices || [],
        },
      };
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Error en el servidor de autenticación"
      );
    }
  }
);

/**
 * Validar dispositivo aprobado para el usuario
 */
export const validateDevice = functions.https.onCall(
  async (request: functions.https.CallableRequest<ValidateDeviceData>) => {
    try {
      const data = request.data;
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

      const device = deviceSnap.data();

      if (!device) {
        throw new functions.https.HttpsError(
          "not-found",
          "Datos de dispositivo no disponibles"
        );
      }

      if (device.userId !== data.userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Dispositivo no autorizado para este usuario"
        );
      }

      if (!device.isApproved) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Dispositivo pendiente de aprobación"
        );
      }

      await deviceRef.update({
        lastAccess: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        device,
      };
    } catch (error: unknown) {
      console.error("Validate device error:", error);
      throw error;
    }
  }
);

/**
 * Crear usuario con PIN hasheado
 */
export const createUserWithHashedPin = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateUserData>) => {
    try {
      const data = request.data;

      // Validaciones
      if (!data.username || !data.pin || !data.role) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "username, pin y role son requeridos"
        );
      }

      // Validar formato del PIN
      if (data.pin.length !== 4 || !/^\d+$/.test(data.pin)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "PIN debe ser 4 dígitos numéricos"
        );
      }

      const username = sanitizeString(data.username, 50);
      const role = sanitizeString(data.role, 30);
      const devices = Array.isArray(data.devices)
        ? data.devices.map((d) => sanitizeString(d, 100)).filter(Boolean)
        : [];

      if (!username || !role) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "username y role son requeridos"
        );
      }

      // Verificar que el usuario no exista
      const existingUsers = await db
        .collection("users")
        .where("username", "==", username)
        .get();

      if (!existingUsers.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "El nombre de usuario ya existe"
        );
      }

      // Hashear el PIN
      const hashedPin = await bcrypt.hash(data.pin, 10);

      // Crear usuario
      const userRef = await db.collection("users").add({
        username,
        pin: hashedPin,
        role,
        active: data.active !== undefined ? data.active : true,
        devices,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Usuario creado: ${username} (${userRef.id})`);

      return {
        success: true,
        userId: userRef.id,
        message: "Usuario creado exitosamente",
      };
    } catch (error: unknown) {
      console.error("Create user error:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Error interno";
      throw new functions.https.HttpsError("internal", message);
    }
  }
);

// ==================== CIERRE DE CAJA ====================

export const generateDailyClose = functions.https.onCall(
  async (request: functions.https.CallableRequest<GenerateDailyCloseData>) => {
    try {
      const data = request.data;
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

      const salesRef = db
        .collection("sales")
        .where(
          "createdAt",
          ">=",
          admin.firestore.Timestamp.fromDate(startOfDay)
        )
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay));

      const salesSnapshot = await salesRef.get();
      const sales: SaleDoc[] = [];

      salesSnapshot.forEach((doc) => {
        sales.push({
          id: doc.id,
          ...doc.data(),
        } as SaleDoc);
      });

      const totalSales = sales.reduce(
        (sum, sale) => sum + (typeof sale.total === "number" ? sale.total : 0),
        0
      );
      const totalCash = sales
        .filter(
          (s) =>
            s.paymentMethod === "cash" || s.paymentMethod === "mixed"
        )
        .reduce((sum, s) => sum + (s.cashAmount || 0), 0);
      const totalDigital = sales
        .filter(
          (s) =>
            s.paymentMethod === "digital" ||
            s.paymentMethod === "clip"
        )
        .reduce(
          (sum, s) =>
            sum + (typeof s.total === "number" ? s.total : 0),
          0
        );
      const totalTips = sales.reduce((sum, s) => sum + (s.tip || 0), 0);

      const usersSnapshot = await db.collection("users").get();
      const users: UserDoc[] = [];
      usersSnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      const salesByUser: Record<string, SaleDoc[]> = {};
      users.forEach((user) => {
        salesByUser[user.id] = [];
      });

      sales.forEach((sale) => {
        if (sale.saleBy && salesByUser[sale.saleBy]) {
          salesByUser[sale.saleBy].push(sale);
        }
      });

      const tipsDistribution: admin.firestore.DocumentData[] = [];
      const workingUsers: Array<[string, SaleDoc[]]> = Object.entries(
        salesByUser
      ).filter(([, userSales]) => userSales.length > 0);

      if (workingUsers.length > 0 && totalTips > 0) {
        const tipPerPerson = totalTips / workingUsers.length;

        for (const [userId, userSales] of workingUsers) {
          const user = users.find((u) => u.id === userId);
          tipsDistribution.push({
            userId,
            userName: user?.username || "Unknown",
            tipsGenerated: userSales.reduce(
              (sum, s) => sum + (typeof s.tip === "number" ? s.tip : 0),
              0
            ),
            salesCount: userSales.length,
            sharePercentage: ((userSales.length / sales.length) * 100).toFixed(
              1
            ),
            amountToPay: tipPerPerson,
          });
        }
      }

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
    } catch (error: unknown) {
      console.error("Generate daily close error:", error);
      throw error;
    }
  }
);

// ==================== PAGOS CON CLIP ====================

export const processClipPayment = functions.https.onCall(
  async (request: functions.https.CallableRequest<ProcessClipPaymentData>) => {
    try {
      const data = request.data;
      if (!data.amount || !data.saleId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "amount y saleId requeridos"
        );
      }

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
    } catch (error: unknown) {
      console.error("Process Clip payment error:", error);
      throw error;
    }
  }
);

// ==================== AUDITORÍA ====================

export const createAuditLog = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateAuditLogData>) => {
    try {
      const data = request.data;
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
        ipAddress: request.rawRequest?.ip || "unknown",
        deviceId: data.deviceId || "unknown",
      };

      await db.collection("audit_logs").add(logData);

      return {
        success: true,
      };
    } catch (error: unknown) {
      console.error("Create audit log error:", error);
      throw error;
    }
  }
);

// ==================== SETUP INICIAL ====================

export const setupTestData = functions.https.onCall(async () => {
  try {
    const hashedPin = await bcrypt.hash("1234", 10);

    const adminUserRef = await db.collection("users").add({
      username: "admin",
      pin: hashedPin,
      role: "admin",
      active: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
  } catch (error: unknown) {
    console.error("Setup test data error:", error);
    throw error;
  }
});

// ==================== CORREOS ====================

/**
 * Guarda cierre de caja en Firestore para auditoría
 */
export const logClosingEmail = functions.https.onCall(
  async (data: unknown) => {
    try {
      const payload = data as LogClosingEmailData;
      const {email, username, date, closingData} = payload;

      if (!email) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Email no proporcionado"
        );
      }

      // Guardar log del envío de correo en Firestore
      await db.collection("emailLogs").add({
        type: "closing",
        email,
        username,
        date,
        closingData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("📧 Closing email logged for", username, `(${email})`);

      return {
        success: true,
        message: "Correo registrado en el sistema",
      };
    } catch (error: unknown) {
      console.error("Log email error:", error);
      const message = error instanceof Error ? error.message : "Error interno";
      throw new functions.https.HttpsError("internal", message);
    }
  }
);

// ==================== SEND NOTIFICATION ====================

interface SendNotificationData {
  userIds?: string[];
  roles?: string[];
  title: string;
  body: string;
  type?: "order" | "inventory" | "alert" | "info";
  priority?: "low" | "normal" | "high";
  data?: Record<string, unknown>;
}

/**
 * Enviar notificaciones push y crear notificaciones in-app
 * Puede dirigirse a userIds específicos o a todos los usuarios con roles dados
 */
export const sendNotification = functions.https.onCall(
  async (request: functions.https.CallableRequest<SendNotificationData>) => {
    const {
      userIds,
      roles,
      title,
      body,
      type = "info",
      priority = "normal",
      data,
    } = request.data;

    try {
      let targetUserIds: string[] = [];

      // Si se especifican userIds, usarlos directamente
      if (userIds && userIds.length > 0) {
        targetUserIds = userIds;
      } else if (roles && roles.length > 0) {
        // Si se especifican roles, obtener usuarios con esos roles
        const usersSnapshot = await db
          .collection("users")
          .where("role", "in", roles)
          .get();

        targetUserIds = usersSnapshot.docs.map((doc) => doc.id);
      } else {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Debe especificar userIds o roles"
        );
      }

      if (targetUserIds.length === 0) {
        return {
          success: true,
          message: "No se encontraron usuarios para notificar",
          sentCount: 0,
        };
      }

      console.log(
        "📬 Enviando notificaciones a",
        targetUserIds.length,
        "usuarios"
      );

      // Crear notificaciones in-app en Firestore para cada usuario
      const notificationPromises = targetUserIds.map((userId) =>
        db.collection("notifications").add({
          userId,
          title,
          body,
          type,
          priority,
          read: false,
          createdAt: new Date(),
          data: data || {},
        })
      );

      await Promise.all(notificationPromises);
      console.log(
        "✅",
        targetUserIds.length,
        "notificaciones in-app creadas"
      );

      // Obtener tokens FCM de los usuarios evitando FieldPath.documentId() (compatibilidad emulador)
      const userDocs = await Promise.all(
        targetUserIds.map((uid) => db.collection("users").doc(uid).get())
      );

      const fcmTokens: string[] = [];
      userDocs.forEach((doc) => {
        const userData = doc.data() as { fcmToken?: string } | undefined;
        if (userData?.fcmToken) {
          fcmTokens.push(userData.fcmToken);
        }
      });

      console.log("📱", fcmTokens.length, "tokens FCM encontrados");

      // Enviar notificaciones push a dispositivos con FCM
      let pushSentCount = 0;
      if (fcmTokens.length > 0) {
        const message = {
          notification: {
            title,
            body,
          },
          data: {
            type,
            priority,
            ...data,
          },
        };

        // Enviar a múltiples dispositivos
        const response = await admin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: message.notification,
          data: message.data,
        });

        pushSentCount = response.successCount;
        console.log(
          "✅",
          response.successCount,
          "notificaciones push enviadas"
        );

        if (response.failureCount > 0) {
          console.warn(
            "⚠️",
            response.failureCount,
            "notificaciones push fallaron"
          );
          // Limpiar tokens inválidos
          const failedTokens = response.responses
            .map((resp, idx) => (resp.success ? null : fcmTokens[idx]))
            .filter((token) => token !== null);

          for (const token of failedTokens) {
            // Eliminar token inválido de los usuarios
            const userWithToken = await db
              .collection("users")
              .where("fcmToken", "==", token)
              .limit(1)
              .get();

            if (!userWithToken.empty) {
              await userWithToken.docs[0].ref.update({
                fcmToken: admin.firestore.FieldValue.delete(),
              });
            }
          }
        }
      }

      return {
        success: true,
        message: "Notificaciones enviadas correctamente",
        sentCount: targetUserIds.length,
        pushSentCount,
      };
    } catch (error: unknown) {
      console.error("❌ Error al enviar notificaciones:", error);
      const message = error instanceof Error ? error.message : "Error interno";
      throw new functions.https.HttpsError("internal", message);
    }
  }
);
