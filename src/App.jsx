/* =========================================================
   APP.JSX  (the root file)

   App owns all the state and every call to the database API.
   The pages themselves live in their own files and receive what
   they need as props:

     Navbar.jsx ......... top bar
     Footer.jsx ......... bottom bar
     Home.jsx ........... Home, Who it's for, Food safety, Celebrate by sharing
     Food.jsx ........... constants, helpers, Available food, Food details
     Donate.jsx ......... donate / edit a listing
     Auth.jsx ........... log in, create account
     Dashboard.jsx ...... donor and recipient dashboard
     Admin.jsx .......... admin login and admin dashboard

   In this file:
   1. TRANSLATIONS   2. DATABASE HELPERS   3. App (state, effects,
   handlers)   4. renderPage (which page to show)
   ========================================================= */

import { useEffect, useState } from "react";
import "./App.css";

import { Navbar } from "./Navbar.jsx";
import { Footer } from "./Footer.jsx";
import { HomePage, WhoPage, SafetyPage, ContributionPage, slides, EMPTY_CONTRIBUTION } from "./Home.jsx";
import {
  AvailablePage,
  DetailsPage,
  HOUR,
  DAY,
  NEAR_KM,
  CATEGORY_IMAGES,
  AREAS,
  CHENNAI_CENTRE,
  distanceKm,
  NEXT_STATUS,
  SAFETY_CHECKS,
  clock,
  dayDiff,
  shortDate,
  toDateInput,
  toTimeInput,
  toLocalInput,
  sameId
} from "./Food.jsx";
import { DonatePage, EMPTY_DONATION, readPhoto } from "./Donate.jsx";
import { AuthPage, EMPTY_AUTH } from "./Auth.jsx";
import { DashboardPage } from "./Dashboard.jsx";
import { AdminLoginPage, AdminPage } from "./Admin.jsx";

/* =========================================================
   1. TAMIL / ENGLISH (key labels only)
   ========================================================= */

const STR = {
  en: {
    home: "Home",
    how: "How it works",
    available: "Available food",
    impact: "Our impact",
    about: "About",
    login: "Log in",
    start: "Get started",
    logout: "Log out",
    dashboard: "My dashboard",
    donate: "Donate food",
    find: "Find food",
    view: "View details →",
    request: "Request this food",
    listFood: "+ List food",
    listings: "listings",
    safeUntil: "Safe until",
    bestBefore: "Best before",
    today: "Today",
    tomorrow: "Tomorrow",
    near: "Near",
    anywhere: "Anywhere in Chennai",
    sortBy: "Sort by",
    report: "Report this listing",
    back: "← Back to available food",
    safety: "Food safety guidelines",
    faq: "FAQ",
    serves: (n) => `Serves about ${n}`,
    st_AVAILABLE: "Available",
    st_REQUESTED: "Requested",
    st_CONFIRMED: "Confirmed",
    st_COLLECTED: "Collected",
    searchHint: "Search by food, area, donor or ingredient..."
  },
};

/* =========================================================
   2. DATABASE HELPERS
   ========================================================= */

const API = "http://localhost:5000/api";

const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || "Something went wrong.");
    error.status = response.status;
    throw error;
  }
  return data;
};

const mapFood = (f) => ({
  ...f,
  id: Number(f.id),
  ownerId: f.owner_id == null ? null : Number(f.owner_id),
  ownerEmail: f.owner_email,
  requestedById: f.requested_by == null ? null : Number(f.requested_by),
  requestedBy: f.requester_email || f.requested_by_email || null,
  requestedServings: f.requested_servings,
  rating: f.rating === 1 ? "yes" : f.rating === 0 ? "no" : null,
  pickupStart: f.pickup_start ? new Date(f.pickup_start).getTime() : null,
  pickupEnd: f.pickup_end ? new Date(f.pickup_end).getTime() : null,
  cookedAt: f.cooked_at ? new Date(f.cooked_at).getTime() : null,
  safeUntil: f.safe_until ? new Date(f.safe_until).getTime() : null,
  image: f.image || CATEGORY_IMAGES[f.category] || "/images/food/placeholder.jpg"
});

const unwrapFoods = (rows) =>
  (Array.isArray(rows) ? rows : rows.foods || rows.rows || []).map(mapFood);

