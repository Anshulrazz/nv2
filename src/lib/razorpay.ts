declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag is already in DOM
    let script = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (!script) {
      script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.Razorpay) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= 60) {
        clearInterval(checkInterval);
        resolve(Boolean(window.Razorpay));
      }
    }, 100);

    script.onload = () => {
      clearInterval(checkInterval);
      resolve(true);
    };
    script.onerror = () => {
      clearInterval(checkInterval);
      resolve(false);
    };
  });
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error(
      "Razorpay SDK failed to load. Please disable ad-blockers or check network connection."
    );
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
}
