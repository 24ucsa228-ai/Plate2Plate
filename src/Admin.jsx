/* =========================================================
   ADMIN.JSX
   The admin side of Plate2Plate.

   Find things here:
   1. AdminLoginPage ........ separate login for admins
   2. AdminPage ............. dashboard with tabs:
        Overview ........... totals, status and category breakdown
        All listings ....... search, filter and remove any listing
        Reported ........... listings people reported (remove or dismiss)
        Users .............. every registered donor / recipient / admin
        Celebration plans .. "Celebrate by sharing" submissions

   How admin access works:
   - An admin is a normal user whose type is "admin" in the database.
   - Listings come from the same /food list the rest of the site uses.
   - Users and celebration plans come from /admin/... routes
     (see server/admin-routes.js). If those routes are not added yet,
     the page shows a notice and the other tabs still work.
   ========================================================= */

import { useState } from "react";
import { CATEGORIES, STATUS_STEPS, Empty, sumServings, shortDate, sameId } from "./Food.jsx";

/* =========================================================
   1. ADMIN LOGIN PAGE
   ========================================================= */

export function AdminLoginPage({ authForm, setAuth, submitAdminLogin, changePage }) {
  return (
    <section className="auth-page page-shell">
      <div className="auth-image">
        <img
          src="/images/login.jpg"
          alt="Community food sharing"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/food/placeholder.jpg";
          }}
        />

        <div>
          <p className="section-label">Admin area</p>
          <h2>Keep every listing and every request moving.</h2>
        </div>
      </div>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          submitAdminLogin();
        }}
      >
        <p className="section-label">Admin login</p>

        <h1>
          Admin <em>sign in.</em>
        </h1>

        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={authForm.email}
          onChange={setAuth("email")}
          placeholder="Enter your admin email"
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={authForm.password}
          onChange={setAuth("password")}
          placeholder="Enter your password"
        />

        <button type="submit" className="start-button full-button">
          Log in as admin
        </button>

        <button type="button" className="text-link" onClick={() => changePage("login")}>
          Not an admin? Go to the normal login
        </button>
      </form>
    </section>
  );
}

/* =========================================================
   2. ADMIN DASHBOARD
   ========================================================= */

const TABS = [
  ["overview", "Overview"],
  ["listings", "All listings"],
  ["reports", "Reported"],
  ["users", "Users"],
  ["celebrations", "Celebration plans"]
];

function StatusPill({ status, t }) {
  return (
    <span className={`admin-status admin-status-${status.toLowerCase()}`}>
      {t(`st_${status}`)}
    </span>
  );
}

