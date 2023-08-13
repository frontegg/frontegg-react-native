import AsyncStorage from '@react-native-async-storage/async-storage';

class SyncStorage {
  data: Map<string, string | null> = new Map();

  loading: boolean = true;

  private async loadData() {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    this.data = new Map(result.map(([key, value]) => [key, value]));
    this.loading = false;
  }

  init() {
    this.loading = true;
    this.loadData();

    // @ts-ignore
    global.localStorage = {
      getItem: this.get.bind(this),
      setItem: this.set.bind(this),
      removeItem: this.remove.bind(this),
      clear: this.clear.bind(this),
    };
  }

  get(key: string): any {
    return this.data.get(key);
  }

  set(key: string, value: string | null): Promise<void> {
    this.data.set(key, value);
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): Promise<void> {
    this.data.delete(key);
    return AsyncStorage.removeItem(key);
  }

  clear(): Promise<void> {
    this.data.clear();
    return AsyncStorage.clear();
  }
}

const syncStorage = new SyncStorage();

export default syncStorage;
