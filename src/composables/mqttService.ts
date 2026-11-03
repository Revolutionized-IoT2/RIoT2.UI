import { ref } from 'vue'
import type { Ref } from 'vue'
import mqtt, { type MqttClient } from 'mqtt';
import AppError from '@/models/appError';
import { Constants } from '@/models/constants';
import { useErrorStore } from '@/stores/errorStore';
import { offlineMessage } from '@/composables/presence';
import { mqttServer, mqttUser, mqttPassword } from '@/app.config';

/** Receives every message: its topic, its payload as text, and whether the broker retained it. */
export type MessageHandler = (topic: string, message: string, retained: boolean) => void;

const initialReconnectPeriod = 4000;
const maximumReconnectPeriod = 30000;

const connection = {
    protocol: "ws",
    host: mqttServer,
    // ws: 8083; wss: 8084
    port: 9001,
    endpoint: "/",
    clean: true,
    connectTimeout: 30000, // ms
    reconnectPeriod: initialReconnectPeriod,
    clientId: "",
    // auth
    username: mqttUser,
    password: mqttPassword,
    will: {
      topic:  "",
      payload: offlineMessage,
      qos: 1 as const,
      retain: false
    },
};

export function useMqtt(id: string): IMqttService {

  connection.clientId = id;
  connection.will.topic = Constants.topicOnline.replace("{id}", id);

  const e = useErrorStore();

  let client: MqttClient;
  let reconnectPeriod = initialReconnectPeriod;
  let stopped = true;
  const status: Ref<boolean> = ref(false);

  function handleError(msg: string) {
    if(e != null)
      e.setError(new AppError(msg));
    else
      console.log(msg);
  }

  function initData() {
    status.value = false;
    reconnectPeriod = initialReconnectPeriod;
  }

  function handleOnReConnect() {
      if (stopped)
        return;
      status.value = false;
      // MQTT.js clears its timer when this attempt starts; the next outage
      // timer uses the updated delay without disabling automatic resubscription.
      reconnectPeriod = Math.min(reconnectPeriod * 2, maximumReconnectPeriod);
      client.options.reconnectPeriod = reconnectPeriod;
  }

  /**
   * Connects, and keeps reconnecting until disconnect. `connected` runs after every successful
   * connection, including each reconnect, so the caller can announce itself again.
   */
  function createConnection(callback: MessageHandler, connected?: () => void) {
      try {
          stopped = false;
          reconnectPeriod = initialReconnectPeriod;
          status.value = false;
          const { protocol, host, port, endpoint, ...options } = connection;
          const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
          client = mqtt.connect(connectUrl, options);
        
          client.on("connect", () => {
              if (stopped)
                return;
              reconnectPeriod = initialReconnectPeriod;
              client.options.reconnectPeriod = initialReconnectPeriod;
              status.value = client.connected;
              connected?.();
          });

          client.on("reconnect", handleOnReConnect);
          client.on("close", () => { status.value = false; });
          client.on("error", (error) => {
            handleError(error.message);
          });

          client.on("message", (topic, payload, packet) => callback(topic, String(payload), packet?.retain === true));

      } catch {
        status.value = false;
        handleError("Could not connect to mqtt")
      }
  }

  function doSubscribe(topic: string) {
      if (!client) {
        handleError("Could not subscribe before MQTT connection was created: " + topic);
        return;
      }
      client.subscribe(topic, error => {
        if (error) {
          handleError("Could not subscribe to topic: " + topic);
          status.value = false;
        }
      })
  }

  function doPublish(topic: string, message: string) {
      if (!client) {
        handleError("Could not publish before MQTT connection was created: " + topic);
        return;
      }
      client.publish(topic, message, error => {
        if (error) {
          handleError("Could not publish to topic: " + topic);
        }
      })
  }

  function disConnect() {
      stopped = true;
      status.value = false;
      if (client) {
        try {
          client.end(!client.connected, () => {
            initData()
          })
        } catch {
          handleError("MQTT Disconnect failed");
        }
      }
  }

  return {
    connect: createConnection,
    subscribe: doSubscribe,
    sendMessage: doPublish,
    disConnect: disConnect,
    status: status
  };
}

export interface IMqttService {
  connect: (callback: MessageHandler, connected?: () => void) => void;
  subscribe: (topic: string) => void,
  sendMessage:(topic: string, message: string) => void;
  disConnect: () => void;
  status:  Ref<boolean>;
}