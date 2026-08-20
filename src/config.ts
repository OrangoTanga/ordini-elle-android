import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_WORKER_URL = 'https://ordini-elly-worker.elly-order.workers.dev'

let _workerUrl = DEFAULT_WORKER_URL

export async function getWorkerUrl(): Promise<string> {
  if (!_workerUrl) {
    _workerUrl = (await AsyncStorage.getItem('worker_url')) || DEFAULT_WORKER_URL
  }
  return _workerUrl
}

export async function setWorkerUrl(url: string): Promise<void> {
  _workerUrl = url.replace(/\/+$/, '')
  await AsyncStorage.setItem('worker_url', url)
}
