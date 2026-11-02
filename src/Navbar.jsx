/* =========================================================
   NAVBAR.JSX
   The top bar: nav links, login / profile buttons, logo.
   Admins get an "Admin panel" profile button instead of "My dashboard".
   ========================================================= */

export function Navbar({ activeNav, user, changePage, goToSection, logOut }) {
  const isAdmin = user?.type === "admin";

  return (
    <nav className="navbar">
      <div className="nav-links">
        {[
          ["home", "HOME"],
          ["about", "ABOUT"],
          ["how", "HOW IT WORKS"],
          ["available", "AVAILABLE FOOD"],
          ["impact", "OUR IMPACT"]
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeNav === key ? "nav-active" : ""}
            onClick={() => {
              if (key === "home" || key === "available") {
                changePage(key);
              } else {
                goToSection(
                  {
                    how: "how-it-works",
                    impact: "impact",
                    about: "about"
                  }[key],
                  key
                );
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="logo-area">
        <button
          className="brand-logo"
          onClick={() => changePage("home")}
          aria-label="Plate2Plate Home"
        >
          <span>plate</span>
          <em>2</em>
          <span>plate</span>
        </button>
      </div>

      <div className="nav-actions">
        {user ? (
          <button className="start-button logout-button" onClick={logOut}>
            LOG OUT
          </button>
        ) : (
          <>
            <button
              className={`login-button ${activeNav === "login" ? "nav-active" : ""}`}
              onClick={() => changePage("login")}
            >
              LOGIN
            </button>

            <button className="start-button" onClick={() => changePage("register")}>
              GET STARTED
            </button>
          </>
        )}

        <button
          className={`profile-button ${user ? "signed-in" : ""} ${
            activeNav === "dashboard" || activeNav === "admin" ? "nav-active" : ""
          }`}
          onClick={() => changePage(user ? (isAdmin ? "admin" : "dashboard") : "login")}
          aria-label={
            user
              ? `Signed in as ${user.name}. Open ${isAdmin ? "the admin panel" : "my dashboard"}`
              : "Log in"
          }
          title={user ? `${user.name} (${user.email})` : "Log in"}
        >
          {user ? (
            <>
              <span className="profile-avatar">
                {(user.name || user.email || "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="profile-meta">
                <span className="profile-name">
                  {(user.name || user.email).trim().split(" ")[0]}
                </span>
                <span className="profile-sub">
                  {isAdmin ? "Admin panel" : "My dashboard"}
                </span>
              </span>
            </>
          ) : (
            <span className="profile-avatar">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
