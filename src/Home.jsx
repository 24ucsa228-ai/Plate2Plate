/* =========================================================
   HOME.JSX
   The home page and the other "information" pages.

   Find things here:
   1. CONTENT ............... hero slides, how-it-works steps, who-it's-for,
                              FAQ, celebration form options
   2. Hero .................. the sliding banner at the top of Home
   3. HomePage .............. intro, how it works, categories, impact, FAQ
   4. WhoPage ............... "Who it's for"
   5. SafetyPage ............ "Food safety guidelines"
   6. ContributionPage ...... "Celebrate by sharing" form
   ========================================================= */

import {
  AREA_NAMES,
  CATEGORIES,
  CATEGORY_IMAGES,
  SAFETY_CHECKS,
  SAFETY_GUIDE,
  COLLECTION_TIPS,
  DISCLAIMER,
  options,
  sumServings,
  Empty,
  FoodCard
} from "./Food.jsx";

/* =========================================================
   1. CONTENT
   ========================================================= */

const FAQ = [
  [
    "Is this food safe?",
    "Donors confirm that the food is fresh, covered and properly stored, and every listing shows a safe-until time. Plate2Plate does not inspect food, so always check it yourself when you collect. If anything smells or looks wrong, don't eat it."
  ],
  [
    "Who can collect?",
    "Anyone with an account: families, shelters, trusts, community kitchens and student groups. You only need to be able to reach the pickup spot during the pickup window."
  ],
  [
    "Is it free?",
    "Yes. Donors give their food away and Plate2Plate charges nothing. No money changes hands on the site."
  ],
  [
    "Can I ask for only part of a listing?",
    "Yes. If a listing serves 40, you can request 20. The rest stays available for someone else."
  ],
  [
    "Who can see the donor's phone number?",
    "Only the person whose request the donor has confirmed. Until then the number stays hidden."
  ],
  [
    "What if I can't make the pickup?",
    "Cancel the request from your dashboard while it is still at the Requested step. The food goes back on the board."
  ]
];

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Wedding or engagement",
  "Housewarming",
  "Festival",
  "In memory of someone",
  "No occasion, just because"
];

const SHARE_OPTIONS = [
  "Cooked meals",
  "Cake or sweets",
  "Snacks and bakery items",
  "Groceries",
  "Fruits and vegetables",
  "Not sure yet"
];

const PROCESS = [
  {
    kicker: "List",
    title: "Tell us what you have, and how safe it is.",
    text: "Add the quantity, roughly how many people it serves, when it was cooked, how long it stays safe and a pickup window. You confirm a short safety checklist before it goes live.",
    image: "/images/list.jpg",
    alt: "Prepared food ready to be shared"
  },
  {
    kicker: "Request",
    title: "Ask for what you can collect.",
    text: "Browse listings, check the safe-until time, then request all of it or just part. The donor confirms, so the same food is never promised to two people.",
    image: "/images/request.jpg",
    alt: "Community food sharing"
  },
  {
    kicker: "Collect",
    title: "Confirm, collect, mark it done.",
    text: "Follow each request from Requested to Confirmed to Collected. Once it is collected, the listing closes and adds to our shared total.",
    image: "/images/collect.jpg",
    alt: "People connected through food sharing"
  }
];

const WHO_ROWS = [
  {
    label: "Donors",
    title: "Have food to share?",
    text: "Restaurants, bakeries, caterers, wedding halls and home cooks can list what is left, say how it was stored and set a pickup window.",
    link: "List your food",
    page: "donate",
    image: "/images/donors.jpg",
    alt: "Food available for donation"
  },
  {
    label: "Organisations",
    title: "Need food for people you look after?",
    text: "Shelters, trusts, community kitchens and student groups can browse live listings, request what they can collect and track every request.",
    link: "See what's available",
    page: "available",
    image: "/images/orgs.jpg",
    alt: "Community organisation sharing food"
  },
  {
    label: "Celebrating something?",
    title: "Make your special day count twice.",
    text: "Birthdays, anniversaries and festivals leave plenty to share. Tell us the occasion and we will help you plan a pickup.",
    link: "Celebrate by sharing",
    page: "contribution",
    image: "/images/celebrate.jpg",
    alt: "People connected through food sharing"
  }
];

