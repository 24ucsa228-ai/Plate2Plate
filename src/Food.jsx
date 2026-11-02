/* =========================================================
   FOOD.JSX
   Everything about food listings.

   Find things here:
   1. CONSTANTS ............. categories, areas, status steps, sorts
   2. SAFETY TEXT ........... checklist, guides, tips, disclaimer
   (Listings themselves come from the database through the API in App.jsx.)
   4. HELPERS ............... time text, map link, sumServings, options
   5. SMALL COMPONENTS ...... StatusSteps, Empty, FoodCard
   6. AvailablePage ......... "Available food" page (search, filters)
   7. DetailsPage ........... single food page and request button
   ========================================================= */

/* =========================================================
   1. CONSTANTS
   ========================================================= */

export const HOUR = 3600000;
export const DAY = 86400000;
export const NEAR_KM = 8;

export const CATEGORIES = [
  "Prepared Meals",
  "Bakery",
  "Fruits & Vegetables",
  "Packaged Food",
  "Dairy & Beverages",
  "Groceries"
];

export const CATEGORY_IMAGES = {
  "Prepared Meals": "/images/food/meals.jpg",
  Bakery: "/images/food/bakery.jpg",
  "Fruits & Vegetables": "/images/food/fruits.jpg",
  "Packaged Food": "/images/food/packaged.jpg",
  "Dairy & Beverages": "/images/food/dairy.jpg",
  Groceries: "/images/food/grocery.jpg"
};

// Approximate coordinates, used only for the "near" filter and sorting.
export const AREAS = {
  Adyar: [13.0012, 80.2565],
  "Anna Nagar": [13.085, 80.2101],
  Ambattur: [13.1143, 80.1548],
  "Besant Nagar": [13.0003, 80.2667],
  Chromepet: [12.9516, 80.1462],
  Egmore: [13.0732, 80.2609],
  Guindy: [13.0067, 80.2206],
  Kodambakkam: [13.0521, 80.2255],
  Koyambedu: [13.0694, 80.1948],
  Madhavaram: [13.148, 80.23],
  Mylapore: [13.0368, 80.2676],
  Nanganallur: [12.981, 80.196],
  Neelankarai: [12.949, 80.255],
  Pallavaram: [12.9675, 80.1491],
  Perambur: [13.109, 80.233],
  Porur: [13.0382, 80.1565],
  Royapettah: [13.0524, 80.264],
  Sholinganallur: [12.901, 80.2279],
  "T. Nagar": [13.0418, 80.2341],
  Tambaram: [12.9249, 80.1],
  Thiruvanmiyur: [12.983, 80.2594],
  Triplicane: [13.0569, 80.276],
  Velachery: [12.9815, 80.218]
};
export const AREA_NAMES = Object.keys(AREAS);
export const CHENNAI_CENTRE = [13.0569, 80.2425];

export const distanceKm = ([lat1, lng1], [lat2, lng2]) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

// A request moves through these four steps, in order.
export const STATUS_STEPS = ["AVAILABLE", "REQUESTED", "CONFIRMED", "COLLECTED"];
export const NEXT_STATUS = { REQUESTED: "CONFIRMED", CONFIRMED: "COLLECTED" };
export const NEXT_LABEL = {
  REQUESTED: "Confirm request",
  CONFIRMED: "Mark as collected"
};

const SORTS = [
  ["soonest", "Soonest pickup"],
  ["servings", "Most servings"],
  ["nearest", "Nearest area"]
];

/* =========================================================
   2. SAFETY TEXT (used by Donate, Details, Footer and the Safety page)
   ========================================================= */

// The donor must tick every one of these before a listing goes live.
export const SAFETY_CHECKS = [
  "The food is fresh and safe to eat. It has not been partly eaten or served on plates.",
  "It is packed in clean, covered containers. Cooked food has been kept hot or chilled.",
  "I have listed the main ingredients and any allergens I know of (nuts, milk, egg, gluten)."
];

export const SAFETY_GUIDE = [
  "Share cooked food within 2 to 3 hours of making it.",
  "Never list food that smells off, looks spoiled or is past its date.",
  "Name the main ingredients. Many people avoid egg, meat or nuts.",
  "Pack in clean, covered containers and label them if you can.",
  "Pick a pickup window you can stay available for."
];

