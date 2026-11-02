/* =========================================================
   DONATE.JSX
   The "Donate food" page: listing form, safety checklist,
   photo upload. Also used when editing an existing listing.
   ========================================================= */

import {
  HOUR,
  CATEGORIES,
  AREA_NAMES,
  SAFETY_CHECKS,
  SAFETY_GUIDE,
  options,
  toLocalInput
} from "./Food.jsx";
import { LoginPrompt } from "./Auth.jsx";

/* =========================================================
   FORM OPTIONS AND EMPTY FORM
   ========================================================= */

const DIETS = ["Veg", "Non-veg", "Contains egg"];

const CONDITIONS = [
  "Freshly cooked, kept hot",
  "Cooked, kept chilled",
  "Packed today, room temperature",
  "Fresh produce, uncut",
  "Sealed and unopened"
];

// [label, hours the food stays safe after it was cooked or packed]
const SAFE_FOR = [
  ["Eat within 2 hours", 2],
  ["Eat within 4 hours", 4],
  ["Eat within 6 hours", 6],
  ["Use today (12 hours)", 12],
  ["Use within 2 days", 48],
  ["Best before: 1 week or more", 168]
];

export const EMPTY_DONATION = {
  name: "",
  category: "",
  diet: "",
  quantity: "",
  servings: "",
  location: "",
  pickupDate: "",
  pickupFrom: "",
  pickupTo: "",
  cookedAt: "",
  safeHours: "",
  condition: "",
  phone: "",
  photo: "",
  description: ""
};

// Shrink a chosen photo (max 800px) so it stays small when sent to the server.
export const readPhoto = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Label + input wrapper used by every field in the form.
function Field({ label, className, children }) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

/* =========================================================
   DONATE PAGE
   ========================================================= */

export function DonatePage({
  user,
  editingId,
  donationForm,
  setDonation,
  setDonationForm,
  safety,
  toggleSafety,
  choosePhoto,
  submitDonation,
  safeText,
  changePage
}) {
  if (!user)
    return (
      <LoginPrompt
        message="You need an account to list food, so recipients know who to collect from."
        changePage={changePage}
      />
    );

  const d = donationForm;
  const previewUntil =
    d.cookedAt && d.safeHours
      ? new Date(d.cookedAt).getTime() + Number(d.safeHours) * HOUR
      : null;

  return (
    <section className="form-page page-shell">
      <div className="form-intro-block">
        <p className="section-label">{editingId ? "Edit listing" : "Donate food"}</p>

        <h1>
          {editingId ? (
            <>
              Fix the <em>details.</em>
            </>
          ) : (
            <>
              Cooked too much? <em>Share it.</em>
            </>
          )}
        </h1>

        <p>
          The more clearly you describe the food, the easier it is for
          someone to collect it safely and on time.
        </p>
      </div>

      <div className="donate-layout">
        <div className="form-card">
          <div className="form-grid">
            <Field label="Food name">
              <input
                value={d.name}
                onChange={setDonation("name")}
                placeholder="e.g. Vegetable biryani"
              />
            </Field>

            <Field label="Category">
              <select value={d.category} onChange={setDonation("category")}>
                <option value="">Select category</option>
                {options(CATEGORIES)}
              </select>
            </Field>

            <Field label="Veg or non-veg">
              <select value={d.diet} onChange={setDonation("diet")}>
                <option value="">Select one</option>
                {options(DIETS)}
              </select>
            </Field>

            <Field label="Quantity">
              <input
                value={d.quantity}
                onChange={setDonation("quantity")}
                placeholder="e.g. 5 kg, 30 packets"
              />
            </Field>

            <Field label="How many people it serves (approx.)">
              <input
                type="number"
                min="1"
                value={d.servings}
                onChange={setDonation("servings")}
                placeholder="e.g. 25"
              />
            </Field>

            <Field label="Pickup area">
              <select value={d.location} onChange={setDonation("location")}>
                <option value="">Select area</option>
                {options(AREA_NAMES)}
              </select>
            </Field>

            <Field label="Pickup date">
              <input
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={d.pickupDate}
                onChange={setDonation("pickupDate")}
              />
            </Field>

            <Field label="Pickup window (from and to)">
              <div className="time-pair">
                <input
                  type="time"
                  value={d.pickupFrom}
                  onChange={setDonation("pickupFrom")}
                />
                <input
                  type="time"
                  value={d.pickupTo}
                  onChange={setDonation("pickupTo")}
                />
              </div>
            </Field>

            <Field label="When was it cooked or packed?">
              <input
                type="datetime-local"
                max={toLocalInput(Date.now())}
                value={d.cookedAt}
                onChange={setDonation("cookedAt")}
              />
            </Field>

            <Field label="How long does it stay safe?">
              <select value={d.safeHours} onChange={setDonation("safeHours")}>
                <option value="">Select time</option>
                {SAFE_FOR.map(([label, hours]) => (
                  <option key={hours} value={hours}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            {previewUntil && (
              <div className="full safe-preview">
                Your listing will show: <strong>{safeText({ safeUntil: previewUntil })}</strong>
              </div>
            )}

            <Field label="Food condition">
              <select value={d.condition} onChange={setDonation("condition")}>
                <option value="">Select condition</option>
                {options(CONDITIONS)}
              </select>
            </Field>

            <Field label="Contact phone (shown only after you confirm a request)">
              <input
                type="tel"
                value={d.phone}
                onChange={setDonation("phone")}
                placeholder="10 digit mobile number"
              />
            </Field>

            <Field label="Ingredients and allergens" className="full">
              <textarea
                value={d.description}
                onChange={setDonation("description")}
                placeholder="Main ingredients, packaging, and anything people should know. e.g. Contains peanuts."
              />
            </Field>

            <Field label="Photo (optional)" className="full">
              <input type="file" accept="image/*" onChange={choosePhoto} />

              {d.photo && (
                <div className="photo-preview">
                  <img src={d.photo} alt="Your food" />
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setDonationForm((form) => ({ ...form, photo: "" }))}
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </Field>

            <div className="full safety-box">
              <h4>Food safety confirmation</h4>

              {SAFETY_CHECKS.map((text, i) => (
                <label key={text} className="check">
                  <input
                    type="checkbox"
                    checked={safety[i]}
                    onChange={() => toggleSafety(i)}
                  />
                  {text}
                </label>
              ))}
            </div>
          </div>

          <button className="primary-button full-button" onClick={submitDonation}>
            {editingId ? "Save changes" : "List this food"}
          </button>
        </div>

        <aside className="safety-guide">
          <h3>Keeping it safe</h3>
          <ul>
            {SAFETY_GUIDE.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <button className="text-link" onClick={() => changePage("safety")}>
            Full guidelines →
          </button>
        </aside>
      </div>
    </section>
  );
}
