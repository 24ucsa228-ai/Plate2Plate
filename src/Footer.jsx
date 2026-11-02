/* =========================================================
   FOOTER.JSX
   The footer at the bottom of every page.
   ========================================================= */

import { DISCLAIMER } from "./Food.jsx";

export function Footer({ changePage, goToSection, t, user }) {
  return (
    <footer className="footer">
      <div>
        <button className="brand-logo footer-logo" onClick={() => changePage("home")}>
          <span>plate</span>
          <em>2</em>
          <span>plate</span>
        </button>
        <p>
          Connecting surplus food in Chennai with the people and
          community kitchens who can use it.
        </p>
      </div>

      <div>
        <span>Explore</span>
        <button onClick={() => changePage("available")}>{t("available")}</button>
        <button onClick={() => goToSection("how-it-works", "how")}>{t("how")}</button>
        <button onClick={() => changePage("who")}>Who it's for</button>
        <button onClick={() => goToSection("faq")}>{t("faq")}</button>
      </div>

      <div>
        <span>Plate2Plate</span>
        <button onClick={() => goToSection("about", "about")}>{t("about")}</button>
        <button onClick={() => changePage("safety")}>{t("safety")}</button>
        <button onClick={() => changePage("contribution")}>Celebrate by sharing</button>
        <button onClick={() => changePage("register")}>{t("start")}</button>
        {(!user || user.type === "admin") && (
          <button onClick={() => changePage(user ? "admin" : "adminLogin")}>
            {user ? "Admin panel" : "Admin login"}
          </button>
        )}
      </div>

      <p className="footer-disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
