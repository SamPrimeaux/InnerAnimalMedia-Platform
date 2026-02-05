import { useState } from "react";
import type { Route } from "./+types/home";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { RequestHelpModal } from "../components/RequestHelpModal";
import { DonateModal } from "../components/DonateModal";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "PawLove Rescue & Services - Keeping Pets & Families Together" },
        {
            name: "description",
            content:
                "PawLove Rescue & Services helps Grant Parish families care for their pets through spay/neuter, vaccinations, and food assistance.",
        },
    ];
}

export default function Home() {
    const [showRequestHelp, setShowRequestHelp] = useState(false);
    const [showDonate, setShowDonate] = useState(false);

    return (
        <>
            <Header />
            <main className="container">
                <section className="hero">
                    <div>
                        <div className="badge">
                            <span className="dot"></span> Keeping pets and families together
                            through care, prevention, and compassion
                        </div>

                        <h1 className="h1">Compassionate help for Grant Parish pet owners.</h1>

                        <p className="lead">
                            PawLove Rescue & Services exists to support local families with
                            access to <strong>spay & neuter</strong>,{" "}
                            <strong>vaccinations</strong>, and{" "}
                            <strong>pet food assistance</strong>—so pets stay healthy, stay
                            home, and stay out of shelters.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                                marginBottom: "20px",
                            }}
                        >
                            <button
                                className="button primary"
                                onClick={() => setShowRequestHelp(true)}
                            >
                                Request Help
                            </button>
                            <button className="button" onClick={() => setShowDonate(true)}>
                                Donate
                            </button>
                        </div>

                        <div className="chips" aria-label="Trust highlights">
                            <span className="chip">501(c)(3) • ID #93-2791656</span>
                            <span className="chip">Local • Practical • Prevention-first</span>
                            <span className="chip">
                                Established 2025 • Saving Lives Since 2014
                            </span>
                        </div>
                    </div>

                    <div className="hero-image">
                        <img
                            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop&q=80"
                            alt="Happy dog with family"
                            loading="eager"
                        />
                    </div>
                </section>

                <section className="glass" style={{ margin: "40px auto" }}>
                    <div className="kicker">Our Mission</div>
                    <h2 style={{ margin: "10px 0 12px", fontSize: "24px" }}>
                        Prevention. Support. Compassion.
                    </h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                        PawLove Rescue & Services exists to support pet owners in the Grant
                        Parish community by providing access to spay and neuter services,
                        vaccinations, and pet food assistance — helping families keep their
                        pets healthy, at home, and out of shelters, while preventing
                        unwanted litters.
                    </p>
                </section>

                <section className="grid" aria-label="Core service areas">
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
                            Helping prevent unwanted litters and reduce shelter intake through
                            accessible, affordable spay and neuter services.
                        </p>
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
                            Supporting basic care that keeps pets healthy and protected from
                            preventable diseases.
                        </p>
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
                            Helping families through tough weeks so pets can stay home and
                            well-fed.
                        </p>
                    </div>
                </section>
            </main>
            <Footer />

            <RequestHelpModal
                isOpen={showRequestHelp}
                onClose={() => setShowRequestHelp(false)}
            />
            <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} />
        </>
    );
}
