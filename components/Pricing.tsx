"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  planId: string;
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Plus",
    price: 0,
    features: [
      "5 Matches Per Day",
      "10 Messages Per Day",
      "Unlimited App Usage",
    ],
    planId: "plus",
  },
  {
    name: "Gold",
    price: 899,
    features: [
      "Unlimited Matches",
      "Unlimited Messages",
      "Unlimited App Usage",
    ],
    planId: "gold",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 1499,
    features: [
      "Priority Listing",
      "Unlimited Matches & Messages",
      "Unlimited App Usage",
    ],
    planId: "premium",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const revealEls = Array.from(
      section.querySelectorAll<HTMLElement>(".reveal")
    );
    if (revealEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => {
      revealEls.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.price === 0) {
      // Free plan - just redirect to signup
      const modal = document.getElementById("login-modal");
      if (modal) {
        modal.style.display = "flex";
      }
      return;
    }

    try {
      setLoading(plan.planId);
      const token = localStorage.getItem("token");

      if (!token) {
        // User not logged in, show login modal
        const modal = document.getElementById("login-modal");
        if (modal) {
          modal.style.display = "flex";
        }
        setLoading(null);
        return;
      }

      // Create order with Razorpay
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-order`,
        { planId: plan.planId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Load Razorpay script dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        // Initialize Razorpay checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: response.data.amount,
          currency: response.data.currency || "INR",
          name: "NoseBoop",
          description: `${plan.name} Subscription`,
          order_id: response.data.orderId,
          handler: async (paymentResponse: any) => {
            // Verify payment on backend
            try {
              await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`,
                {
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              alert("Payment successful! Your subscription is now active.");
              window.location.reload();
            } catch (error) {
              console.error("Payment verification error:", error);
              alert("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            email: response.data.userEmail,
          },
          theme: {
            color: "#ff4c68",
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch (error: any) {
      console.error("Subscription error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to process subscription. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" ref={sectionRef}>
      <div className="pricing-header p-3 pb-md-4 mx-auto text-center reveal">
        <h1 className="display-4 fw-bold text-body-emphasis mb-3">
          A Plan for Every Dog&apos;s Needs
        </h1>
        <p className="fs-5 text-body-secondary lead">
          Simple and affordable price plans for you and your dog.
        </p>
      </div>
      <div className="row row-cols-1 row-cols-md-3 mb-3 text-center ps-5 pe-5 g-4">
        {plans.map((plan, index) => (
          <div
            key={plan.planId}
            className="col reveal"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`card mb-4 rounded-4 shadow-lg h-100 ${
                plan.highlighted ? "border-0 pricing-highlighted" : "border-0"
              }`}
              style={{
                background: plan.highlighted
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#fff",
                color: plan.highlighted ? "#fff" : "inherit",
                transform: "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
              }}
            >
              {plan.highlighted && (
                <div className="position-absolute top-0 start-50 translate-middle mt-3">
                  <span className="badge bg-warning text-dark px-3 py-2">
                    POPULAR
                  </span>
                </div>
              )}
              <div
                className={`card-header py-4 ${
                  plan.highlighted
                    ? "bg-transparent border-0"
                    : "bg-transparent border-0"
                }`}
              >
                <h4 className="my-0 fw-bold fs-3">{plan.name}</h4>
              </div>
              <div className="card-body px-4 pb-4">
                <h1
                  className="card-title pricing-card-title mb-4"
                  style={{ color: plan.highlighted ? "#fff" : "inherit" }}
                >
                  {plan.price === 0
                    ? "Free"
                    : `₹${plan.price.toLocaleString("en-IN")}`}
                  {plan.price !== 0 && (
                    <small
                      className={`fw-light ${
                        plan.highlighted ? "opacity-90" : "text-body-secondary"
                      }`}
                      style={{
                        fontSize: "1.5rem",
                        color: plan.highlighted ? "#fff" : "inherit",
                      }}
                    >
                      /month
                    </small>
                  )}
                </h1>
                <ul className="list-unstyled mt-4 mb-4 text-start">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="mb-3"
                      style={{ fontSize: "1.1rem" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill={plan.highlighted ? "#fff" : "#667eea"}
                        className="bi bi-check-circle-fill me-2"
                        viewBox="0 0 16 16"
                      >
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 4.3 6.3a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.08-.022l5-5.5a.75.75 0 0 0-.022-1.08z" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`w-100 btn btn-lg fw-bold ${
                    plan.highlighted
                      ? "btn-light"
                      : plan.price === 0
                      ? "btn-outline-primary"
                      : "btn-primary"
                  }`}
                  style={{
                    borderRadius: "50px",
                    padding: "12px",
                    fontSize: "1.1rem",
                  }}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.planId}
                >
                  {loading === plan.planId
                    ? "Processing..."
                    : plan.price === 0
                    ? "Sign up for free"
                    : plan.name === "Premium"
                    ? "Contact us"
                    : "Get started"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
