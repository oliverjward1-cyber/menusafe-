/* mise admin — screens + customer drawer (exported to window) */

var PLAN_COLORS = { core: "#52B788", plus: "#2D6A4F", multi: "#D4A017" };

/* ============ metrics ============ */
function computeMetrics(D) {
  var subs = D.CUSTOMERS;
  var mrr = subs.filter(function (c) { return c.status === "active" || c.status === "past_due"; })
    .reduce(function (a, c) { return a + D.PLANS[c.plan].price; }, 0);
  var active = subs.filter(function (c) { return c.status === "active"; }).length;
  var trials = subs.filter(function (c) { return c.status === "trial"; }).length;
  var revMonth = D.INVOICES.filter(function (i) { return i.status === "paid" && i.date >= "2026-05-01"; })
    .reduce(function (a, i) { return a + i.amount; }, 0);
  var failed = D.INVOICES.filter(function (i) { return i.status === "failed"; });
  var failedSum = failed.reduce(function (a, i) { return a + i.amount; }, 0);
  var newSignups = subs.filter(function (c) { return c.since >= "2026-05-05"; }).length;
  var wlPending = D.WAITLIST.filter(function (w) { return w.status === "pending"; }).length;
  var wlInvited = D.WAITLIST.filter(function (w) { return w.status === "invited"; }).length;
  return { mrr: mrr, active: active, trials: trials, revMonth: revMonth, failed: failed,
    failedSum: failedSum, newSignups: newSignups, wlPending: wlPending, wlInvited: wlInvited };
}

