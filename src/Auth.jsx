/* =========================================================
   AUTH.JSX
   Log in and Create account pages, plus the "Log in to
   continue" prompt shown on Donate and Dashboard when
   nobody is logged in.
   (Accounts are stored in the database; App.jsx talks to it through the API.)
   ========================================================= */

export const EMPTY_AUTH = { name: "", email: "", password: "" };

/* ---------- "Log in to continue" prompt ---------- */

export function LoginPrompt({ message, changePage }) {
  return (
    <section className="form-page page-shell">
      <div className="form-intro-block">
        <p className="section-label">Login needed</p>
        <h1>
          Log in to <em>continue.</em>
        </h1>
        <p>{message}</p>

        <div className="hero-buttons">
          <button className="primary-button" onClick={() => changePage("login")}>
            Log in
          </button>
          <button className="outline-button" onClick={() => changePage("register")}>
            Create account
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Login (register = false) and Register (register = true) ---------- */

export function AuthPage({
  register,
  authForm,
  setAuth,
  accountType,
  setAccountType,
  submitAuth,
  changePage
}) {
  return (
    <section className="auth-page page-shell">
      <div className="auth-image">
        <img
          src={register ? "/images/signup.jpg" : "/images/login.jpg"}
          alt="Community food sharing"
          onError={(e) => {
            e.currentTarget.src = "/images/food/placeholder.jpg";
          }}
        />

        <div>
          <p className="section-label">
            {register ? "Join Plate2Plate" : "Welcome back"}
          </p>

          <h2>
            {register
              ? "Your spare food could be someone's next meal."
              : "Good food is waiting for a home."}
          </h2>
        </div>
      </div>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          submitAuth(register);
        }}
      >
        <p className="section-label">{register ? "Create account" : "Log in"}</p>

        <h1>
          {register ? (
            <>
              Get <em>started.</em>
            </>
          ) : (
            <>
              Welcome <em>back.</em>
            </>
          )}
        </h1>

        {register && (
          <>
            <label>Full name</label>
            <input
              value={authForm.name}
              onChange={setAuth("name")}
              placeholder="Enter your name"
            />
          </>
        )}

        <label>Email</label>
        <input
          type="email"
          value={authForm.email}
          onChange={setAuth("email")}
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          value={authForm.password}
          onChange={setAuth("password")}
          placeholder={register ? "At least 6 characters" : "Enter your password"}
        />

        {register && (
          <>
            <label>I am a</label>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="donor">Donor: I have food to share</option>
              <option value="recipient">Recipient: I collect for myself or a group</option>
            </select>
          </>
        )}

        <button type="submit" className="start-button full-button">
          {register ? "Create account" : "Log in"}
        </button>

        <button
          type="button"
          className="text-link"
          onClick={() => changePage(register ? "login" : "register")}
        >
          {register
            ? "Already have an account? Log in"
            : "New here? Create an account"}
        </button>
      </form>
    </section>
  );
}
