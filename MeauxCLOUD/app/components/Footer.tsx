import { Link } from "react-router";

export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="brand">
                        <img
                            alt="PawLove logo"
                            src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/111a8e16-4a71-48a3-754b-2b950780a300/avatar"
                        />
                        <div>
                            <div className="name">PawLove Rescue & Services</div>
                            <div className="tag">Established 2025 · Saving Lives Since 2014</div>
                        </div>
                    </div>
                    <p>
                        Supporting Grant Parish pet owners with spay/neuter, vaccinations,
                        and pet food assistance.
                    </p>
                </div>

                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/about">About</Link>
                        </li>
                        <li>
                            <Link to="/services">Services</Link>
                        </li>
                        <li>
                            <Link to="/adopt">Adopt</Link>
                        </li>
                        <li>
                            <Link to="/donate">Donate</Link>
                        </li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Contact</h4>
                    <ul>
                        <li>
                            <a href="mailto:Pawlove2025forever@gmail.com">
                                Pawlove2025forever@gmail.com
                            </a>
                        </li>
                        <li style={{ color: "rgba(255,255,255,.6)", fontSize: "13px" }}>
                            P.O. Box 102
                            <br />
                            Dry Prong, LA 71423
                        </li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Nonprofit</h4>
                    <ul>
                        <li style={{ color: "rgba(255,255,255,.6)", fontSize: "13px" }}>
                            501(c)(3) Organization
                        </li>
                        <li style={{ color: "rgba(255,255,255,.6)", fontSize: "13px" }}>
                            EIN: 93-2791656
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div style={{ maxWidth: "1280px", margin: "0 auto", width: "94vw" }}>
                    <p>
                        © 2025 PawLove Rescue & Services. All rights reserved.
                        <br />
                        <small>Built with ❤️ by Inner Animal Media</small>
                    </p>
                </div>
            </div>
        </footer>
    );
}
