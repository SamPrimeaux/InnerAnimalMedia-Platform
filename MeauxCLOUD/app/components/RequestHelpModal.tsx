import { useState } from "react";

interface RequestHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RequestHelpModal({ isOpen, onClose }: RequestHelpModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        serviceType: "",
        petType: "",
        petName: "",
        message: "",
    });

    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would send to a backend
        console.log("Form submitted:", formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                serviceType: "",
                petType: "",
                petName: "",
                message: "",
            });
        }, 2000);
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Request Help</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {submitted ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
                        <h3 style={{ marginBottom: "8px" }}>Request Submitted!</h3>
                        <p style={{ color: "var(--muted)" }}>
                            We'll get back to you within 24-48 hours.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address (Grant Parish) *</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="serviceType">Service Needed *</label>
                            <select
                                id="serviceType"
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a service...</option>
                                <option value="spay-neuter">Spay/Neuter Assistance</option>
                                <option value="vaccination">Vaccination Support</option>
                                <option value="food">Pet Food Assistance</option>
                                <option value="multiple">Multiple Services</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="petType">Pet Type *</label>
                            <select
                                id="petType"
                                name="petType"
                                value={formData.petType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select pet type...</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="petName">Pet Name</label>
                            <input
                                type="text"
                                id="petName"
                                name="petName"
                                value={formData.petName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Additional Information</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us more about your situation and how we can help..."
                            />
                        </div>

                        <button type="submit" className="button primary" style={{ width: "100%" }}>
                            Submit Request
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
