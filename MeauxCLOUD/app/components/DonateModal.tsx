import { useState, useEffect } from "react";

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
    const [amount, setAmount] = useState("25");
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Load Stripe script
        if (isOpen && !document.getElementById("stripe-js")) {
            const script = document.createElement("script");
            script.id = "stripe-js";
            script.src = "https://js.stripe.com/v3/";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCheckout = async () => {
        setIsProcessing(true);

        // Simulate Stripe checkout for demo
        // In production, this would create a real Stripe checkout session
        setTimeout(() => {
            setIsProcessing(false);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 3000);
        }, 2000);
    };

    const selectedAmount = amount === "custom" ? customAmount : amount;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Support PawLove</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {showSuccess ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>💚</div>
                        <h3 style={{ marginBottom: "8px" }}>Thank You!</h3>
                        <p style={{ color: "var(--muted)" }}>
                            Your donation helps keep pets and families together.
                        </p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
                            Your donation helps us provide spay/neuter services, vaccinations,
                            and pet food assistance to families in Grant Parish.
                        </p>

                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    marginBottom: "12px",
                                }}
                            >
                                Select Amount
                            </label>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "12px",
                                    marginBottom: "12px",
                                }}
                            >
                                {["25", "50", "100"].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setAmount(amt)}
                                        className="button"
                                        style={{
                                            background:
                                                amount === amt
                                                    ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                                                    : "var(--surface)",
                                            color: amount === amt ? "white" : "var(--text)",
                                            border: amount === amt ? "none" : "2px solid var(--border)",
                                        }}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setAmount("custom")}
                                className="button"
                                style={{
                                    width: "100%",
                                    background:
                                        amount === "custom"
                                            ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                                            : "var(--surface)",
                                    color: amount === "custom" ? "white" : "var(--text)",
                                    border: amount === "custom" ? "none" : "2px solid var(--border)",
                                }}
                            >
                                Custom Amount
                            </button>

                            {amount === "custom" && (
                                <div style={{ marginTop: "12px" }}>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            background: "var(--bg)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "8px",
                                            color: "var(--text)",
                                            fontSize: "15px",
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span style={{ color: "var(--muted)" }}>Donation Amount:</span>
                                <span style={{ fontWeight: 600 }}>
                                    ${selectedAmount || "0"}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: "8px",
                                    borderTop: "1px solid var(--border)",
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>Total:</span>
                                <span style={{ fontWeight: 700, fontSize: "18px" }}>
                                    ${selectedAmount || "0"}
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                background: "hsla(210, 100%, 50%, 0.1)",
                                border: "1px solid hsla(210, 100%, 50%, 0.3)",
                                borderRadius: "8px",
                                padding: "12px",
                                marginBottom: "24px",
                                fontSize: "13px",
                                color: "var(--muted)",
                            }}
                        >
                            🔒 <strong>Demo Mode:</strong> This is a demonstration checkout.
                            No real charges will be made. In production, this would connect to
                            Stripe for secure payment processing.
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing || !selectedAmount || selectedAmount === "0"}
                            className="button primary"
                            style={{
                                width: "100%",
                                opacity:
                                    isProcessing || !selectedAmount || selectedAmount === "0"
                                        ? 0.5
                                        : 1,
                                cursor:
                                    isProcessing || !selectedAmount || selectedAmount === "0"
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            {isProcessing ? "Processing..." : "Proceed to Checkout"}
                        </button>

                        <p
                            style={{
                                textAlign: "center",
                                fontSize: "12px",
                                color: "var(--muted)",
                                marginTop: "16px",
                            }}
                        >
                            Tax-deductible donation · 501(c)(3) · EIN: 93-2791656
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
