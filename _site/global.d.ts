declare global {
  interface Window {
    Alpine: any;
    Hls: any;
  }

  interface RadioMap {
    [key: string]: string;
  }
}

// ensures it’s treated as a module
export {};
