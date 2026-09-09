import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  integrationsService,
  PROVIDERS,
} from '../services/integrationsService';
import { showNotification } from '../services/notifications';

export function useIntegrations() {
  const [configs, setConfigs] = useState(() => integrationsService.getConfigs());
  const [webhookLogs, setWebhookLogs] = useState(() => integrationsService.getWebhookLogs());

  useEffect(() => {
    const unsubscribe = integrationsService.subscribe(() => {
      setConfigs(integrationsService.getConfigs());
      setWebhookLogs(integrationsService.getWebhookLogs());
    });
    return unsubscribe;
  }, []);

  // Merge providers with their live connection config
  const providers = useMemo(() => {
    return PROVIDERS.map((p) => {
      const cfg = configs[p.id] || {};
      return {
        ...p,
        isConnected: Boolean(cfg.connected),
        config: cfg,
        lastSyncedAt: cfg.lastSyncedAt || null,
      };
    });
  }, [configs]);

  const connect = useCallback((providerId, userConfig = {}) => {
    return integrationsService.connectProvider(providerId, userConfig);
  }, []);

  const disconnect = useCallback((providerId) => {
    return integrationsService.disconnectProvider(providerId);
  }, []);

  const importTask = useCallback((providerId, item, onAddTask) => {
    const taskPayload = integrationsService.convertItemToTask(providerId, item);
    if (onAddTask) {
      onAddTask(taskPayload);
      showNotification(
        'Imported to DeskFlow! 📥',
        `Added "${item.title}" from ${taskPayload.externalSource?.providerName || providerId}.`
      );
    }
    return taskPayload;
  }, []);

  const sendTestPing = useCallback((providerId) => {
    return integrationsService.sendTestPing(providerId);
  }, []);

  const broadcastTaskCompleted = useCallback((task) => {
    integrationsService.broadcastEvent('task_completed', {
      taskTitle: task.title,
      category: task.category,
    });
  }, []);

  const broadcastFocusCompleted = useCallback((durationMinutes) => {
    integrationsService.broadcastEvent('focus_completed', {
      durationMinutes,
    });
  }, []);

  return {
    providers,
    configs,
    webhookLogs,
    connect,
    disconnect,
    importTask,
    sendTestPing,
    broadcastTaskCompleted,
    broadcastFocusCompleted,
  };
}
