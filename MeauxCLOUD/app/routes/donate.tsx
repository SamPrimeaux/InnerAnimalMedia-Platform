import { useState } from "react";
import type { Route } from "./+types/donate";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { DonateModal } from "../components/DonateModal";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Donate - PawLove Rescue & Services" },
        {
            name: "description",
            content:
                "Support PawLove Rescue & Services and help us keep pets and families together in Grant Parish.",
        },
    ];
}

export default function Donate() {
    const [showDonate, setShowDonate] = useState(false);

    return (
        <>
            <Header />
            <main className="container">
                <section style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div className="badge" style={{ marginBottom: "16px" }}>
                        <span className="dot"></span> Make a Difference
                    </div>
                    <h1 className="h1" style={{ marginBottom: "16px" }}>
                        Support Our Mission
                    </h1>
                    <p className="lead" style={{ maxWidth: "700px", margin: "0 auto 24px" }}>
                        Your donation helps us provide essential services to Grant Parish
                        families, keeping pets healthy and at home.
                    </p>
                    <button className="button primary" onClick={() => setShowDonate(true)}>
                        Donate Now
                    </button>
                </section>

                <section className="grid">
                    <div className="glass">
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>💉</div>
                        <h3 style={{ marginBottom: "12px" }}>$25</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            Provides basic vaccinations for one pet, protecting them from
                            preventable diseases.
                        </p>
                    </div>

                    <div className="glass">
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🍖</div>
                        <h3 style={{ marginBottom: "12px" }}>$50</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            Supplies a month of pet food for a family in need, keeping pets fed
                            and at home.
                        </p>
                    </div>

                    <div className="glass">
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏥</div>
                        <h3 style={{ marginBottom: "12px" }}>$100</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            Covers spay/neuter services for one pet, preventing unwanted litters
                            and reducing shelter intake.
                        </p>
                    </div>
                </section>

                <section className="glass" style={{ marginTop: "40px" }}>
                    <h2 style={{ marginBottom: "16px" }}>Why Your Donation Matters</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "16px" }}>
                        Every dollar you donate goes directly to helping Grant Parish families
                        care for their pets. Your support enables us to:
                    </p>
                    <ul
                        style={{
                            color: "var(--muted)",
                            lineHeight: 1.8,
                            paddingLeft: "20px",
                            marginBottom: "24px",
                        }}
                    >
                        <li>Provide affordable spay and neuter services</li>
                        <li>Support vaccination programs for pet health</li>
                        <li>Offer emergency pet food assistance to families in need</li>
                        <li>Prevent pet surrender and reduce shelter overcrowding</li>
                        <li>Build a more compassionate community for all animals</li>
                    </ul>
                    <button className="button primary" onClick={() => setShowDonate(true)}>
                        Make Your Donation
                    </button>
                </section>

                <section className="glass" style={{ marginTop: "40px" }}>
                    <h2 style={{ marginBottom: "16px" }}>Tax-Deductible Giving</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "12px" }}>
                        PawLove Rescue & Services is a registered 501(c)(3) nonprofit
                        organization. All donations are tax-deductible to the fullest extent
                        allowed by law.
                    </p>
                    <div className="chips">
                        <span className="chip">501(c)(3) Organization</span>
                        <span className="chip">EIN: 93-2791656</span>
                        <span className="chip">Tax-Deductible</span>
                    </div>
                </section>

                <section style={{ textAlign: "center", marginTop: "60px" }}>
                    <h2 style={{ marginBottom: "16px" }}>Other Ways to Help</h2>
                    <p
                        style={{
                            color: "var(--muted)",
                            lineHeight: 1.7,
                            maxWidth: "700px",
                            margin: "0 auto 24px",
                        }}
                    >
                        Can't donate right now? You can still help by volunteering, fostering,
                        or spreading the word about our mission in Grant Parish.
                    </p>
                    <a
                        href="mailto:Pawlove2025forever@gmail.com?subject=Volunteer Inquiry"
                        className="button"
                    >
                        Contact Us to Volunteer
                    </a>
                </section>
            </main>
            <Footer />

            <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} />
        </>
    );
}