/* ============ OVERVIEW ============ */
function OverviewScreen(props) {
  var D = props.data, A = props.actions, m = computeMetrics(D), layout = props.layout;
  var planMix = ["core", "plus", "multi"].map(function (p) {
    return { name: D.PLANS[p].name, value: D.CUSTOMERS.filter(function (c) { return c.plan === p && c.status !== "cancelled"; }).length, color: PLAN_COLORS[p] };
  });

  var kpis = [
    <Kpi key="mrr" icon="pound" label="MRR" value={gbp(m.mrr)} delta={9} foot="vs last month" />,
    <Kpi key="act" icon="customers" label="Active subscribers" value={m.active} delta={5} foot={m.trials + " on trial"} />,
    <Kpi key="rev" icon="billing" label="Revenue this month" value={gbp(m.revMonth)} delta={12} foot="collected" />,
    <Kpi key="new" icon="up" label="New signups (30d)" value={m.newSignups} delta={20} foot="across all plans" />,
    <Kpi key="wl" icon="waitlist" label="Waitlist" value={m.wlPending} foot={m.wlInvited + " invited"} />,
    <Kpi key="fail" icon="alert" label="Failed payments" value={gbp(m.failedSum)} alert={true} foot={m.failed.length + " invoices need action"} />
  ];

  var failBanner = m.failed.length ? (
    <div className="banner">
      <Icon name="alert" />
      <div className="b-txt"><b>{m.failed.length} payments failed</b> totalling {gbp(m.failedSum)}. Retry the charge or contact the customer.</div>
      <button className="btn btn-ghost btn-sm" onClick={function () { A.go("billing"); }}>Review billing</button>
    </div>
  ) : null;

  var funnelCard = (
    <div className="card">
      <div className="card-head"><h3>Trial conversion funnel</h3><span className="sub">All time</span></div>
      <div className="card-body">
        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
          {[
            { label: "Signups", value: D.TRIAL_FUNNEL.signups, color: "var(--info)" },
            { label: "Active trials", value: D.TRIAL_FUNNEL.activeTrials, color: "var(--warn)" },
            { label: "Converted", value: D.TRIAL_FUNNEL.converted, color: "var(--good)" },
          ].map(function(step, i) {
            return (
              <div key={step.label} style={{ flex: 1, textAlign: "center", padding: "16px 8px", borderRight: i < 2 ? "1px solid var(--hairline-2)" : "none" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: step.color, fontFamily: "var(--font-display)" }}>{step.value}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>{step.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--hairline-2)", fontSize: 13, color: "var(--ink-soft)" }}>
          <b style={{ color: "var(--good)" }}>{D.TRIAL_FUNNEL.conversionRate}% conversion rate</b> · {D.TRIAL_FUNNEL.converted} paying customers
        </div>
      </div>
    </div>
  );

  var acquisitionCard = (
    <div className="card">
      <div className="card-head"><h3>Acquisition sources</h3><span className="sub">How customers found you</span></div>
      <div className="card-body" style={{ padding: "6px 0" }}>
        {D.ACQUISITION_SOURCES.length === 0
          ? <div style={{ padding: "20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 13 }}>No acquisition data yet — add "How did you hear about us?" to signup</div>
          : D.ACQUISITION_SOURCES.sort(function(a,b){return b.count-a.count;}).map(function(s, i) {
              var max = D.ACQUISITION_SOURCES.reduce(function(m,x){return Math.max(m,x.count);}, 1);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px" }}>
                  <span style={{ width: 120, fontSize: 13, color: "var(--ink-soft)", flexShrink: 0 }}>{s.source}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--hairline-2)", borderRadius: 4 }}>
                    <div style={{ width: (s.count/max*100)+"%", height: 6, background: "var(--accent)", borderRadius: 4 }}></div>
                  </div>
                  <span style={{ width: 24, textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.count}</span>
                </div>
              );
            })
        }
      </div>
    </div>
  );

  var chartCard = (
    <div className="card">
      <div className="card-head"><h3>Monthly recurring revenue</h3><span className="sub">Last 9 months</span><span className="spacer" style={{ marginLeft: "auto" }}></span><span className="badge b-good plain"><Icon name="up" size={13} sw={2.4} /> +£158 this month</span></div>
      <div className="card-body"><BarChart data={D.MRR_TREND} /></div>
    </div>
  );
  var planCard = (
    <div className="card">
      <div className="card-head"><h3>Plan mix</h3></div>
      <div className="card-body"><Donut segments={planMix} /></div>
    </div>
  );
  var activityCard = (
    <div className="card">
      <div className="card-head"><h3>Recent activity</h3></div>
      <div className="card-body" style={{ padding: "6px 0" }}>
        {D.ACTIVITY.map(function (a, i) {
          var dot = { good: "var(--good)", bad: "var(--danger)", warn: "var(--warn)", trial: "var(--info)", neutral: "var(--ink-faint)" }[a.kind];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: i < D.ACTIVITY.length - 1 ? "1px solid var(--hairline-2)" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: dot, flex: "none" }}></span>
              <span style={{ fontSize: 13.5 }}><b style={{ color: "var(--green-900)" }}>{a.who}</b> {a.what}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-faint)" }}>{a.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (layout === "charts") {
    return (
      <div className="overview-grid charts">
        {failBanner}
        {chartCard}
        <div className="kpi-grid">{kpis}</div>
        <div className="lower-grid">{activityCard}{planCard}</div>
        <div className="lower-grid">{funnelCard}{acquisitionCard}</div>
      </div>
    );
  }
  if (layout === "dense") {
    return (
      <div className="overview-grid dense">
        {failBanner}
        <div className="kpi-grid">{kpis}</div>
        <div className="lower-grid">{chartCard}{activityCard}</div>
        {planCard}
        <div className="lower-grid">{funnelCard}{acquisitionCard}</div>
      </div>
    );
  }
  // cards (default)
  return (
    <div className="overview-grid cards">
      {failBanner}
      <div className="kpi-grid">{kpis}</div>
      <div className="lower-grid">{chartCard}{planCard}</div>
      {activityCard}
      <div className="lower-grid">{funnelCard}{acquisitionCard}</div>
    </div>
  );
}

/* ============ CUSTOMERS ============ */
function CustomersScreen(props) {
  var D = props.data, A = props.actions;
  var _q = React.useState(""), q = _q[0], setQ = _q[1];
  var _f = React.useState("all"), f = _f[0], setF = _f[1];
  var filters = [["all", "All"], ["active", "Active"], ["trial", "Trial"], ["past_due", "Past due"], ["paused", "Paused"], ["cancelled", "Cancelled"]];
  var rows = D.CUSTOMERS.filter(function (c) {
    if (f !== "all" && c.status !== f) return false;
    if (q && (c.name + " " + c.contact + " " + c.city + " " + c.email).toLowerCase().indexOf(q.toLowerCase()) === -1) return false;
    return true;
  });
  return (
    <div className="card table-card">
      <div className="table-tools">
        <div className="search"><Icon name="search" /><input placeholder="Search restaurants, owners, cities…" value={q} onChange={function (e) { setQ(e.target.value); }} /></div>
        <div className="filter-pills">
          {filters.map(function (x) { return <button key={x[0]} className={"pill" + (f === x[0] ? " active" : "")} onClick={function () { setF(x[0]); }}>{x[1]}</button>; })}
        </div>
        <span className="spacer"></span>
        <button className="btn btn-ghost btn-sm" onClick={function () { A.exportCSV(rows, "customers"); }}><Icon name="download" size={15} /> Export</button>
      </div>
      <div className="table-scroll">
        <table className="tbl">
          <thead><tr><th>Restaurant</th><th>Plan</th><th>Status</th><th>Health</th><th className="num">MRR</th><th>Sites</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {rows.map(function (c) {
              var billable = c.status === "active" || c.status === "past_due";
              return (
                <tr key={c.id} onClick={function () { A.openCustomer(c.id); }}>
                  <td><div className="cell-main"><RestMark name={c.name} /><div><div className="cell-strong">{c.name}</div><div className="cell-sub">{c.contact} · {c.city}</div></div></div></td>
                  <td>{D.PLANS[c.plan].name}</td>
                  <td><Badge status={c.status} /></td>
                  <td><span className={"badge plain b-" + c.healthStatus}>{c.healthScore}%</span></td>
                  <td className="num tnum">{billable ? gbp(D.PLANS[c.plan].price) : "—"}</td>
                  <td className="tnum">{c.sites}</td>
                  <td>{fmtShort(c.since)}</td>
                  <td className="num"><Icon name="caret" size={16} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="tbl-foot"><span>{rows.length} of {D.CUSTOMERS.length} restaurants</span><span>Tip: click any row to manage the account</span></div>
    </div>
  );
}

/* ============ SUBSCRIPTIONS & PLANS ============ */
function SubsScreen(props) {
  var D = props.data, A = props.actions;
  var plans = ["core", "plus", "multi"].map(function (p) {
    var subs = D.CUSTOMERS.filter(function (c) { return c.plan === p && (c.status === "active" || c.status === "past_due"); });
    return { p: D.PLANS[p], count: subs.length, mrr: subs.length * D.PLANS[p].price };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="banner" style={{ background: "var(--info-bg)", borderColor: "#c7d6e0", color: "var(--info)" }}>
        <Icon name="alert" />
        <div className="b-txt">Pricing isn't finalised yet — these tiers are placeholders. <b>Edit names &amp; prices</b> here whenever you lock it in.</div>
      </div>
      <div className="plans-grid">
        {plans.map(function (x) {
          return (
            <div className="card plan-card" key={x.p.id}>
              <span className="badge b-muted plain" style={{ position: "absolute", top: 16, right: 16 }}>{x.p.id}</span>
              <div className="pc-name">{x.p.name}</div>
              <div className="pc-price"><b>{gbp(x.p.price)}</b> / month</div>
              <div className="pc-blurb">{x.p.blurb}</div>
              <div className="pc-stats">
                <div className="pc-stat"><div className="v tnum">{x.count}</div><div className="k">Subscribers</div></div>
                <div className="pc-stat"><div className="v tnum">{gbp(x.mrr)}</div><div className="k">MRR</div></div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={function () { A.toast("Plan editing comes online when pricing is finalised"); }}><Icon name="swap" size={15} /> Edit plan</button>
            </div>
          );
        })}
      </div>
      <div className="card table-card">
        <div className="card-head"><h3>All subscriptions</h3><span className="sub">{D.CUSTOMERS.filter(function (c) { return c.status !== "cancelled"; }).length} active &amp; trialing</span>
          <span className="spacer" style={{ marginLeft: "auto" }}></span>
          <button className="btn btn-ghost btn-sm" onClick={function () { A.exportCSV(D.CUSTOMERS, "subscriptions"); }}><Icon name="download" size={15} /> Export</button>
        </div>
        <div className="table-scroll">
          <table className="tbl">
            <thead><tr><th>Restaurant</th><th>Plan</th><th>Status</th><th className="num">Monthly</th><th>Renews</th><th></th></tr></thead>
            <tbody>
              {D.CUSTOMERS.filter(function (c) { return c.status !== "cancelled"; }).map(function (c) {
                var billable = c.status === "active" || c.status === "past_due";
                return (
                  <tr key={c.id} onClick={function () { A.openCustomer(c.id); }}>
                    <td><div className="cell-main"><RestMark name={c.name} /><div><div className="cell-strong">{c.name}</div><div className="cell-sub">{c.email}</div></div></div></td>
                    <td>{D.PLANS[c.plan].name}</td>
                    <td><Badge status={c.status} /></td>
                    <td className="num tnum">{billable ? gbp(D.PLANS[c.plan].price) : "—"}</td>
                    <td>{c.status === "trial" ? "Trial ends soon" : "1st of month"}</td>
                    <td className="num"><button className="btn btn-quiet btn-sm" onClick={function (e) { e.stopPropagation(); A.openModal("plan", c.id); }}><Icon name="swap" size={15} /> Change</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ BILLING ============ */
function BillingScreen(props) {
  var D = props.data, A = props.actions;
  var _f = React.useState("all"), f = _f[0], setF = _f[1];
  var byId = {}; D.CUSTOMERS.forEach(function (c) { byId[c.id] = c; });
  var filters = [["all", "All"], ["paid", "Paid"], ["failed", "Failed"], ["refunded", "Refunded"]];
  var rows = D.INVOICES.filter(function (i) { return f === "all" || i.status === f; });
  var failedCount = D.INVOICES.filter(function (i) { return i.status === "failed"; }).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {failedCount ? (
        <div className="banner"><Icon name="alert" /><div className="b-txt"><b>{failedCount} failed payments</b> need attention. Retry or reach out before access is affected.</div><button className="btn btn-ghost btn-sm" onClick={function () { setF("failed"); }}>Show failed</button></div>
      ) : null}
      <div className="card table-card">
        <div className="table-tools">
          <div className="filter-pills">
            {filters.map(function (x) { return <button key={x[0]} className={"pill" + (f === x[0] ? " active" : "")} onClick={function () { setF(x[0]); }}>{x[1]}</button>; })}
          </div>
          <span className="spacer"></span>
          <button className="btn btn-ghost btn-sm" onClick={function () { A.exportCSV(rows.map(function (i) { return Object.assign({}, i, { customer: byId[i.cust].name }); }), "invoices"); }}><Icon name="download" size={15} /> Export</button>
        </div>
        <div className="table-scroll">
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Restaurant</th><th className="num">Amount</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(function (i) {
                var c = byId[i.cust];
                return (
                  <tr key={i.id} onClick={function () { A.openCustomer(c.id); }}>
                    <td className="cell-strong tnum">{i.id}</td>
                    <td><div className="cell-main"><RestMark name={c.name} /><span>{c.name}</span></div></td>
                    <td className="num tnum cell-strong">{gbp(i.amount)}</td>
                    <td>{fmtDate(i.date)}</td>
                    <td><Badge status={i.status} /></td>
                    <td className="num">
                      {i.status === "failed" ? <button className="btn btn-ghost btn-sm" onClick={function (e) { e.stopPropagation(); A.retry(i.id); }}><Icon name="refund" size={15} /> Retry</button> : null}
                      {i.status === "paid" ? <button className="btn btn-quiet btn-sm" onClick={function (e) { e.stopPropagation(); A.openModal("refund", i.id); }}>Refund</button> : null}
                      {i.status === "refunded" ? <span className="cell-sub">Refunded</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot"><span>{rows.length} invoices</span><span>Showing most recent first</span></div>
      </div>
    </div>
  );
}

/* ============ WAITLIST ============ */
function WaitlistScreen(props) {
  var D = props.data, A = props.actions;
  var _f = React.useState("all"), f = _f[0], setF = _f[1];
  var filters = [["all", "All"], ["pending", "Pending"], ["invited", "Invited"], ["joined", "Joined"]];
  var rows = D.WAITLIST.filter(function (w) { return f === "all" || w.status === f; });
  return (
    <div className="card table-card">
      <div className="table-tools">
        <div className="filter-pills">
          {filters.map(function (x) { return <button key={x[0]} className={"pill" + (f === x[0] ? " active" : "")} onClick={function () { setF(x[0]); }}>{x[1]}</button>; })}
        </div>
        <span className="spacer"></span>
        <button className="btn btn-ghost btn-sm" onClick={function () { A.openModal("announce", null); }}><Icon name="mail" size={15} /> <span className="hide-sm">Announce</span></button>
        <button className="btn btn-ghost btn-sm" onClick={function () { A.exportCSV(rows, "waitlist"); }}><Icon name="download" size={15} /> Export</button>
      </div>
      <div className="table-scroll">
        <table className="tbl">
          <thead><tr><th>Restaurant</th><th>Contact</th><th>City</th><th>Joined list</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(function (w) {
              return (
                <tr key={w.id} onClick={function (e) { e.preventDefault(); }} style={{ cursor: "default" }}>
                  <td><div className="cell-main"><RestMark name={w.restaurant} /><div><div className="cell-strong">{w.restaurant}</div><div className="cell-sub">{w.email}</div></div></div></td>
                  <td>{w.name}</td>
                  <td>{w.city}</td>
                  <td>{fmtShort(w.date)}</td>
                  <td><Badge status={w.status} /></td>
                  <td className="num">
                    {w.status === "pending" ? <button className="btn btn-primary btn-sm" onClick={function () { A.invite(w.id); }}><Icon name="invite" size={15} /> Invite</button> : null}
                    {w.status === "invited" ? <button className="btn btn-ghost btn-sm" onClick={function () { A.toast("Reminder sent to " + w.restaurant); }}>Resend</button> : null}
                    {w.status === "joined" ? <span className="cell-sub">Converted ✓</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="tbl-foot"><span>{rows.length} on the waitlist</span><span>Invites send an early-access link with 30 days free</span></div>
    </div>
  );
}

/* ============ SECURITY ============ */
function SecurityScreen(props) {
  var D = props.data, A = props.actions;
  var events = D.LOGIN_EVENTS || [];
  var sessions = D.USER_SESSIONS || [];
  var suspicious = events.filter(function(e) { return e.suspicious; });
  var planLimits = { core: 3, plus: 5, multi: 999 };

  // Group sessions by customer
  var sessionsByCustomer = {};
  sessions.forEach(function(s) {
    if (!sessionsByCustomer[s.restaurant_id]) sessionsByCustomer[s.restaurant_id] = [];
    sessionsByCustomer[s.restaurant_id].push(s);
  });

  // Customers near or at limit
  var atLimit = D.CUSTOMERS.filter(function(c) {
    var count = (sessionsByCustomer[c.id] || []).length;
    var limit = planLimits[c.plan] || 3;
    return count >= limit;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary cards */}
      <div className="kpi-grid">
        <Kpi icon="alert" label="Suspicious logins" value={suspicious.length} alert={suspicious.length > 0} foot="flagged in last 7 days" />
        <Kpi icon="customers" label="Active sessions" value={sessions.length} foot="across all accounts" />
        <Kpi icon="overview" label="At device limit" value={atLimit.length} alert={atLimit.length > 0} foot="accounts hitting cap" />
        <Kpi icon="billing" label="Potential sharing" value={suspicious.length} alert={suspicious.length > 0} foot="accounts to review" />
      </div>

      {/* Suspicious logins */}
      {suspicious.length > 0 && (
        <div className="card table-card">
          <div className="card-head"><h3>⚠ Suspicious login activity</h3><span className="sub">Same account from distant locations within 4 hours</span></div>
          <div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>Restaurant</th><th>City</th><th>IP</th><th>Time</th><th>Distance</th><th></th></tr></thead>
              <tbody>
                {suspicious.map(function(e, i) {
                  var cust = D.CUSTOMERS.find(function(c) { return c.id === e.restaurant_id; }) || {};
                  return (
                    <tr key={i}>
                      <td><div className="cell-main"><RestMark name={cust.name || e.restaurant_id} /><span className="cell-strong">{cust.name || e.restaurant_id}</span></div></td>
                      <td>{e.city || "Unknown"}</td>
                      <td className="tnum cell-sub">{e.ip_address || "—"}</td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString("en-GB") : "—"}</td>
                      <td><span className="badge b-bad plain">Flagged</span></td>
                      <td className="num"><button className="btn btn-ghost btn-sm" onClick={function() { A.openCustomer(cust.id); }}>View account</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounts at session limit */}
      <div className="card table-card">
        <div className="card-head"><h3>Session usage by account</h3><span className="sub">Active devices per restaurant — limits enforced by plan</span>
          <span className="spacer" style={{ marginLeft: "auto" }}></span>
          <button className="btn btn-ghost btn-sm" onClick={function() { A.exportCSV(D.CUSTOMERS.map(function(c) {
            return { name: c.name, plan: c.plan, sessions: (sessionsByCustomer[c.id] || []).length, limit: planLimits[c.plan] || 3 };
          }), "sessions"); }}><Icon name="download" size={15} /> Export</button>
        </div>
        <div className="table-scroll">
          <table className="tbl">
            <thead><tr><th>Restaurant</th><th>Plan</th><th className="num">Sessions</th><th className="num">Limit</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {D.CUSTOMERS.map(function(c) {
                var count = (sessionsByCustomer[c.id] || []).length;
                var limit = planLimits[c.plan] || 3;
                var pct = limit < 999 ? count / limit : 0;
                var status = count >= limit ? "at_limit" : pct >= 0.7 ? "near_limit" : "ok";
                return (
                  <tr key={c.id} onClick={function() { A.openCustomer(c.id); }}>
                    <td><div className="cell-main"><RestMark name={c.name} /><div><div className="cell-strong">{c.name}</div><div className="cell-sub">{c.city}</div></div></div></td>
                    <td>{D.PLANS[c.plan] ? D.PLANS[c.plan].name : c.plan}</td>
                    <td className="num tnum">{count}</td>
                    <td className="num tnum">{limit < 999 ? limit : "∞"}</td>
                    <td>
                      {status === "at_limit" && <span className="badge b-bad plain">At limit</span>}
                      {status === "near_limit" && <span className="badge b-warn plain">Near limit</span>}
                      {status === "ok" && <span className="badge b-good plain">OK</span>}
                    </td>
                    <td className="num">
                      {status === "at_limit" && <button className="btn btn-primary btn-sm" onClick={function(e) { e.stopPropagation(); A.toast("Upsell email queued to " + c.contact); }}>Upsell</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent login events */}
      <div className="card table-card">
        <div className="card-head"><h3>Recent login events</h3><span className="sub">All logins across all accounts, newest first</span></div>
        {events.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-faint)", fontSize: 14 }}>No login events recorded yet — they appear here once customers log in.</div>
        ) : (
          <div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>Restaurant</th><th>City</th><th>Device</th><th>IP</th><th>Time</th><th>Flag</th></tr></thead>
              <tbody>
                {events.slice(0, 50).map(function(e, i) {
                  var cust = D.CUSTOMERS.find(function(c) { return c.id === e.restaurant_id; }) || {};
                  return (
                    <tr key={i} onClick={function() { if (cust.id) A.openCustomer(cust.id); }}>
                      <td><div className="cell-main"><RestMark name={cust.name || "?"} /><span>{cust.name || e.restaurant_id}</span></div></td>
                      <td>{e.city || "—"}</td>
                      <td className="cell-sub">{e.device_hint || "—"}</td>
                      <td className="tnum cell-sub">{e.ip_address || "—"}</td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString("en-GB") : "—"}</td>
                      <td>{e.suspicious ? <span className="badge b-bad plain">⚠ Suspicious</span> : <span className="badge b-good plain">Clean</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ AI COSTS ============ */
function AiCostsScreen(props) {
  var D = props.data;
  var U = D.AI_USAGE || { totalCostUsd: 0, totalCalls: 0, byEndpoint: [], dailyCost: [], model: 'claude-haiku-4-5-20251001', inputCostPerM: 0.80, outputCostPerM: 4.00 };

  var ENDPOINT_LABELS = {
    'invoice': 'Invoice scanner',
    'ai-describe': 'Recipe AI describe',
    'allergen-import': 'Allergen sheet import',
    'menu-import': 'Menu photo import',
    'categorise': 'Ingredient categoriser',
  };

  var maxDaily = Math.max.apply(null, U.dailyCost.map(function (d) { return d.cost; }).concat([0.001]));

  return (
    <div className="space-y" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="cell-sub" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>30-day spend</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: U.totalCostUsd > 10 ? "var(--bad)" : U.totalCostUsd > 2 ? "var(--warn)" : "var(--good)" }}>
            ${U.totalCostUsd.toFixed(4)}
          </div>
          <div className="cell-sub" style={{ marginTop: 4 }}>USD · Anthropic API</div>
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="cell-sub" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total AI calls</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>{U.totalCalls}</div>
          <div className="cell-sub" style={{ marginTop: 4 }}>last 30 days</div>
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="cell-sub" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Avg cost/call</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            {U.totalCalls > 0 ? ("$" + (U.totalCostUsd / U.totalCalls).toFixed(5)) : "—"}
          </div>
          <div className="cell-sub" style={{ marginTop: 4 }}>USD</div>
        </div>
      </div>

      {/* Daily cost bar chart */}
      <div className="card">
        <div className="card-head"><h3>Daily cost — last 14 days</h3><span className="sub">{U.model}</span></div>
        <div className="card-body">
          {U.dailyCost.length === 0 ? (
            <p className="cell-sub" style={{ textAlign: "center", padding: "24px 0" }}>No AI calls recorded yet</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {U.dailyCost.map(function (d) {
                var pct = maxDaily > 0 ? (d.cost / maxDaily) * 100 : 0;
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div title={"$" + d.cost.toFixed(5)} style={{ width: "100%", height: Math.max(pct * 0.6, d.cost > 0 ? 3 : 0) + "px", background: d.cost > 0 ? "var(--accent)" : "var(--hairline-2)", borderRadius: 3, transition: "height .2s" }}></div>
                    <div style={{ fontSize: 9, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>{d.date}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* By endpoint */}
      <div className="card">
        <div className="card-head"><h3>Cost by feature</h3><span className="sub">last 30 days</span></div>
        {U.byEndpoint.length === 0 ? (
          <div className="card-body"><p className="cell-sub" style={{ textAlign: "center", padding: "16px 0" }}>No AI calls yet — costs will appear here after first use</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                <th>Feature</th>
                <th className="tnum">Calls</th>
                <th className="tnum">Input tokens</th>
                <th className="tnum">Output tokens</th>
                <th className="tnum">Cost (USD)</th>
                <th className="tnum">Avg/call</th>
              </tr></thead>
              <tbody>
                {U.byEndpoint.sort(function (a, b) { return b.cost - a.cost; }).map(function (ep) {
                  return (
                    <tr key={ep.endpoint}>
                      <td><span style={{ fontWeight: 500 }}>{ENDPOINT_LABELS[ep.endpoint] || ep.endpoint}</span></td>
                      <td className="tnum">{ep.calls}</td>
                      <td className="tnum">{ep.inputTokens.toLocaleString()}</td>
                      <td className="tnum">{ep.outputTokens.toLocaleString()}</td>
                      <td className="tnum" style={{ fontWeight: 600 }}>${ep.cost.toFixed(4)}</td>
                      <td className="tnum cell-sub">${(ep.cost / ep.calls).toFixed(5)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pricing reference */}
      <div className="card">
        <div className="card-head"><h3>Pricing reference</h3><span className="sub">Anthropic {U.model}</span></div>
        <div className="card-body" style={{ display: "flex", gap: 24 }}>
          <div>
            <div className="cell-sub" style={{ fontSize: 11, marginBottom: 4 }}>Input tokens</div>
            <div style={{ fontWeight: 600 }}>${U.inputCostPerM} <span className="cell-sub">/ million</span></div>
          </div>
          <div>
            <div className="cell-sub" style={{ fontSize: 11, marginBottom: 4 }}>Output tokens</div>
            <div style={{ fontWeight: 600 }}>${U.outputCostPerM} <span className="cell-sub">/ million</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  computeMetrics: computeMetrics, PLAN_COLORS: PLAN_COLORS,
  OverviewScreen: OverviewScreen, CustomersScreen: CustomersScreen,
  SubsScreen: SubsScreen, BillingScreen: BillingScreen, WaitlistScreen: WaitlistScreen,
  SecurityScreen: SecurityScreen, AiCostsScreen: AiCostsScreen
});