// Small table wrapper so wide tables scroll sideways on phones.
function Table({ head, children }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {head.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminPage({
  user,
  foodList,
  adminUsers,
  adminContributions,
  adminNote,
  refreshAdmin,
  deleteAnyListing,
  dismissReport,
  pickupText,
  t,
  changePage
}) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // This only hides the page. The server also checks that the caller is an admin.
  if (!user || user.type !== "admin")
    return (
      <section className="form-page page-shell">
        <div className="form-intro-block">
          <p className="section-label">Admins only</p>
          <h1>
            This area is <em>restricted.</em>
          </h1>
          <p>Log in with an admin account to see the admin dashboard.</p>

          <div className="hero-buttons">
            <button className="primary-button" onClick={() => changePage("adminLogin")}>
              Admin login
            </button>
            <button className="outline-button" onClick={() => changePage("home")}>
              Back to home
            </button>
          </div>
        </div>
      </section>
    );

  /* ---------- numbers ---------- */

  const now = Date.now();
  const isExpired = (f) =>
    f.status === "AVAILABLE" && (f.pickupEnd < now || f.safeUntil < now);

  const reported = foodList.filter((f) => f.reported);
  const open = foodList.filter((f) => f.status === "AVAILABLE" && !isExpired(f));
  const expired = foodList.filter(isExpired);
  const inProgress = foodList.filter(
    (f) => f.status === "REQUESTED" || f.status === "CONFIRMED"
  );
  const collected = foodList.filter((f) => f.status === "COLLECTED");

  const stats = [
    ["Total listings", foodList.length],
    ["Open for pickup", open.length],
    ["Requests in progress", inProgress.length],
    ["Collected", collected.length],
    ["Servings shared", sumServings(collected)],
    ["Servings waiting", sumServings(open)],
    ["Reported listings", reported.length],
    ["Registered users", adminUsers ? adminUsers.length : "n/a"]
  ];

  const byStatus = STATUS_STEPS.map((status) => [
    status,
    foodList.filter((f) => f.status === status).length
  ]);
  const biggest = Math.max(1, ...byStatus.map(([, count]) => count));

  /* ---------- filtered listings tab ---------- */

  const query = search.trim().toLowerCase();
  const shownListings = foodList.filter((f) => {
    if (statusFilter === "Reported" && !f.reported) return false;
    if (statusFilter === "Expired" && !isExpired(f)) return false;
    if (STATUS_STEPS.includes(statusFilter) && f.status !== statusFilter) return false;

    return (
      !query ||
      [f.name, f.category, f.location, f.source, f.ownerEmail]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  });

  const joined = (u) => (u.created_at ? shortDate(new Date(u.created_at).getTime()) : "n/a");

  /* ---------- tab contents ---------- */

  const overview = (
    <>
      <div className="dashboard-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-panel">
        <p className="section-label">Listings by status</p>

        <div className="admin-bars">
          {byStatus.map(([status, count]) => (
            <div key={status} className="admin-bar-row">
              <span>{t(`st_${status}`)}</span>
              <div className="admin-bar-track">
                <div
                  className="admin-bar-fill"
                  style={{ width: `${(count / biggest) * 100}%` }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        {expired.length > 0 && (
          <p className="dashboard-note admin-expired-note">
            {expired.length} open {expired.length === 1 ? "listing has" : "listings have"}{" "}
            passed {expired.length === 1 ? "its" : "their"} pickup window or safe-until
            time and are hidden from recipients.
          </p>
        )}
      </div>

      <div className="dashboard-panel">
        <p className="section-label">Listings by category</p>

        <Table head={["Category", "Listings", "Servings listed", "Collected"]}>
          {CATEGORIES.map((name) => {
            const inCategory = foodList.filter((f) => f.category === name);

            return (
              <tr key={name}>
                <td>{name}</td>
                <td>{inCategory.length}</td>
                <td>{sumServings(inCategory)}</td>
                <td>{inCategory.filter((f) => f.status === "COLLECTED").length}</td>
              </tr>
            );
          })}
        </Table>
      </div>
    </>
  );

  const listings = (
    <div className="dashboard-panel">
      <div className="search-bar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by food, category, area or donor..."
          aria-label="Search listings"
        />
        <span>{shownListings.length} shown</span>
      </div>

      <div className="filter-buttons">
        {["All", ...STATUS_STEPS, "Expired", "Reported"].map((name) => (
          <button
            key={name}
            className={statusFilter === name ? "filter-active" : ""}
            onClick={() => setStatusFilter(name)}
          >
            {STATUS_STEPS.includes(name) ? t(`st_${name}`) : name}
          </button>
        ))}
      </div>

      {shownListings.length ? (
        <Table head={["Food", "Category", "Donor", "Area", "Servings", "Pickup", "Status", ""]}>
          {shownListings.map((food) => (
            <tr key={food.id}>
              <td>
                <strong>{food.name}</strong>
                {food.reported && <span className="admin-flag">Reported</span>}
              </td>
              <td>{food.category}</td>
              <td>{food.source}</td>
              <td>{food.location}</td>
              <td>{food.servings}</td>
              <td>{pickupText(food)}</td>
              <td>
                <StatusPill status={food.status} t={t} />
              </td>
              <td>
                <button className="outline-button" onClick={() => deleteAnyListing(food)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty title="No listings match." text="Try another word or filter." />
      )}
    </div>
  );

  const reports = (
    <div className="dashboard-panel">
      <p className="section-label">Reported listings</p>

      {reported.length ? (
        <div className="activity-list">
          {reported.map((food) => (
            <div key={food.id} className="activity-row">
              <div className="activity-main">
                <strong>{food.name}</strong>
                <p>
                  {food.category}, {food.location}. Donated by {food.source}.{" "}
                  {pickupText(food)}
                </p>
                <p>{food.description}</p>
              </div>

              <div className="activity-actions">
                <button className="outline-button" onClick={() => dismissReport(food)}>
                  Dismiss report
                </button>
                <button className="primary-button" onClick={() => deleteAnyListing(food)}>
                  Remove listing
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Nothing reported."
          text="When someone reports a listing from its details page, it appears here."
        />
      )}
    </div>
  );

  const users = (
    <div className="dashboard-panel">
      <p className="section-label">Registered users</p>

      {adminUsers ? (
        <Table head={["Name", "Email", "Role", "Listings", "Requests", "Joined"]}>
          {adminUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.type}</td>
              <td>{foodList.filter((f) => sameId(f.ownerId, u.id)).length}</td>
              <td>{foodList.filter((f) => sameId(f.requestedById, u.id)).length}</td>
              <td>{joined(u)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty
          title="User list not available."
          text="Add the admin routes on the server (server/admin-routes.js), then press Refresh data."
        />
      )}
    </div>
  );

  const celebrations = (
    <div className="dashboard-panel">
      <p className="section-label">Celebration plans</p>

      {adminContributions ? (
        adminContributions.length ? (
          <Table head={["Name", "Email", "Occasion", "Date", "Sharing", "Serves", "Message"]}>
            {adminContributions.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.occasion}</td>
                <td>{c.contribution_date || c.date || "n/a"}</td>
                <td>{c.share || "n/a"}</td>
                <td>{c.servings || "n/a"}</td>
                <td>{c.message || "n/a"}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No plans yet."
            text="Submissions from the Celebrate by sharing page appear here."
          />
        )
      ) : (
        <Empty
          title="Celebration plans not available."
          text="Add the admin routes on the server (server/admin-routes.js), then press Refresh data."
        />
      )}
    </div>
  );

  const content = { overview, listings, reports, users, celebrations }[tab];

  return (
    <section className="dashboard admin-page page-shell">
      <div className="dashboard-header">
        <div>
          <p className="section-label">Admin dashboard</p>

          <h1>
            Welcome, <em>{user.name}.</em>
          </h1>

          <p>See everything on the board and remove anything that should not be there.</p>
        </div>

        <button className="start-button" onClick={refreshAdmin}>
          Refresh data
        </button>
      </div>

      {adminNote && <p className="admin-notice">{adminNote}</p>}

      <div className="filter-buttons admin-tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "filter-active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
            {key === "reports" && reported.length > 0 ? ` (${reported.length})` : ""}
          </button>
        ))}
      </div>

      {content}
    </section>
  );
}
