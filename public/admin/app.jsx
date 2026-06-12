/* HospoPilot admin — app shell, routing, actions, tweaks */

var NAV = [
  { id: "overview",  label: "Overview",      icon: "overview" },
  { id: "customers", label: "Customers",     icon: "customers" },
  { id: "subs",      label: "Subscriptions", icon: "subs" },
  { id: "billing",   label: "Billing",       icon: "billing" },
  { id: "waitlist",  label: "Waitlist",      icon: "waitlist" },
  { id: "security",  label: "Security",      icon: "alert" },
  { id: "support",   label: "Support",       icon: "inbox" }
];
var TITLES = {
  overview:  ["Overview", "How the business is doing today"],
  customers: ["Customers", "Every restaurant on HospoPilot"],
  subs:      ["Subscriptions & plans", "Who's on what, and your plan mix"],
  billing:   ["Billing", "Payments, invoices & refunds"],
  waitlist:  ["Waitlist", "Early-access signups to invite"],
  security:  ["Security & sessions", "Login activity, suspicious access and plan enforcement"],
  support:   ["Support inbox", "Customer emails sent to your support address"]
};

var HospoPilotMark = (
  <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <rect x="0" y="0" width="19.5" height="19.5" rx="4" fill="#52B788" opacity=".55"/>
    <rect x="24.5" y="0" width="19.5" height="19.5" rx="4" fill="#52B788" opacity=".55"/>
    <rect x="0" y="24.5" width="19.5" height="19.5" rx="4" fill="#52B788" opacity=".55"/>
    <rect x="24.5" y="24.5" width="19.5" height="19.5" rx="4" fill="#D4A017"/>
  </svg>
);

var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "overviewLayout": "cards",
  "nav": "sidebar",
  "density": "regular",
  "accent": "#D4A017"
}/*EDITMODE-END*/;

