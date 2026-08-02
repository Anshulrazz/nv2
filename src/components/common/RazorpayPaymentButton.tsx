"use client";

import React, { useEffect, useRef } from "react";

interface RazorpayPaymentButtonProps {
  buttonId?: string;
  className?: string;
}

export function RazorpayPaymentButton({
  buttonId = "pl_TKvnrbgY75iRaH",
  className = "flex items-center justify-center my-2",
}: RazorpayPaymentButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formRef.current) return;

    // Clear previous children if any to prevent duplicate buttons
    const currentForm = formRef.current;
    
    // Check if button script already exists
    const existingScript = currentForm.querySelector(
      `script[data-payment_button_id="${buttonId}"]`
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute("data-payment_button_id", buttonId);
      script.async = true;
      currentForm.appendChild(script);
    }
  }, [buttonId]);

  return <form ref={formRef} className={className} />;
}
