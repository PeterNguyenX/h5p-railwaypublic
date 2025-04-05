interface H5P {
  init: () => void;
  attach: (element: HTMLElement, content: any) => void;
}

declare global {
  interface Window {
    H5P?: H5P;
  }
}

export {}; 