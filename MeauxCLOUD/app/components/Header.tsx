import { Link } from "react-router";

export function Header() {
    return (
        <header className="header-wrap">
            <nav className="nav">
                <Link className="brand" to="/" aria-label="PawLove home">
                    <img
                        alt="PawLove logo"
                        src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/111a8e16-4a71-48a3-754b-2b950780a300/avatar"
                    />
                    <div>
                        <div className="name">PawLove Rescue & Services</div>
                        <div className="tag">Established 2025 · Saving Lives Since 2014</div>
                    </div>
                </Link>

                <div className="links" aria-label="Primary navigation">
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/adopt">Adopt</Link>
                    <Link to="/donate">Donate</Link>
                </div>
            </nav>
        </header>
    );
}