const readJSON = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/* =========================================================
   3. APP
   ========================================================= */

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [page, setPage] = useState("home");
  const [activeNav, setActiveNav] = useState("home");
  const [now, setNow] = useState(Date.now());
  const [lang, setLang] = useState(() => readJSON("p2p_lang", "en"));

  const [foodList, setFoodList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedHomeCategory, setSelectedHomeCategory] = useState(null);
  const [showAllAreas, setShowAllAreas] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [area, setArea] = useState("All");
  const [sort, setSort] = useState("soonest");

  const [donationForm, setDonationForm] = useState(EMPTY_DONATION);
  const [editingId, setEditingId] = useState(null);
  const [safety, setSafety] = useState(SAFETY_CHECKS.map(() => false));
  const [canCollect, setCanCollect] = useState(false);
  const [requestServings, setRequestServings] = useState("");
  const [contributionForm, setContributionForm] = useState(EMPTY_CONTRIBUTION);

  const [user, setUser] = useState(() => readJSON("p2p_user", null));
  const [authForm, setAuthForm] = useState(EMPTY_AUTH);
  const [accountType, setAccountType] = useState("donor");

  // Admin data. null means "not loaded (or the server route is missing)".
  const [adminUsers, setAdminUsers] = useState(null);
  const [adminContributions, setAdminContributions] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const t = (key, ...args) => {
    const value = STR[lang]?.[key] ?? STR.en[key] ?? key;
    return typeof value === "function" ? value(...args) : value;
  };

  /* ---------- timers and saving ---------- */

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((slide) => (slide + 1) % slides.length),
      6000
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load listings from the database, and keep them fresh so a donor sees new
  // requests (and a recipient sees confirmations) without refreshing the page.
  const loadFoods = async (quiet = true) => {
    try {
      setFoodList(unwrapFoods(await api("/food")));
    } catch (error) {
      if (!quiet) showToast(error.message, "error");
    }
  };

  const loadNotes = async (userId = user?.id) => {
    if (!userId) return setNotes([]);
    try {
      const data = await api(`/notifications/${userId}`);
      setNotes(
        (data.notifications || []).map((n) => ({
          id: n.id,
          text: n.text,
          at: new Date(n.created_at).getTime()
        }))
      );
    } catch {
      /* keep the old list if the server is briefly unreachable */
    }
  };

  useEffect(() => {
    loadFoods(false);
    const timer = setInterval(() => {
      loadFoods();
      loadNotes();
    }, 15000);
    return () => clearInterval(timer);
  }, [user?.id]);

  // Reload straight away when the user logs in or opens a page that shows their activity.
  useEffect(() => {
    loadFoods();
    loadNotes();
  }, [user?.id, page]);

  // If the saved login no longer exists in the database, sign out cleanly.
  useEffect(() => {
    if (!user?.id) return;
    api(`/users/${user.id}`).catch((error) => {
      if (error.status === 404) {
        localStorage.removeItem("p2p_user");
        setUser(null);
        setNotes([]);
      }
    });
  }, []);

  // Highlight the nav link for the section currently on screen (home page only).
  useEffect(() => {
    if (page !== "home") return;

    // [CSS selector of the section, nav key it belongs to], in page order.
    const sections = [
      [".hero", "home"],
      ["#about", "about"],
      ["#how-it-works", "how"],
      [".who-teaser", "how"],
      ["#available-now", "available"],
      ["#impact", "impact"],
      ["#faq", ""],
      [".image-feature", ""],
      [".moment-section", ""]
    ];

    let ticking = false;

    const update = () => {
      ticking = false;
      const line = 160; // just below the sticky navbar
      let current = "home";

      for (const [selector, key] of sections) {
        const el = document.querySelector(selector);
        if (el && el.getBoundingClientRect().top <= line) current = key;
      }

      setActiveNav((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  // Load users and celebration plans when an admin opens the admin page.
  useEffect(() => {
    if (page === "admin" && user?.type === "admin") loadAdmin();
  }, [page, user?.id]);

  useEffect(() => {
    writeJSON("p2p_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  /* ---------- time and place text ---------- */

  const dayWord = (ts, lower) => {
    const diff = dayDiff(ts);
    if (diff === 0) return lower ? t("today").toLowerCase() : t("today");
    if (diff === 1) return lower ? t("tomorrow").toLowerCase() : t("tomorrow");
    return shortDate(ts);
  };

  const safeText = (f) =>
    f.safeUntil - now > 3 * DAY
      ? `${t("bestBefore")} ${shortDate(f.safeUntil)}`
      : `${t("safeUntil")} ${clock(f.safeUntil)} ${dayWord(f.safeUntil, true)}`;

  const pickupText = (f) =>
    `${dayWord(f.pickupStart)}, ${clock(f.pickupStart)} – ${clock(f.pickupEnd)}`;

  /* ---------- numbers used around the site ---------- */

  // An open listing disappears once its pickup window or safe time has passed.
  const isExpired = (f) =>
    f.status === "AVAILABLE" && (f.pickupEnd < now || f.safeUntil < now);

  const liveFood = foodList.filter((f) => f.status !== "COLLECTED" && !isExpired(f));
  const collectedFood = foodList.filter((f) => f.status === "COLLECTED");
  const openFood = liveFood.filter((f) => f.status === "AVAILABLE");
  const inProgress = foodList.filter(
    (f) => f.status === "REQUESTED" || f.status === "CONFIRMED"
  );

  const filteredFood = (() => {
    const query = search.trim().toLowerCase();
    const origin = AREAS[area] || CHENNAI_CENTRE;
    const away = (f) => distanceKm(AREAS[f.location] || CHENNAI_CENTRE, origin);

    const list = foodList.filter((f) => {
      if (f.status === "COLLECTED") return false;
      if (f.status === "AVAILABLE" && (f.pickupEnd < now || f.safeUntil < now)) return false;
      if (category !== "All" && f.category !== category) return false;
      if (vegOnly && f.diet !== "Veg") return false;
      if (area !== "All" && away(f) > NEAR_KM) return false;

      return (
        !query ||
        [f.name, f.category, f.location, f.source, f.description]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });

    const by = {
      soonest: (a, b) => a.pickupStart - b.pickupStart,
      servings: (a, b) => b.servings - a.servings,
      nearest: (a, b) => away(a) - away(b)
    };

    return [...list].sort(by[sort]);
  })();

  /* ---------- navigation ---------- */

  const showToast = (message) => alert(message);

  const changePage = (next, opts = {}) => {
    const navFor = {
      details: "available",
      who: "home",
      contribution: "home",
      safety: "home"
    };

    if (next === "donate" && !opts.edit) {
      setEditingId(null);
      setDonationForm(EMPTY_DONATION);
      setSafety(SAFETY_CHECKS.map(() => false));
    }

    setPage(next);
    setActiveNav(navFor[next] || next);
    if (next === "login" || next === "register") setAuthForm(EMPTY_AUTH);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToSection = (id, key) => {
    const scroll = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    if (page !== "home") {
      changePage("home");
      setTimeout(scroll, 100);
    } else {
      scroll();
    }
    if (key) setActiveNav(key);
  };

  const viewFood = (id) => {
    const food = foodList.find((f) => f.id === id);
    setSelectedId(id);
    setCanCollect(false);
    setRequestServings(food ? String(food.servings) : "");
    changePage("details");
  };

  /* ---------- form helpers ---------- */

  const setDonation = (field) => (e) =>
    setDonationForm((form) => ({ ...form, [field]: e.target.value }));

  const setContribution = (field) => (e) =>
    setContributionForm((form) => ({ ...form, [field]: e.target.value }));

  const setAuth = (field) => (e) =>
    setAuthForm((form) => ({ ...form, [field]: e.target.value }));

  const toggleSafety = (index) =>
    setSafety((list) => list.map((v, i) => (i === index ? !v : v)));

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const photo = await readPhoto(file);
      setDonationForm((form) => ({ ...form, photo }));
    } catch {
      showToast("That photo could not be read. Try a different one.", "error");
    }
  };

  /* ---------- login ---------- */

  const logIn = (account) => {
    const person = {
      id: account.id,
      name: account.name,
      email: account.email,
      type: account.type
    };
    setUser(person);
    writeJSON("p2p_user", person);
    changePage(account.type === "admin" ? "admin" : "dashboard");
  };

  const logOut = () => {
    setUser(null);
    setNotes([]);
    localStorage.removeItem("p2p_user");
    showToast("You have been logged out.");
    changePage("home");
  };

  const submitAuth = async (register) => {
    const name = authForm.name.trim();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;

    if (register && (!name || !email || !password))
      return showToast("Please enter your name, email and a password.", "error");
    if (!register && (!email || !password))
      return showToast("Please enter your email and password.", "error");
    if (!email.includes("@"))
      return showToast("That email address doesn't look right.", "error");
    if (password.length < 6)
      return showToast("Use a password with at least 6 characters.", "error");

    try {
      const data = await api(register ? "/register" : "/login", {
        method: "POST",
        body: JSON.stringify(register
          ? { name, email, password, type: accountType }
          : { email, password })
      });
      showToast(register ? `Welcome to Plate2Plate, ${name}.` : `Welcome back, ${data.user.name}.`);
      logIn(data.user);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  /* ---------- donating, editing, deleting ---------- */

  const submitDonation = async () => {
    const d = donationForm;
    if (!user) return changePage("login");
    if (!d.name || !d.category || !d.diet || !d.quantity || !d.servings || !d.location || !d.pickupDate || !d.pickupFrom || !d.pickupTo || !d.cookedAt || !d.safeHours || !d.condition || !d.phone || !d.description)
      return showToast("Please fill in every field so recipients have the full picture.", "error");
    if (!/^\d{10}$/.test(d.phone.replace(/\s/g, "")))
      return showToast("Enter a 10 digit phone number. It is shown only after you confirm a request.", "error");

    const pickupStart = new Date(`${d.pickupDate}T${d.pickupFrom}`).getTime();
    const pickupEnd = new Date(`${d.pickupDate}T${d.pickupTo}`).getTime();
    const cookedAt = new Date(d.cookedAt).getTime();
    const safeUntil = cookedAt + Number(d.safeHours) * HOUR;
    if (pickupEnd <= pickupStart) return showToast("The pickup window must end after it starts.", "error");
    if (pickupEnd < Date.now()) return showToast("That pickup window has already passed.", "error");
    if (safeUntil < pickupStart) return showToast("The food would no longer be safe when pickup starts. Move the window earlier.", "error");
    if (!safety.every(Boolean)) return showToast("Please confirm all three food safety checks.", "error");

    const body = {
      owner_id: user.id, name: d.name, category: d.category, diet: d.diet, quantity: d.quantity,
      servings: Number(d.servings), location: d.location, pickup_start: new Date(pickupStart).toISOString(),
      pickup_end: new Date(pickupEnd).toISOString(), cooked_at: new Date(cookedAt).toISOString(),
      safe_until: new Date(safeUntil).toISOString(), condition: d.condition, source: user.name,
      image: d.photo || CATEGORY_IMAGES[d.category], description: d.description, phone: d.phone
    };

    try {
      const path = editingId ? `/food/${editingId}` : "/food";
      const data = await api(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(body) });
      if (editingId) setFoodList((list) => list.map((f) => f.id === editingId ? mapFood(data.food) : f));
      else setFoodList((list) => [mapFood(data.food), ...list]);
      setEditingId(null);
      setDonationForm(EMPTY_DONATION);
      setSafety(SAFETY_CHECKS.map(() => false));
      showToast(editingId ? "Your listing is updated." : "Your food is listed. Recipients can now request it.");
      changePage("dashboard");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const startEdit = (food) => {
    setEditingId(food.id);
    setDonationForm({
      name: food.name, category: food.category, diet: food.diet, quantity: food.quantity,
      servings: String(food.servings), location: food.location, pickupDate: toDateInput(food.pickupStart),
      pickupFrom: toTimeInput(food.pickupStart), pickupTo: toTimeInput(food.pickupEnd),
      cookedAt: toLocalInput(food.cookedAt), safeHours: String(Math.round((food.safeUntil - food.cookedAt) / HOUR)),
      condition: food.condition, phone: food.phone, photo: food.image || "", description: food.description
    });
    setSafety(SAFETY_CHECKS.map(() => false));
    changePage("donate", { edit: true });
  };

  const deleteListing = async (food) => {
    if (!window.confirm(`Delete "${food.name}"? This cannot be undone.`)) return;
    try {
      await api(`/food/${food.id}`, { method: "DELETE", body: JSON.stringify({ owner_id: user.id }) });
      setFoodList((list) => list.filter((f) => f.id !== food.id));
      showToast(`${food.name} was deleted.`);
    } catch (error) { showToast(error.message, "error"); }
  };

  const requestFood = async (food) => {
    if (!user) { showToast("Please log in to request food.", "error"); return changePage("login"); }
    if (sameId(food.ownerId, user.id)) return showToast("This is your own listing.", "error");
    if (food.status !== "AVAILABLE") return showToast("This listing is no longer available.", "error");
    const wanted = Number(requestServings);
    if (!Number.isInteger(wanted) || wanted < 1 || wanted > food.servings) return showToast(`Choose between 1 and ${food.servings} servings.`, "error");
    if (!canCollect) return showToast("Please confirm you can collect during the pickup window.", "error");
    try {
      const data = await api(`/food/${food.id}/request`, { method: "POST", body: JSON.stringify({ requester_id: user.id, requested_servings: wanted }) });
      await loadFoods();
      await loadNotes();
      setRequestServings("");
      setCanCollect(false);
      showToast(data.message || `${food.name} requested. The donor will confirm it.`);
      changePage("dashboard");
    } catch (error) { showToast(error.message, "error"); }
  };

  const moveStatus = async (food) => {
    const next = NEXT_STATUS[food.status];
    if (!next) return;
    try {
      await api(`/food/${food.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, actor_id: user.id }) });
      await loadFoods();
      await loadNotes();
      showToast(`${food.name} is now ${next.toLowerCase()}.`);
    } catch (error) { showToast(error.message, "error"); }
  };

  const cancelRequest = async (food) => {
    try {
      await api(`/food/${food.id}/cancel`, { method: "PATCH", body: JSON.stringify({ requester_id: user.id }) });
      await loadFoods();
      await loadNotes();
      showToast(`Your request for ${food.name} was cancelled.`);
    } catch (error) { showToast(error.message, "error"); }
  };

  const rateFood = async (food, answer) => {
    try {
      await api(`/food/${food.id}/rating`, { method: "PATCH", body: JSON.stringify({ rating: answer, requester_id: user.id }) });
      setFoodList((list) => list.map((f) => f.id === food.id ? { ...f, rating: answer } : f));
      showToast("Thanks for the feedback.");
    } catch (error) { showToast(error.message, "error"); }
  };

  const reportFood = async (food) => {
    try {
      await api(`/food/${food.id}/report`, { method: "PATCH" });
      setFoodList((list) => list.map((f) => f.id === food.id ? { ...f, reported: true } : f));
      showToast("Thank you for reporting this listing. It will be reviewed.");
    } catch (error) { showToast(error.message, "error"); }
  };

  const submitContribution = async () => {
    const { name, email, occasion } = contributionForm;
    if (!name || !email || !occasion) return showToast("Please add your name, email and the occasion.", "error");
    try {
      await api("/contributions", {
        method: "POST",
        body: JSON.stringify({ name, email, occasion, contribution_date: contributionForm.date || null, date: contributionForm.date || null, share: contributionForm.share, servings: Number(contributionForm.servings) || null, message: contributionForm.message })
      });
      showToast(`Thank you, ${name}. Your plan to share your ${occasion.toLowerCase()} has been noted.`);
      setContributionForm(EMPTY_CONTRIBUTION);
    } catch (error) { showToast(error.message, "error"); }
  };

  /* ---------- notifications ---------- */

  const clearNotes = async () => {
    try {
      await api(`/notifications/${user.id}`, { method: "DELETE" });
      setNotes([]);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  /* ---------- admin ---------- */

  const submitAdminLogin = async () => {
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;

    if (!email || !password)
      return showToast("Please enter your email and password.", "error");

    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (data.user.type !== "admin")
        return showToast("This account is not an admin account.", "error");

      showToast(`Welcome, ${data.user.name}.`);
      logIn(data.user);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const loadAdmin = async () => {
    if (user?.type !== "admin") return;
    setAdminNote("");

    try {
      const data = await api(`/admin/users?admin_id=${user.id}`);
      setAdminUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      setAdminUsers(null);
      setAdminNote(`Users could not be loaded: ${error.message}`);
    }

    try {
      const data = await api(`/admin/contributions?admin_id=${user.id}`);
      setAdminContributions(Array.isArray(data) ? data : data.contributions || []);
    } catch {
      setAdminContributions(null);
    }

    loadFoods();
  };

  const deleteAnyListing = async (food) => {
    if (!window.confirm(`Delete "${food.name}" for everyone? This cannot be undone.`)) return;
    try {
      await api(`/admin/food/${food.id}`, {
        method: "DELETE",
        body: JSON.stringify({ admin_id: user.id })
      });
      setFoodList((list) => list.filter((f) => f.id !== food.id));
      showToast(`${food.name} was deleted.`);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const dismissReport = async (food) => {
    try {
      await api(`/admin/food/${food.id}/dismiss-report`, {
        method: "PATCH",
        body: JSON.stringify({ admin_id: user.id })
      });
      setFoodList((list) => list.map((f) => (f.id === food.id ? { ...f, reported: false } : f)));
      showToast("Report dismissed.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  /* =========================================================
     WHAT TO SHOW
     Each page lives in its own file. App passes them the data
     and the functions they need as props.
     ========================================================= */

  const availableProps = {
    t, search, setSearch, category, setCategory, vegOnly, setVegOnly,
    area, setArea, sort, setSort, filteredFood, changePage, viewFood, safeText
  };

  const renderPage = () => {
    switch (page) {
      case "available":
        return <AvailablePage {...availableProps} />;

      case "details":
        return (
          <DetailsPage
            t={t}
            foodList={foodList}
            selectedId={selectedId}
            user={user}
            changePage={changePage}
            safeText={safeText}
            pickupText={pickupText}
            dayWord={dayWord}
            requestServings={requestServings}
            setRequestServings={setRequestServings}
            canCollect={canCollect}
            setCanCollect={setCanCollect}
            requestFood={requestFood}
            reportFood={reportFood}
            availableProps={availableProps}
          />
        );

      case "donate":
        return (
          <DonatePage
            user={user}
            editingId={editingId}
            donationForm={donationForm}
            setDonation={setDonation}
            setDonationForm={setDonationForm}
            safety={safety}
            toggleSafety={toggleSafety}
            choosePhoto={choosePhoto}
            submitDonation={submitDonation}
            safeText={safeText}
            changePage={changePage}
          />
        );

      case "login":
      case "register":
        return (
          <AuthPage
            register={page === "register"}
            authForm={authForm}
            setAuth={setAuth}
            accountType={accountType}
            setAccountType={setAccountType}
            submitAuth={submitAuth}
            changePage={changePage}
          />
        );

      case "adminLogin":
        return (
          <AdminLoginPage
            authForm={authForm}
            setAuth={setAuth}
            submitAdminLogin={submitAdminLogin}
            changePage={changePage}
          />
        );

      case "admin":
        return (
          <AdminPage
            user={user}
            foodList={foodList}
            adminUsers={adminUsers}
            adminContributions={adminContributions}
            adminNote={adminNote}
            refreshAdmin={loadAdmin}
            deleteAnyListing={deleteAnyListing}
            dismissReport={dismissReport}
            pickupText={pickupText}
            t={t}
            changePage={changePage}
          />
        );

      case "dashboard":
        // Admins have their own dashboard.
        if (user?.type === "admin")
          return (
            <AdminPage
              user={user}
              foodList={foodList}
              adminUsers={adminUsers}
              adminContributions={adminContributions}
              adminNote={adminNote}
              refreshAdmin={loadAdmin}
              deleteAnyListing={deleteAnyListing}
              dismissReport={dismissReport}
              pickupText={pickupText}
              t={t}
              changePage={changePage}
            />
          );

        return (
          <DashboardPage
            user={user}
            foodList={foodList}
            notes={notes}
            clearNotes={clearNotes}
            t={t}
            pickupText={pickupText}
            dayWord={dayWord}
            moveStatus={moveStatus}
            startEdit={startEdit}
            deleteListing={deleteListing}
            cancelRequest={cancelRequest}
            rateFood={rateFood}
            changePage={changePage}
          />
        );

      case "who":
        return <WhoPage changePage={changePage} />;

      case "safety":
        return <SafetyPage t={t} changePage={changePage} />;

      case "contribution":
        return (
          <ContributionPage
            contributionForm={contributionForm}
            setContribution={setContribution}
            submitContribution={submitContribution}
          />
        );

      default:
        return (
          <HomePage
            t={t}
            liveFood={liveFood}
            openFood={openFood}
            collectedFood={collectedFood}
            inProgress={inProgress}
            selectedHomeCategory={selectedHomeCategory}
            setSelectedHomeCategory={setSelectedHomeCategory}
            showAllAreas={showAllAreas}
            setShowAllAreas={setShowAllAreas}
            setArea={setArea}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            changePage={changePage}
            viewFood={viewFood}
            safeText={safeText}
          />
        );
    }
  };

  return (
    <>
      <Navbar
        activeNav={activeNav}
        user={user}
        changePage={changePage}
        goToSection={goToSection}
        logOut={logOut}
      />

      {/* One simple fade each time the page changes */}
      <main key={page} className="page-fade">
        {renderPage()}
      </main>

      <Footer changePage={changePage} goToSection={goToSection} t={t} user={user} />
    </>
  );
}