function App() {
  var tw = useTweaks(TWEAK_DEFAULTS), t = tw[0], setTweak = tw[1];
  var _r = React.useState("overview"), route = _r[0], setRoute = _r[1];
  var _d = React.useState(window.HOSPOPILOT_DATA), D = _d[0], setD = _d[1];
  var _sel = React.useState(null), selId = _sel[0], setSel = _sel[1];
  var _mod = React.useState(null), modal = _mod[0], setModal = _mod[1];
  var _toasts = React.useState([]), toasts = _toasts[0], setToasts = _toasts[1];
  var _open = React.useState(false), navOpen = _open[0], setNavOpen = _open[1];

  React.useEffect(function () { document.documentElement.style.setProperty("--accent", t.accent); }, [t.accent]);

  function pushToast(msg) {
    var id = Date.now() + Math.random();
    setToasts(function (ts) { return ts.concat([{ id: id, msg: msg }]); });
    setTimeout(function () { setToasts(function (ts) { return ts.filter(function (x) { return x.id !== id; }); }); }, 2600);
  }
  function patchCustomer(id, patch) {
    setD(function (prev) {
      return Object.assign({}, prev, { CUSTOMERS: prev.CUSTOMERS.map(function (c) { return c.id === id ? Object.assign({}, c, patch) : c; }) });
    });
  }
  function patchInvoice(id, patch) {
    setD(function (prev) {
      return Object.assign({}, prev, { INVOICES: prev.INVOICES.map(function (i) { return i.id === id ? Object.assign({}, i, patch) : i; }) });
    });
  }
  function patchWait(id, patch) {
    setD(function (prev) {
      return Object.assign({}, prev, { WAITLIST: prev.WAITLIST.map(function (w) { return w.id === id ? Object.assign({}, w, patch) : w; }) });
    });
  }
  function exportCSV(rows, name) {
    if (!rows.length) { pushToast("Nothing to export"); return; }
    var cols = Object.keys(rows[0]);
    var lines = [cols.join(",")].concat(rows.map(function (r) {
      return cols.map(function (k) { var v = r[k] == null ? "" : String(r[k]); return '"' + v.replace(/"/g, '""') + '"'; }).join(",");
    }));
    var blob = new Blob([lines.join("\n")], { type: "text/csv" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "hospopilot-" + name + ".csv"; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    pushToast("Exported " + rows.length + " rows to CSV");
  }

  var selCust = selId ? D.CUSTOMERS.filter(function (c) { return c.id === selId; })[0] : null;

  var A = {
    go: function (r) { setRoute(r); setNavOpen(false); },
    openCustomer: function (id) { setSel(id); },
    closeCustomer: function () { setSel(null); },
    openModal: function (type, payload) { setModal({ type: type, payload: payload }); },
    closeModal: function () { setModal(null); },
    toast: pushToast,
    exportCSV: exportCSV,
    changePlan: function (id, plan) { patchCustomer(id, { plan: plan }); setModal(null); pushToast("Plan updated to " + D.PLANS[plan].name); },
    setStatus: function (id, status, verb) { patchCustomer(id, { status: status }); pushToast("Account " + verb); },
    refund: function (invId) { patchInvoice(invId, { status: "refunded" }); setModal(null); pushToast("Refund issued for " + invId); },
    retry: function (invId) { patchInvoice(invId, { status: "paid" }); pushToast("Payment retried — " + invId + " collected"); },
    credit: function (id, amt, days) { setModal(null); pushToast("Applied £" + amt + " credit + " + days + " free days"); },
    announce: function (aud, subj) { setModal(null); pushToast("Announcement queued to " + aud); },
    invite: function (wid) { patchWait(wid, { status: "invited" }); pushToast("Early-access invite sent"); },
    impersonate: function (c) { pushToast("Opening " + c.name + "'s account…"); },
    resetPassword: function (c) { pushToast("Password reset link sent to " + c.email); },
    email: function (c) { pushToast("Draft email started to " + c.contact); }
  };

  var wlPending = D.WAITLIST.filter(function (w) { return w.status === "pending"; }).length;

  function NavItems(props) {
    return NAV.map(function (n) {
      return (
        <button key={n.id} className={"nav-item" + (route === n.id ? " active" : "")} onClick={function () { A.go(n.id); }}>
          <Icon name={n.icon} />
          <span>{n.label}</span>
          {n.id === "waitlist" && wlPending ? <span className="nav-badge tnum">{wlPending}</span> : <span className="nav-ind"></span>}
        </button>
      );
    });
  }

  function renderScreen() {
    if (route === "overview") return <OverviewScreen data={D} actions={A} layout={t.overviewLayout} />;
    if (route === "customers") return <CustomersScreen data={D} actions={A} />;
    if (route === "subs") return <SubsScreen data={D} actions={A} />;
    if (route === "billing") return <BillingScreen data={D} actions={A} />;
    if (route === "waitlist") return <WaitlistScreen data={D} actions={A} />;
    if (route === "security") return <SecurityScreen data={D} actions={A} />;
    if (route === "support") return <SupportScreen data={D} actions={A} />;
    return null;
  }

  var title = TITLES[route];

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")} data-nav={t.nav === "top" ? "top" : "side"} data-density={t.density}>
      {/* sidebar */}
      <aside className="sidebar">
        <div className="brand">{HospoPilotMark}<span className="brand-name">HospoPilot</span><span className="brand-tag">Admin</span></div>
        <div className="nav-group-label">Manage</div>
        <NavItems />
        <div className="sidebar-foot">
          <div className="admin-chip"><span className="avatar">AW</span><div><div className="who">Ana Whitfield</div><div className="role">Founder · full access</div></div></div>
        </div>
      </aside>
      <div className="nav-scrim" onClick={function () { setNavOpen(false); }}></div>

      <div className="main">
        {/* top nav variant */}
        <div className="topnav">
          <div className="brand">{HospoPilotMark}<span className="brand-name">HospoPilot</span></div>
          <div className="topnav-tabs"><NavItems /></div>
          <div className="topnav-right"><span className="avatar">AW</span></div>
        </div>

        <header className="topbar">
          <button className="icon-btn burger" onClick={function () { setNavOpen(true); }} aria-label="Menu"><Icon name="menu" /></button>
          <div><div className="page-title">{title[0]}</div><div className="page-sub">{title[1]}</div></div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={function () { A.openModal("announce", null); }}><Icon name="mail" size={15} /> <span className="hide-sm">Announce</span></button>
            <button className="btn btn-primary btn-sm" onClick={function () { A.go("waitlist"); }}><Icon name="invite" size={15} /> <span className="hide-sm">Invite from waitlist</span></button>
          </div>
        </header>

        <main className="content">{renderScreen()}</main>
      </div>

      {/* drawer */}
      {selCust ? <CustomerDrawer cust={selCust} data={D} actions={A} onClose={A.closeCustomer} /> : null}

      {/* modals */}
      {modal && modal.type === "plan" ? <PlanModal cust={D.CUSTOMERS.filter(function (c) { return c.id === modal.payload; })[0]} data={D} onClose={A.closeModal} onConfirm={function (p) { A.changePlan(modal.payload, p); }} /> : null}
      {modal && modal.type === "refund" ? <RefundModal inv={D.INVOICES.filter(function (i) { return i.id === modal.payload; })[0]} onClose={A.closeModal} onConfirm={function () { A.refund(modal.payload); }} /> : null}
      {modal && modal.type === "credit" ? <CreditModal cust={D.CUSTOMERS.filter(function (c) { return c.id === modal.payload; })[0]} onClose={A.closeModal} onConfirm={function (amt, days) { A.credit(modal.payload, amt, days); }} /> : null}
      {modal && modal.type === "announce" ? <AnnounceModal onClose={A.closeModal} onConfirm={function (aud, subj) { A.announce(aud, subj); }} /> : null}
      {modal && modal.type === "cancel" ? <CancelModal cust={D.CUSTOMERS.filter(function (c) { return c.id === modal.payload; })[0]} onClose={A.closeModal} onConfirm={function (mode) { A.setStatus(modal.payload, mode, mode === "paused" ? "suspended" : "cancelled"); A.closeModal(); A.closeCustomer(); }} /> : null}

      <ToastHost toasts={toasts} />

      <TweaksPanel>
        <TweakSection label="Overview layout" />
        <TweakRadio label="Style" value={t.overviewLayout} options={["cards", "dense", "charts"]} onChange={function (v) { setTweak("overviewLayout", v); A.go("overview"); }} />
        <TweakSection label="Navigation" />
        <TweakRadio label="Position" value={t.nav} options={["sidebar", "top"]} onChange={function (v) { setTweak("nav", v); }} />
        <TweakSection label="Display" />
        <TweakRadio label="Density" value={t.density} options={["regular", "compact"]} onChange={function (v) { setTweak("density", v); }} />
        <TweakColor label="Accent" value={t.accent} options={["#D4A017", "#2D6A4F", "#3E5C76", "#C0492F"]} onChange={function (v) { setTweak("accent", v); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
