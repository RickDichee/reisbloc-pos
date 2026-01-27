// Servicio para gestión de auditoría
import { AuditLog } from '@types/index';
import logger from '@/utils/logger'

class AuditService {
  /**
   * Registra una acción en el log de auditoría
   */
  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
    deviceId?: string
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress: await this.getClientIP(),
        deviceId,
        timestamp: new Date(),
      };

      // Guardar en Firebase (se implementará en firebaseService)
      await this.saveAuditLog(auditLog);

      // Log en consola para desarrollo
      logger.info('audit', 'Audit log', auditLog)
    } catch (error) {
      logger.error('audit', 'Error logging audit', error as any);
    }
  }

  /**
   * Registra eliminación de producto con restricción de tiempo
   */
  async logProductDeletion(
    userId: string,
    productId: string,
    productName: string,
    minutesElapsed: number,
    deviceId?: string,
    reason?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      'DELETE_PRODUCT_FROM_ORDER',
      'ORDER_ITEM',
      productId,
      { name: productName, minutesElapsed },
      { deletedAt: new Date(), reason },
      deviceId
    );
  }

  /**
   * Registra cambios de inventario
   */
  async logInventoryChange(
    userId: string,
    productId: string,
    productName: string,
    quantityBefore: number,
    quantityAfter: number,
    reason: string,
    deviceId?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      'INVENTORY_CHANGE',
      'PRODUCT',
      productId,
      { quantity: quantityBefore, name: productName },
      { quantity: quantityAfter },
      deviceId
    );
  }

  /**
   * Registra modificación de usuario
   */
  async logUserModification(
    userId: string,
    modifiedUserId: string,
    changes: any,
    deviceId?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      'USER_MODIFIED',
      'USER',
      modifiedUserId,
      undefined,
      changes,
      deviceId
    );
  }

  /**
   * Registra cierre de caja
   */
  async logDailyClose(
    userId: string,
    closeId: string,
    totalSales: number,
    totalCash: number,
    totalDigital: number,
    deviceId?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      'DAILY_CLOSE',
      'DAILY_CLOSE',
      closeId,
      undefined,
      {
        totalSales,
        totalCash,
        totalDigital,
        timestamp: new Date(),
      },
      deviceId
    );
  }

  /**
   * Registra ajuste de caja
   */
  async logCashAdjustment(
    userId: string,
    amount: number,
    reason: string,
    type: 'income' | 'expense',
    deviceId?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      'CASH_ADJUSTMENT',
      'ADJUSTMENT',
      `adj_${Date.now()}`,
      undefined,
      { amount, reason, type },
      deviceId
    );
  }

  /**
   * Obtiene IP del cliente (se implementará mejor en el servidor)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * Guardar audit log en Firebase
   */
  private async saveAuditLog(log: AuditLog): Promise<void> {
    // Se implementará en firebaseService
    // Aquí solo placeholder
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getLogs(
    filters: {
      userId?: string;
      entityType?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    // Se implementará en firebaseService
    return [];
  }

  /**
   * Genera reporte de auditoría
   */
  async generateAuditReport(
    dateFrom: Date,
    dateTo: Date,
    userId?: string
  ): Promise<any> {
    const logs = await this.getLogs({
      userId,
      dateFrom,
      dateTo,
      limit: 1000,
    });

    return {
      period: { from: dateFrom, to: dateTo },
      totalActions: logs.length,
      byAction: this.groupBy(logs, 'action'),
      byUser: this.groupBy(logs, 'userId'),
      byEntityType: this.groupBy(logs, 'entityType'),
      logs,
    };
  }

  /**
   * Helper para agrupar arrays
   */
  private groupBy(arr: any[], key: string): any {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }
}

export default new AuditService();
