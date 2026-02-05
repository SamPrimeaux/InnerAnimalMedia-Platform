import { useState } from "react";
import type { Route } from "./+types/adopt";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Adopt a Pet - PawLove Rescue & Services" },
        {
            name: "description",
            content:
                "Find your new best friend! Browse adoptable dogs and cats in Grant Parish looking for loving homes.",
        },
    ];
}

interface Pet {
    id: number;
    name: string;
    type: string;
    breed: string;
    age: string;
    gender: string;
    image: string;
    description: string;
    status: "available" | "pending" | "adopted";
}

const SAMPLE_PETS: Pet[] = [
    {
        id: 1,
        name: "Luna",
        type: "Dog",
        breed: "Labrador Mix",
        age: "2 years",
        gender: "Female",
        image:
            "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&q=80",
        description:
            "Luna is a sweet, energetic girl who loves to play fetch and cuddle. She's great with kids and other dogs!",
        status: "available",
    },
    {
        id: 2,
        name: "Max",
        type: "Dog",
        breed: "German Shepherd Mix",
        age: "3 years",
        gender: "Male",
        image:
            "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&h=600&fit=crop&q=80",
        description:
            "Max is a loyal and protective companion. He's well-trained and would make an excellent family dog.",
        status: "available",
    },
    {
        id: 3,
        name: "Whiskers",
        type: "Cat",
        breed: "Domestic Shorthair",
        age: "1 year",
        gender: "Male",
        image:
            "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop&q=80",
        description:
            "Whiskers is a playful kitten who loves to chase toys and nap in sunny spots. Perfect for any home!",
        status: "available",
    },
    {
        id: 4,
        name: "Bella",
        type: "Dog",
        breed: "Beagle Mix",
        age: "4 years",
        gender: "Female",
        image:
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=600&fit=crop&q=80",
        description:
            "Bella is a gentle soul who loves long walks and belly rubs. She's calm and perfect for a quiet home.",
        status: "available",
    },
    {
        id: 5,
        name: "Mittens",
        type: "Cat",
        breed: "Calico",
        age: "5 years",
        gender: "Female",
        image:
            "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600&h=600&fit=crop&q=80",
        description:
            "Mittens is an independent lady who enjoys her space but loves a good head scratch. Low maintenance and sweet!",
        status: "available",
    },
    {
        id: 6,
        name: "Rocky",
        type: "Dog",
        breed: "Pit Bull Mix",
        age: "2 years",
        gender: "Male",
        image:
            "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=600&fit=crop&q=80",
        description:
            "Rocky is a big softie who loves everyone he meets. He's energetic and needs an active family!",
        status: "available",
    },
];

export default function Adopt() {
    const [filter, setFilter] = useState<"all" | "dog" | "cat">("all");
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    const filteredPets =
        filter === "all"
            ? SAMPLE_PETS
            : SAMPLE_PETS.filter(
                (pet) => pet.type.toLowerCase() === filter.toLowerCase()
            );

    return (
        <>
            <Header />
            <main className="container">
                <section style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div className="badge" style={{ marginBottom: "16px" }}>
                        <span className="dot"></span> Find your new best friend
                    </div>
                    <h1 className="h1" style={{ marginBottom: "16px" }}>
                        Adopt a Pet
                    </h1>
                    <p className="lead" style={{ maxWidth: "700px", margin: "0 auto" }}>
                        These wonderful animals are looking for loving homes in Grant Parish.
                        All pets are spayed/neutered, vaccinated, and ready for adoption.
                    </p>
                </section>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "12px",
                        marginBottom: "40px",
                    }}
                >
                    <button
                        className="button"
                        onClick={() => setFilter("all")}
                        style={{
                            background:
                                filter === "all"
                                    ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                                    : "var(--surface)",
                            color: filter === "all" ? "white" : "var(--text)",
                            border: filter === "all" ? "none" : "2px solid var(--border)",
                        }}
                    >
                        All Pets
                    </button>
                    <button
                        className="button"
                        onClick={() => setFilter("dog")}
                        style={{
                            background:
                                filter === "dog"
                                    ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                                    : "var(--surface)",
                            color: filter === "dog" ? "white" : "var(--text)",
                            border: filter === "dog" ? "none" : "2px solid var(--border)",
                        }}
                    >
                        🐕 Dogs
                    </button>
                    <button
                        className="button"
                        onClick={() => setFilter("cat")}
                        style={{
                            background:
                                filter === "cat"
                                    ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                                    : "var(--surface)",
                            color: filter === "cat" ? "white" : "var(--text)",
                            border: filter === "cat" ? "none" : "2px solid var(--border)",
                        }}
                    >
                        🐈 Cats
                    </button>
                </div>

                <section className="grid">
                    {filteredPets.map((pet) => (
                        <div key={pet.id} className="card">
                            <div className="card-image">
                                <img src={pet.image} alt={pet.name} loading="lazy" />
                            </div>
                            <div style={{ padding: "20px" }}>
                                <h3 style={{ margin: "0 0 8px" }}>{pet.name}</h3>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginBottom: "12px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span className="chip">{pet.breed}</span>
                                    <span className="chip">{pet.age}</span>
                                    <span className="chip">{pet.gender}</span>
                                </div>
                                <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
                                    {pet.description}
                                </p>
                                <button
                                    className="button primary"
                                    style={{ width: "100%" }}
                                    onClick={() => setSelectedPet(pet)}
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                {filteredPets.length === 0 && (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <p style={{ color: "var(--muted)", fontSize: "18px" }}>
                            No pets found in this category.
                        </p>
                    </div>
                )}
            </main>
            <Footer />

            {selectedPet && (
                <div className="modal-overlay" onClick={() => setSelectedPet(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Meet {selectedPet.name}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setSelectedPet(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <img
                                src={selectedPet.image}
                                alt={selectedPet.name}
                                style={{
                                    width: "100%",
                                    borderRadius: "12px",
                                    marginBottom: "16px",
                                }}
                            />

                            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                <span className="chip">{selectedPet.type}</span>
                                <span className="chip">{selectedPet.breed}</span>
                                <span className="chip">{selectedPet.age}</span>
                                <span className="chip">{selectedPet.gender}</span>
                            </div>

                            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                                {selectedPet.description}
                            </p>
                        </div>

                        <div
                            className="glass"
                            style={{ padding: "16px", marginBottom: "24px" }}
                        >
                            <h4 style={{ marginBottom: "12px", fontSize: "16px" }}>
                                Adoption Information
                            </h4>
                            <ul
                                style={{
                                    color: "var(--muted)",
                                    fontSize: "14px",
                                    lineHeight: 1.8,
                                    paddingLeft: "20px",
                                }}
                            >
                                <li>All pets are spayed/neutered</li>
                                <li>Up-to-date on vaccinations</li>
                                <li>Microchipped for safety</li>
                                <li>Adoption fee includes initial vet visit</li>
                            </ul>
                        </div>

                        <a
                            href="mailto:Pawlove2025forever@gmail.com?subject=Adoption Inquiry for {selectedPet.name}"
                            className="button primary"
                            style={{ width: "100%", textAlign: "center" }}
                        >
                            Contact Us About {selectedPet.name}
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}
