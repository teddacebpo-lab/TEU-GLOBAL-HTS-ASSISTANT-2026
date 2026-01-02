const isRunningOnLan = (): boolean => {
    const hostname = window.location.hostname;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
    );
};

const SIMULATED_LATENCY = 200; // ms

export const saveData = async <T,>(key: string, data: T): Promise<void> => {
    if (isRunningOnLan()) {
        console.log(`[DataService] Simulating database save for key: ${key}`);
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`[DataService] Simulated save complete for key: ${key}`);
                resolve();
            }, SIMULATED_LATENCY);
        });
    } else {
        localStorage.setItem(key, JSON.stringify(data));
        return Promise.resolve();
    }
};

export const loadData = async <T,>(key: string, defaultValue: T): Promise<T> => {
    const loadLogic = () => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                // A special case for aiBehavior which might be stored as a raw string
                if (key === 'aiBehavior' && !saved.startsWith('"')) {
                    return saved as unknown as T;
                }
                return JSON.parse(saved) as T;
            } catch (e) {
                console.error(`[DataService] Failed to parse stored value for ${key}:`, e);
                return defaultValue;
            }
        }
        return defaultValue;
    };

    if (isRunningOnLan()) {
        console.log(`[DataService] Simulating database load for key: ${key}`);
        return new Promise(resolve => {
            setTimeout(() => {
                const data = loadLogic();
                console.log(`[DataService] Simulated load complete for key: ${key}`);
                resolve(data);
            }, SIMULATED_LATENCY);
        });
    } else {
        return Promise.resolve(loadLogic());
    }
};

export const loadString = async (key: string, defaultValue: string): Promise<string> => {
     const loadLogic = () => {
        const item = localStorage.getItem(key);
        // Previously saved prompts might have been JSON stringified, so handle both cases.
        if (item) {
            try {
                // If it's a JSON string (e.g., "\"my prompt\""), parse it.
                if (item.startsWith('"') && item.endsWith('"')) {
                    return JSON.parse(item);
                }
                // Otherwise, it's a raw string.
                return item;
            } catch {
                return item; // Fallback to raw item if JSON parsing fails
            }
        }
        return defaultValue;
    };
    if (isRunningOnLan()) {
        console.log(`[DataService] Simulating database load for key: ${key}`);
        return new Promise(resolve => {
            setTimeout(() => {
                const data = loadLogic();
                resolve(data);
            }, SIMULATED_LATENCY);
        });
    } else {
        return Promise.resolve(loadLogic());
    }
};

export const saveString = async (key: string, data: string): Promise<void> => {
    if (isRunningOnLan()) {
         return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem(key, data);
                resolve();
            }, SIMULATED_LATENCY);
        });
    } else {
        localStorage.setItem(key, data);
        return Promise.resolve();
    }
};