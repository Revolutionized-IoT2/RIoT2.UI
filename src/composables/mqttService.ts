import { inject, ref } from 'vue'
import type { Ref } from 'vue'
import type { QoS } from 'mqtt/dist/mqtt.min';
import mqtt, { MqttClient } from 'mqtt/dist/mqtt.min';
import { InjectionKeys } from '@/models/injectionKeys';
import AppError from '@/models/appError';
import { Constants } from '@/models/constants';
import { useErrorStore } from '@/stores/errorStore';

let connection = {
    protocol: "ws",
    host: import.meta.env.VITE_MQTT_SERVER || "__MQTT_SERVER__",
    // ws: 8083; wss: 8084
    port: 9001,
    endpoint: "/",
    clean: true,
    connectTimeout: 30000, // ms
    reconnectPeriod: 4000, // ms
    clientId: "",
    // auth
    username: import.meta.env.VITE_MQTT_USER || "__MQTT_USER__",
    password: import.meta.env.VITE_MQTT_PASSWORD || "__MQTT_PASSWORD__",
    will: {
      topic:  "",
      payload: '{ "IsOnline": false }',
      qos: 1 as QoS,
      retain: false
    },
};

export function useMqtt(id: string): IMqttService {

  connection.clientId = id;
  connection.will.topic = Constants.topicOnline.replace("{id}", id);

  //const errorHandler = inject(InjectionKeys.errorHandler);
  const e = useErrorStore();
  
  let client: MqttClient;
  let subscribeSuccess: boolean = false;
  let connecting: boolean = false;
  let retryTimes: number = 0;
  const status: Ref<boolean> = ref(false);

  function handleError(msg: string) {
    if(e != null)
      e.setError(new AppError(msg));
    else
      console.log(msg);
  }

  function initData() {
    client.connected = false;
    retryTimes = 0;
    connecting = false;
    subscribeSuccess = false;
  }

  function handleOnReConnect() {
      retryTimes += 1;
      if (retryTimes > 5) {
        try {
          client.end();
          initData();
          //$message.error("Connection maxReconnectTimes limit, stop retry");
        } catch (error) {
          //this.$message.error(error.toString());
        }
      }
  }

  function createConnection(callback: (topic: string, message: string) => void) {
      try {
          connecting = true;
          status.value = false;
          const { protocol, host, port, endpoint, ...options } = connection;
          const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
          client = mqtt.connect(connectUrl, options);
        
          client.on("connect", () => {
              connecting = false;
              console.log("Connection succeeded: " + client.connected);
              status.value = client.connected;
          });

          client.on("reconnect", handleOnReConnect);
          client.on("error", (error) => {
            handleError(error.message);
          });

          client.on("message", callback);

      } catch (error) {
        connecting = false;
        status.value = false;
        handleError("Could not connect to mqtt")
      }
  }

  function doSubscribe(topic: string) {
      client.subscribe(topic, (error, res) => {
        if (error) {
          handleError("Could not subscribe to topic: " + topic);
          status.value = false;
          return;
        }
        subscribeSuccess = true;
        console.log('Subscribe to topics res', res);
      })
  }

  function doUnSubscribe(topic: string) {
      client.unsubscribe(topic, undefined, error => {
        if (error) {
          handleError("Could not un-subscribe to topic: " + topic);
        }
      })
  }

  function doPublish(topic: string, message: string) {
      client.publish(topic, message, error => {
        if (error) {
          handleError("Could not publish to topic: " + topic);
        }
      })
  }

  function disConnect() {
      if (client.connected) {
        try {
          client.end(false, () => {
            initData()
            console.log('Successfully disconnected!')
          })
        } catch (error: any) {
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
  connect: (callback: (topic: string, message: string) => void) => void;
  subscribe: (topic: string) => void,
  sendMessage:(topic: string, message: string) => void;
  disConnect: () => void;
  status:  Ref<boolean>;
}