export const COLLECTION_TIPS = [
  "Bring clean, covered containers.",
  "Check the food and the time with the donor when you collect.",
  "Eat cooked food within the time shown. If in doubt, don't eat it.",
  "Ask about ingredients if anyone has allergies."
];

export const DISCLAIMER =
  "Plate2Plate connects people who have surplus food with people who can use it. We do not inspect, store or deliver food. Recipients should check the food before eating it.";

/* =========================================================
   4. HELPERS
   ========================================================= */

export const options = (list) =>
  list.map((item) => <option key={item}>{item}</option>);

export const sumServings = (list) =>
  list.reduce((total, food) => total + Number(food.servings || 0), 0);

// True when both ids exist and are the same number (ids can arrive as text).
export const sameId = (a, b) => a != null && b != null && Number(a) === Number(b);

const pad = (n) => String(n).padStart(2, "0");

export const clock = (ts) => {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
};

const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const dayDiff = (ts) => Math.round((startOfDay(ts) - startOfDay(Date.now())) / DAY);

export const shortDate = (ts) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const toDateInput = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const toTimeInput = (ts) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toLocalInput = (ts) => `${toDateInput(ts)}T${toTimeInput(ts)}`;

const mapUrl = (area) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area + ", Chennai")}`;

const statusMessage = (food, isMine) => {
  if (food.status === "REQUESTED")
    return isMine
      ? "You requested this. Track it on your dashboard."
      : "Someone has requested this. It is waiting for the donor to confirm.";
  if (food.status === "CONFIRMED")
    return "This request is confirmed and waiting for collection.";
  return "This food has been collected.";
};

/* =========================================================
   5. SMALL COMPONENTS
   (defined outside the pages so inputs keep focus)
   ========================================================= */

export function StatusSteps({ status, t }) {
  const current = STATUS_STEPS.indexOf(status);

  return (
    <ol className="status-steps">
      {STATUS_STEPS.map((step, i) => (
        <li key={step} className={i <= current ? "done" : ""}>
          {t(`st_${step}`)}
        </li>
      ))}
    </ol>
  );
}

export function Empty({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
      {actionLabel && (
        <button className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function FoodCard({ food, onView, t, safe }) {
  return (
    <article className="food-card">
      <div className="food-card-image">
        <img
          src={food.image}
          alt={food.name}
          onError={(e) => {
            e.currentTarget.src = "/images/food/placeholder.jpg";
          }}
        />
        <span className={`status status-${food.status.toLowerCase()}`}>
          {t(`st_${food.status}`)}
        </span>
      </div>

      <div className="food-card-body">
        <p className="safe-until">{safe}</p>
        <p className="food-category">{food.category}</p>
        <h3>{food.name}</h3>
        <p>{food.description}</p>
        <p className="food-condition">
          {food.diet}. {food.condition}.
        </p>

        <div className="food-meta">
          <span>{t("serves", food.servings)}</span>
          <span>{food.location}</span>
        </div>

        <button className="view-button" onClick={() => onView(food.id)}>
          {t("view")}
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   6. AVAILABLE FOOD PAGE
   ========================================================= */

export function AvailablePage({
  t,
  search,
  setSearch,
  category,
  setCategory,
  vegOnly,
  setVegOnly,
  area,
  setArea,
  sort,
  setSort,
  filteredFood,
  changePage,
  viewFood,
  safeText
}) {
  return (
    <section className="food-page page-shell">
      <div className="section-heading-row">
        <div>
          <p className="section-label">{t("available")}</p>

          <h1 className="section-title">
            What's ready for <em>pickup.</em>
          </h1>

          <p>
            Every listing shows its pickup window, food condition and the time
            it stays safe until. Open one to request it.
          </p>
        </div>

        <button className="outline-button" onClick={() => changePage("donate")}>
          {t("listFood")}
        </button>
      </div>

      <div className="search-bar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchHint")}
        />
        <span>
          {filteredFood.length} {t("listings")}
        </span>
      </div>

      <div className="filter-buttons">
        {["All", ...CATEGORIES].map((name) => (
          <button
            key={name}
            className={category === name ? "filter-active" : ""}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}

        <button
          className={vegOnly ? "filter-active" : ""}
          onClick={() => setVegOnly(!vegOnly)}
        >
          Veg only
        </button>
      </div>

      <div className="toolbar">
        <label>
          {t("near")}
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="All">{t("anywhere")}</option>
            {AREA_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("sortBy")}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {area !== "All" && (
          <p>Showing food within {NEAR_KM} km of {area}.</p>
        )}
      </div>

      <div className="food-grid">
        {filteredFood.length ? (
          filteredFood.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onView={viewFood}
              t={t}
              safe={safeText(food)}
            />
          ))
        ) : (
          <Empty
            title="No listings match that search."
            text="Try another word, or clear the filters."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch("");
              setCategory("All");
              setVegOnly(false);
              setArea("All");
            }}
          />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   7. FOOD DETAILS PAGE
   ========================================================= */

export function DetailsPage({
  t,
  foodList,
  selectedId,
  user,
  changePage,
  safeText,
  pickupText,
  dayWord,
  requestServings,
  setRequestServings,
  canCollect,
  setCanCollect,
  requestFood,
  reportFood,
  availableProps
}) {
  const food = foodList.find((f) => f.id === selectedId);
  if (!food) return <AvailablePage {...availableProps} />;

  const isMine = user && sameId(food.requestedById, user.id);
  const isOwner = user && sameId(food.ownerId, user.id);
  const phoneVisible =
    isOwner ||
    (isMine && (food.status === "CONFIRMED" || food.status === "COLLECTED"));

  return (
    <section className="details-page page-shell">
      <button className="back-link" onClick={() => changePage("available")}>
        {t("back")}
      </button>

      <div className="details-card">
        <div className="details-image">
          <img
            src={food.image}
            alt={food.name}
            onError={(e) => {
              e.currentTarget.src = "/images/food/placeholder.jpg";
            }}
          />
        </div>

        <div className="details-content">
          <p className="safe-until big">{safeText(food)}</p>
          <p className="section-label">{food.category}</p>
          <h1>{food.name}</h1>
          <p className="details-description">{food.description}</p>

          <div className="details-info">
            {[
              [t("serves", food.servings), null],
              ["Quantity", food.quantity],
              ["Pickup window", pickupText(food)],
              ["Food condition", food.condition],
              ["Cooked or packed", `${dayWord(food.cookedAt)}, ${clock(food.cookedAt)}`],
              ["Diet", food.diet],
              ["Pickup area", food.location],
              ["Donated by", food.source],
              [
                "Donor phone",
                phoneVisible
                  ? food.phone
                  : "Shown after the donor confirms your request"
              ]
            ]
              .filter(([, value]) => value !== null)
              .map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
          </div>

          <a
            className="text-link map-link"
            href={mapUrl(food.location)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View {food.location} on map ↗
          </a>

          <StatusSteps status={food.status} t={t} />

          <div className="safety-note">
            <h4>Before you collect</h4>
            <ul>
              {COLLECTION_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          {food.status === "AVAILABLE" ? (
            <>
              <div className="partial-request">
                <label htmlFor="request-servings">
                  How many servings do you need? (up to {food.servings})
                </label>
                <input
                  id="request-servings"
                  type="number"
                  min="1"
                  max={food.servings}
                  value={requestServings}
                  onChange={(e) => setRequestServings(e.target.value)}
                />
              </div>

              <label className="check">
                <input
                  type="checkbox"
                  checked={canCollect}
                  onChange={(e) => setCanCollect(e.target.checked)}
                />
                I can collect this during the pickup window and will check
                the food before eating it.
              </label>

              <button
                className="primary-button full-button"
                onClick={() => requestFood(food)}
              >
                {t("request")}
              </button>
            </>
          ) : (
            <div className="details-status">{statusMessage(food, isMine)}</div>
          )}

          <p className="disclaimer">
            Plate2Plate connects people and does not inspect food. Please
            check it before you eat it.
          </p>

          <button
            className="text-link report-link"
            disabled={food.reported}
            onClick={() => reportFood(food)}
          >
            {food.reported ? "Reported. Thank you." : t("report")}
          </button>
        </div>
      </div>
    </section>
  );
}