export const slides = [
  {
    image: "/images/hero1.jpg",
    label: "Surplus food, shared locally",
    title: "Behind every smile is a full plate.",
    text: "Plate2Plate connects Chennai's kitchens, bakeries, caterers and families with shelters and communities who can put safe surplus food on a plate today."
  },
  {
    image: "/images/hero2.jpg",
    label: "Food for families",
    title: "Your extra is someone's dinner.",
    text: "List what you have left and how long it stays safe. A family nearby can collect it and sit down to a meal together tonight."
  },
  {
    image: "/images/hero3.jpg",
    label: "Small acts, real meals",
    title: "Two minutes to list. A meal for her.",
    text: "Add a few details, choose a pickup window, and a shelter or community kitchen collects it fresh, so nothing goes to waste."
  },
  {
    image: "/images/hero4.jpg",
    label: "Community in action",
    title: "The celebration ends. The meals don't.",
    text: "Weddings, birthdays and festivals leave plenty behind. Share it hand to hand with people nearby who are waiting for a meal."
  }
];

export const EMPTY_CONTRIBUTION = {
  name: "",
  email: "",
  occasion: "",
  date: "",
  share: "",
  servings: "",
  message: ""
};

/* =========================================================
   2. HERO (sliding banner)
   ========================================================= */

