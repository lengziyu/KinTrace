declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

let loaderPromise: Promise<any> | null = null;

export async function loadAmap() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.AMap) {
    return window.AMap;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const key = import.meta.env.VITE_AMAP_KEY;
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;

  if (!key) {
    return null;
  }

  if (securityCode) {
    window._AMapSecurityConfig = {
      securityJsCode: securityCode,
    };
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar`;
    script.async = true;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => reject(new Error("高德地图加载失败"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

