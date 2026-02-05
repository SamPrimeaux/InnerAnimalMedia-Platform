import type { Route } from "./+types/about";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "About Us - PawLove Rescue & Services" },
        {
            name: "description",
            content:
                "Learn about PawLove Rescue & Services and our mission to keep pets and families together in Grant Parish.",
        },
    ];
}

export default function About() {
    return (
        <>
            <Header />
            <main className="container">
                <section style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div className="badge" style={{ marginBottom: "16px" }}>
                        <span className="dot"></span> Our Story
                    </div>
                    <h1 className="h1" style={{ marginBottom: "16px" }}>
                        About PawLove
                    </h1>
                    <p className="lead" style={{ maxWidth: "700px", margin: "0 auto" }}>
                        Dedicated to keeping pets and families together through compassionate
                        support and preventive care.
                    </p>
                </section>

                <section className="glass" style={{ marginBottom: "40px" }}>
                    <h2 style={{ marginBottom: "16px" }}>Our Mission</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "16px" }}>
                        PawLove Rescue & Services exists to support pet owners in the Grant
                        Parish community by providing access to spay and neuter services,
                        vaccinations, and pet food assistance — helping families keep their
                        pets healthy, at home, and out of shelters, while preventing unwanted
                        litters.
                    </p>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                        We believe that with the right support, families can keep their beloved
                        pets. Our prevention-first approach addresses the root causes of pet
                        surrender and helps build a stronger, more compassionate community.
                    </p>
                </section>

                <section className="grid">
                    <div className="glass">
                        <div className="kicker">Prevention First</div>
                        <h3 style={{ margin: "10px 0 12px" }}>Spay & Neuter</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            We help prevent unwanted litters through accessible spay and neuter
                            services, reducing the number of animals entering shelters.
                        </p>
                    </div>

                    <div className="glass">
                        <div className="kicker">Health & Wellness</div>
                        <h3 style={{ margin: "10px 0 12px" }}>Vaccinations</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            Supporting basic preventive care that keeps pets healthy and
                            protected from preventable diseases.
                        </p>
                    </div>

                    <div className="glass">
                        <div className="kicker">Family Support</div>
                        <h3 style={{ margin: "10px 0 12px" }}>Food Assistance</h3>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                            Helping families through difficult times so pets can stay home and
                            well-fed, preventing surrender due to financial hardship.
                        </p>
                    </div>
                </section>

                <section className="glass" style={{ marginTop: "40px" }}>
                    <h2 style={{ marginBottom: "16px" }}>501(c)(3) Nonprofit</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "12px" }}>
                        PawLove Rescue & Services is a registered 501(c)(3) nonprofit
                        organization. All donations are tax-deductible.
                    </p>
                    <div className="chips">
                        <span className="chip">EIN: 93-2791656</span>
                        <span className="chip">Established 2025</span>
                        <span className="chip">Serving Grant Parish</span>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