function Hero({ currentSlide, setCurrentSlide, changePage, t }) {
  const slide = slides[currentSlide];

  return (
    <section className="hero">
      {slides.map((item, index) => (
        <div
          key={item.image}
          className={`hero-slide ${index === currentSlide ? "active" : ""}`}
          style={{ backgroundImage: `url(${item.image})` }}
        />
      ))}

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-label">{slide.label}</p>
        <h1>{slide.title}</h1>
        <p className="hero-text">{slide.text}</p>

        <div className="hero-buttons">
          <button className="primary-button" onClick={() => changePage("donate")}>
            {t("donate")}
          </button>
          <button className="secondary-button" onClick={() => changePage("available")}>
            {t("find")}
          </button>
        </div>
      </div>

      <div className="hero-controls">
        <button
          className="secondary-button"
          onClick={() =>
            setCurrentSlide((s) => (s - 1 + slides.length) % slides.length)
          }
        >
          Prev
        </button>

        <div className="hero-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <span className="hero-counter">
          0{currentSlide + 1} / 0{slides.length}
        </span>

        <button
          className="secondary-button"
          onClick={() => setCurrentSlide((s) => (s + 1) % slides.length)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   3. HOME PAGE
   ========================================================= */

export function HomePage({
  t,
  liveFood,
  openFood,
  collectedFood,
  inProgress,
  selectedHomeCategory,
  setSelectedHomeCategory,
  showAllAreas,
  setShowAllAreas,
  setArea,
  currentSlide,
  setCurrentSlide,
  changePage,
  viewFood,
  safeText
}) {
  const categoryFood = liveFood.filter(
    (f) => f.category === selectedHomeCategory
  );

  return (
    <>
      <Hero
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        changePage={changePage}
        t={t}
      />

      <section className="intro-section" id="about">
        <img
          className="intro-image"
          src="/images/about.jpg"
          alt="Food prepared for sharing"
        />

        <div className="intro-content">
          <p className="section-label">Why Plate2Plate</p>

          <h2>
            Most surplus food is perfectly good. It just needs <em>somewhere to go.</em>
          </h2>

          <p>
            Weddings, restaurants, bakeries and home kitchens in Chennai
            often end the day with more than they need, while shelters,
            community kitchens and families nearby are looking for exactly
            that.
          </p>

          <p>
            Plate2Plate is a simple board. Donors list what they have, when
            it was made and how long it stays safe. Recipients request what
            they can pick up, and both sides follow the request until the
            food changes hands.
          </p>

          <blockquote className="about-promise">
            No money. No middlemen. Just food moving from where it's left
            to where it's needed.
          </blockquote>

          <div className="about-areas">
            <p className="about-areas-label">
              Pickup points across {AREA_NAMES.length} areas of Chennai
            </p>

            <div className="area-chips">
              {(showAllAreas ? AREA_NAMES : AREA_NAMES.slice(0, 10)).map((name) => (
                <button
                  key={name}
                  className="area-chip"
                  onClick={() => {
                    setArea(name);
                    changePage("available");
                  }}
                >
                  {name}
                </button>
              ))}

              <button
                className="area-chip area-chip-more"
                aria-expanded={showAllAreas}
                onClick={() => setShowAllAreas((open) => !open)}
              >
                {showAllAreas ? "Show less" : `+${AREA_NAMES.length - 10} more`}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section process-editorial" id="how-it-works">
        <div className="process-heading">
          <p className="section-label">How it works</p>

          <h2 className="section-title">
            Three steps from spare tray to <em>shared meal.</em>
          </h2>

          <p className="section-description">
            No delivery fleet and no paperwork. Just clear details and a
            pickup window both sides can plan around.
          </p>
        </div>

        <div className="process-timeline">
          {PROCESS.map((step, i) => (
            <article
              key={step.kicker}
              className={`process-row ${i % 2 ? "reverse" : ""}`}
            >
              <div className="process-copy">
                <span className="process-number">0{i + 1}</span>
                <p className="process-kicker">{step.kicker}</p>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>

              <div className="process-image">
                <img src={step.image} alt={step.alt} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="who-teaser">
        <div>
          <p className="section-label">Who it's for</p>
          <h2>
            Kitchens, shelters and <em>neighbours.</em>
          </h2>
        </div>

        <div>
          <p>
            Restaurants and caterers, trusts and community kitchens,
            families with a function behind them. If you have food to give
            or people to feed, there is a place for you here.
          </p>

          <button className="outline-button" onClick={() => changePage("who")}>
            See who can join
          </button>
        </div>
      </section>

      <section className="home-food-section" id="available-now">
        <div className="home-food-inner">
          <div className="section-heading-row">
            <div>
              <p className="section-label">Available now</p>

              <h2 className="section-title">
                Fresh listings across <em>Chennai.</em>
              </h2>

              <p className="home-food-description">
                Pick a category to see what is ready for pickup.
              </p>
            </div>

            <button className="outline-button" onClick={() => changePage("available")}>
              View all food
            </button>
          </div>

          {!selectedHomeCategory ? (
            <div className="category-grid">
              {CATEGORIES.map((name) => {
                const count = liveFood.filter((f) => f.category === name).length;

                return (
                  <button
                    key={name}
                    className="category-card"
                    style={{ "--category-image": `url(${CATEGORY_IMAGES[name]})` }}
                    onClick={() => setSelectedHomeCategory(name)}
                  >
                    <span className="category-number">
                      {count} {count === 1 ? "listing" : t("listings")}
                    </span>
                    <h3>{name}</h3>
                    <span className="category-arrow">Explore →</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="selected-category-header">
                <button
                  className="back-category-button"
                  onClick={() => setSelectedHomeCategory(null)}
                >
                  ← Back to categories
                </button>

                <div>
                  <p className="section-label">{selectedHomeCategory}</p>
                  <h3 className="selected-category-title">Ready for pickup</h3>
                </div>
              </div>

              <div className="food-grid">
                {categoryFood.length ? (
                  categoryFood.map((food) => (
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
                    title="Nothing listed here right now."
                    text="Check back soon, or list something yourself."
                    actionLabel="List food"
                    onAction={() => changePage("donate")}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="impact-section" id="impact">
        <p className="section-label">Our impact</p>

        <h2 className="section-title">
          What is moving <em>right now.</em>
        </h2>

        <p className="section-description">
          These numbers come straight from the listings on this site. Every
          collected tray adds to the total.
        </p>

        <div className="impact-grid">
          <div className="impact-box">
            <span>Servings shared</span>
            <strong>{sumServings(collectedFood)}</strong>
          </div>

          <div className="impact-box">
            <span>Servings ready now</span>
            <strong>{sumServings(openFood)}</strong>
          </div>

          <div className="impact-box">
            <span>Open listings</span>
            <strong>{openFood.length}</strong>
          </div>

          <div className="impact-box">
            <span>Requests in progress</span>
            <strong>{inProgress.length}</strong>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-heading">
          <p className="section-label">{t("faq")}</p>
          <h2 className="section-title">Questions people ask first.</h2>
          <button className="text-link" onClick={() => changePage("safety")}>
            Read the food safety guidelines →
          </button>
        </div>

        <div className="faq-list">
          {FAQ.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="image-feature">
        <img src="/images/banner.jpg" alt="Community food sharing" />
        <div className="image-feature-overlay" />

        <div className="image-feature-content">
          <p className="section-label">Have food to spare?</p>

          <h2>
            List it while it's still <em>fresh.</em>
          </h2>

          <button className="primary-button" onClick={() => changePage("donate")}>
            List food
          </button>
        </div>
      </section>

      <section className="moment-section">
        <div className="moment-image">
          <img
            src="/images/moment.jpg"
            alt="Sharing food on a special occasion"
          />
        </div>

        <div className="moment-content">
          <p className="section-label">Celebrate by sharing</p>

          <h2>
            Make your birthday or anniversary <em>count twice.</em>
          </h2>

          <p>
            Celebrating something? Cook a little extra, order one more
            cake, or set aside a few grocery packs for a family who would
            love them. Birthdays, anniversaries, housewarmings and
            festivals are the easiest days to turn your good day into
            someone else's.
          </p>

          <button className="primary-button" onClick={() => changePage("contribution")}>
            Plan a celebration share
          </button>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   4. WHO IT'S FOR PAGE
   ========================================================= */

export function WhoPage({ changePage }) {
  return (
    <section className="who-page page-shell">
      <div className="who-page-intro">
        <p className="section-label">Who it's for</p>

        <h1>
          Everyone has a part in <em>the journey.</em>
        </h1>

        <p>
          Plate2Plate brings together the people who have surplus, the
          organisations that can pass it on and the families who can use it.
        </p>
      </div>

      <div className="who-page-list">
        {WHO_ROWS.map((row, i) => (
          <article key={row.label} className="who-page-row">
            <span>0{i + 1}</span>

            <div>
              <p className="section-label">{row.label}</p>
              <h2>{row.title}</h2>
              <p>{row.text}</p>

              <button className="text-link" onClick={() => changePage(row.page)}>
                {row.link} →
              </button>
            </div>

            <img src={row.image} alt={row.alt} />
          </article>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   5. FOOD SAFETY PAGE
   ========================================================= */

export function SafetyPage({ t, changePage }) {
  return (
    <section className="safety-page page-shell">
      <div className="who-page-intro">
        <p className="section-label">Food safety</p>

        <h1>
          Share it safely, <em>eat it safely.</em>
        </h1>

        <p>
          Good intentions are not enough with food. These simple habits keep
          every tray, box and packet safe from the kitchen to the plate.
        </p>
      </div>

      <div className="safety-grid">
        <div className="safety-card">
          <h3>If you are donating</h3>
          <ul>
            {SAFETY_GUIDE.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="safety-card">
          <h3>If you are collecting</h3>
          <ul>
            {COLLECTION_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="safety-card">
          <h3>What donors confirm</h3>
          <ul>
            {SAFETY_CHECKS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="disclaimer-block">{DISCLAIMER}</p>

      <div className="hero-buttons">
        <button className="primary-button" onClick={() => changePage("donate")}>
          List food
        </button>
        <button className="outline-button" onClick={() => changePage("available")}>
          {t("find")}
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   6. CELEBRATE BY SHARING PAGE
   ========================================================= */

export function ContributionPage({
  contributionForm,
  setContribution,
  submitContribution
}) {
  return (
    <section className="contribution-page page-shell">
      <div className="contribution-intro">
        <p className="section-label">Celebrate by sharing</p>

        <h1>
          Make your special day <em>count twice.</em>
        </h1>

        <p>
          Birthday, anniversary, housewarming or festival: when there is
          more food than you need, or you simply want to give back, tell us
          about it. We will help you share it with a family or community
          kitchen nearby.
        </p>
      </div>

      <div className="contribution-layout">
        <div className="contribution-image">
          <img src="/images/contribute.jpg" alt="Sharing food on a special occasion" />

          <div>
            <p className="section-label">Every occasion counts</p>

            <h2>
              Your good day can become <em>someone's good meal.</em>
            </h2>
          </div>
        </div>

        <div className="contribution-form">
          <label>Full name *</label>
          <input
            value={contributionForm.name}
            onChange={setContribution("name")}
            placeholder="Enter your name"
          />

          <label>Email *</label>
          <input
            type="email"
            value={contributionForm.email}
            onChange={setContribution("email")}
            placeholder="Enter your email"
          />

          <label>What are you celebrating? *</label>
          <select value={contributionForm.occasion} onChange={setContribution("occasion")}>
            <option value="">Select an occasion</option>
            {options(OCCASIONS)}
          </select>

          <label>Date of the occasion</label>
          <input
            type="date"
            value={contributionForm.date}
            onChange={setContribution("date")}
          />

          <label>What would you like to share?</label>
          <select value={contributionForm.share} onChange={setContribution("share")}>
            <option value="">Select an option</option>
            {options(SHARE_OPTIONS)}
          </select>

          <label>Roughly how many people could it feed?</label>
          <input
            type="number"
            min="1"
            value={contributionForm.servings}
            onChange={setContribution("servings")}
            placeholder="e.g. 20"
          />

          <label>Anything else?</label>
          <textarea
            value={contributionForm.message}
            onChange={setContribution("message")}
            placeholder="Tell us about the occasion and what you have in mind."
          />

          <button className="primary-button full-button" onClick={submitContribution}>
            Share my celebration
          </button>
        </div>
      </div>
    </section>
  );
}
