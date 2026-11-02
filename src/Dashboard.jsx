/* =========================================================
   DASHBOARD.JSX
   "My dashboard": stats, updates, your listings (donor) and
   your requests (recipient), with confirm / collect / cancel /
   edit / delete / rate buttons.
   ========================================================= */

import { NEXT_LABEL, StatusSteps, Empty, sumServings, clock, sameId } from "./Food.jsx";
import { LoginPrompt } from "./Auth.jsx";

/* ---------- One row in a listings or requests list ---------- */

function ActivityRow({ food, t, pickup, onNext, onCancel, onEdit, onDelete, onRate }) {
  return (
    <div className="activity-row">
      <div className="activity-main">
        <strong>{food.name}</strong>
        <p>
          {food.location}, {pickup}
          {food.requestedServings ? `. ${food.requestedServings} servings requested` : ""}
        </p>
        <StatusSteps status={food.status} t={t} />

        {onRate && food.status === "COLLECTED" && (
          <div className="rating-row">
            {food.rating ? (
              <p>
                You said the food was {food.rating === "yes" ? "" : "not "}as
                described. Thank you.
              </p>
            ) : (
              <>
                <p>Was the food as described?</p>
                <button className="outline-button" onClick={() => onRate(food, "yes")}>
                  Yes
                </button>
                <button className="outline-button" onClick={() => onRate(food, "no")}>
                  No
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="activity-actions">
        {NEXT_LABEL[food.status] && (
          <button className="primary-button" onClick={() => onNext(food)}>
            {NEXT_LABEL[food.status]}
          </button>
        )}

        {onCancel && food.status === "REQUESTED" && (
          <button className="outline-button" onClick={() => onCancel(food)}>
            Cancel request
          </button>
        )}

        {onEdit && food.status === "AVAILABLE" && (
          <button className="outline-button" onClick={() => onEdit(food)}>
            Edit
          </button>
        )}

        {onDelete && food.status === "AVAILABLE" && (
          <button className="outline-button" onClick={() => onDelete(food)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Dashboard page ---------- */

export function DashboardPage({
  user,
  foodList,
  notes,
  clearNotes,
  t,
  pickupText,
  dayWord,
  moveStatus,
  startEdit,
  deleteListing,
  cancelRequest,
  rateFood,
  changePage
}) {
  if (!user)
    return (
      <LoginPrompt
        message="Log in to see your listings and requests."
        changePage={changePage}
      />
    );

  const isDonor = user.type === "donor";
  const myListings = foodList.filter((f) => sameId(f.ownerId, user.id));
  const myRequests = foodList.filter((f) => sameId(f.requestedById, user.id));
  const receivedFood = myRequests.filter((f) => f.status === "COLLECTED");
  const myNotes = notes.slice(0, 6);

  const stats = isDonor
    ? [
        ["Listings posted", myListings.length],
        ["Servings offered", sumServings(myListings)],
        ["Waiting for you to confirm", myListings.filter((f) => f.status === "REQUESTED").length],
        ["Collected", myListings.filter((f) => f.status === "COLLECTED").length]
      ]
    : [
        ["Requests made", myRequests.length],
        ["In progress", myRequests.length - receivedFood.length],
        ["Collected", receivedFood.length],
        ["Servings received", sumServings(receivedFood)]
      ];

  const updatesPanel = (
    <div className="dashboard-panel">
      <div className="panel-head">
        <p className="section-label">Updates</p>
        {myNotes.length > 0 && (
          <button className="text-link" onClick={clearNotes}>
            Clear updates
          </button>
        )}
      </div>

      {myNotes.length ? (
        <ul className="note-list">
          {myNotes.map((n) => (
            <li key={n.id}>
              <span>{n.text}</span>
              <time>
                {dayWord(n.at)}, {clock(n.at)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-note">
          No updates yet. When a request is made, confirmed or collected, it
          will appear here.
        </p>
      )}
    </div>
  );

  const listingsPanel = (
    <div className="dashboard-panel">
      <p className="section-label">Your listings</p>

      {myListings.length ? (
        <div className="activity-list">
          {myListings.map((food) => (
            <ActivityRow
              key={food.id}
              food={food}
              t={t}
              pickup={pickupText(food)}
              onNext={moveStatus}
              onEdit={startEdit}
              onDelete={deleteListing}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="You haven't listed anything yet."
          text="Food you list will show up here with its request status."
          actionLabel="List your first food"
          onAction={() => changePage("donate")}
        />
      )}
    </div>
  );

  const requestsPanel = (
    <div className="dashboard-panel">
      <p className="section-label">Your requests</p>

      {myRequests.length ? (
        <div className="activity-list">
          {myRequests.map((food) => (
            <ActivityRow
              key={food.id}
              food={food}
              t={t}
              pickup={pickupText(food)}
              onNext={moveStatus}
              onCancel={cancelRequest}
              onRate={rateFood}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No requests yet."
          text="Open any listing and request it. You can follow it here."
          actionLabel="Find food"
          onAction={() => changePage("available")}
        />
      )}
    </div>
  );

  return (
    <section className="dashboard page-shell">
      <div className="dashboard-header">
        <div>
          <p className="section-label">
            {isDonor ? "Donor" : "Recipient"} dashboard
          </p>

          <h1>
            Welcome, <em>{user.name}.</em>
          </h1>

          <p>
            {isDonor
              ? "See who has asked for your food and move each request along."
              : "Follow your requests from Requested to Collected."}
          </p>
        </div>

        <button
          className="start-button"
          onClick={() => changePage(isDonor ? "donate" : "available")}
        >
          {isDonor ? t("listFood") : t("find")}
        </button>
      </div>

      <div className="dashboard-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {updatesPanel}

      <p className="dashboard-note">
        Try it out: in real use the donor confirms a request and the
        recipient collects. Here you can step through both sides yourself.
      </p>

      {isDonor ? listingsPanel : requestsPanel}
      {isDonor ? requestsPanel : listingsPanel}
    </section>
  );
}
