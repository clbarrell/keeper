import { useState } from "react";

// Hook
export default function useChromeLocalStorage(
  key: string,
  initialValue: any
): [any, (any) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(initialValue);

  // set intiial value
  chrome.storage.local.get([key], function (result) {
    // storedValue = result[key];
    if (result.hasOwnProperty(key)) {
      setStoredValue(result[key]);
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to chrome storage
      const data = {};
      data[key] = valueToStore;
      chrome.storage.local.set(data);
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
