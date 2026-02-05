import { useState } from "react";
import type { Route } from "./+types/services";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { RequestHelpModal } from "../components/RequestHelpModal";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Services - PawLove Rescue & Services" },
        {
            name: "description",
            content:
                "Learn about our spay/neuter, vaccination, and pet food assistance services for Grant Parish families.",
        },
    ];
}

export default function Services() {
    const [showRequestHelp, setShowRequestHelp] = useState(false);

    return (
        <>
            <Header />
            <main className="container">
                <section style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div className="badge" style={{ marginBottom: "16px" }}>
                        <span className="dot"></span> How We Help
                    </div>
                    <h1 className="h1" style={{ marginBottom: "16px" }}>
                        Our Services
                    </h1>
                    <p className="lead" style={{ maxWidth: "700px", margin: "0 auto 24px" }}>
                        We provide essential support services to help Grant Parish families
                        keep their pets healthy and at home.
                    </p>
                    <button
                        className="button primary"
                        onClick={() => setShowRequestHelp(true)}
                    >
                        Request Help
                    </button>
                </section>

                <section className="grid">
                    <div className="card">
                        <div className="card-image">
                            <img
                                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80"
                                alt="Veterinary care"
                                loading="lazy"
                            />
                        </div>
                        <h3>Spay & Neuter Access</h3>
                        <p>
                            We help connect families with affordable spay and neuter services to
                            prevent unwanted litters and reduce shelter intake. Our program
                            makes these essential services accessible to everyone in Grant
                            Parish.
                        </p>
                        <div style={{ padding: "0 20px 20px" }}>
                            <div className="chips">
                                <span className="chip">Prevention</span>
                                <span className="chip">Affordable</span>
                                <span className="chip">Essential</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-image">
                            <img
                                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop&q=80"
                                alt="Dog vaccination"
                                loading="lazy"
                            />
                        </div>
                        <h3>Vaccination Support</h3>
                        <p>
                            Basic vaccinations are crucial for keeping pets healthy and
                            preventing disease. We help families access vaccination services to
                            protect their pets and the community.
                        </p>
                        <div style={{ padding: "0 20px 20px" }}>
                            <div className="chips">
                                <span className="chip">Health</span>
                                <span className="chip">Prevention</span>
                                <span className="chip">Community</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-image">
                            <img
                                src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=400&fit=crop&q=80"
                                alt="Pet food"
                                loading="lazy"
                            />
                        </div>
                        <h3>Pet Food Assistance</h3>
                        <p>
                            When families face financial hardship, we provide pet food assistance
                            to help keep pets fed and at home. No pet should be surrendered
                            because their family is going through a tough time.
                        </p>
                        <div style={{ padding: "0 20px 20px" }}>
                            <div className="chips">
                                <span className="chip">Support</span>
                                <span className="chip">Emergency</span>
                                <span className="chip">Compassion</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass" style={{ marginTop: "40px", textAlign: "center" }}>
                    <h2 style={{ marginBottom: "16px" }}>Eligibility</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "24px" }}>
                        Our services are available to Grant Parish residents who need support
                        caring for their pets. We work with each family individually to
                        understand their needs and provide appropriate assistance.
                    </p>
                    <button
                        className="button primary"
                        onClick={() => setShowRequestHelp(true)}
                    >
                        Apply for Assistance
                    </button>
                </section>
            </main>
            <Footer />

            <RequestHelpModal
                isOpen={showRequestHelp}
                onClose={() => setShowRequestHelp(false)}
            />
        </>
    );
}
