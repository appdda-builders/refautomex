export const getStorageValue = (key) => {
    if (typeof window !== "undefined") {    
    const value = localStorage.getItem(key);
        if (value && value !== "undefined") {
            return JSON.parse(value);
        }
    }
    return null;
}

export const setStorageValue = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
}