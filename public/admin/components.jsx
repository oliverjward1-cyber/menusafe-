/* HospoPilot admin — shared UI components (exported to window) */

/* ---------- formatters ---------- */
function gbp(n) { return "£" + Number(n).toLocaleString("en-GB"); }
function fmtDate(iso) {
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtShort(iso) {
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
}

/* ---------- icons ---------- */
function Icon(props) {
  var s = { width: props.size || 18, height: props.size || 18, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: props.sw || 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  var P = {
    overview: <g><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></g>,
    customers: <g><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.6-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><path d="M16 4.2a3.2 3.2 0 0 1 0 6"/><path d="M18 14.6c2 .7 3.4 2.6 3.4 5.4"/></g>,
    subs: <g><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/><path d="M7 14.5h4"/></g>,
    billing: <g><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/><circle cx="17" cy="14.5" r="1.4" fill="currentColor" stroke="none"/></g>,
    waitlist: <g><path d="M6 3h12"/><path d="M6 21h12"/><path d="M7 3c0 4 4 5 4 7.5 0 .8 2 .8 2 0C13 8 17 7 17 3"/><path d="M7 21c0-4 4-5 4-7.5"/><path d="M17 21c0-4-4-5-4-7.5"/></g>,
    search: <g><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/></g>,
    bell: <g><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></g>,
    plus: <g><path d="M12 5v14M5 12h14"/></g>,
    download: <g><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/></g>,
    caret: <path d="M9 6l6 6-6 6"/>,
    chevdown: <path d="M6 9l6 6 6-6"/>,
    close: <g><path d="M6 6l12 12M18 6L6 18"/></g>,
    up: <path d="M12 19V5M6 11l6-6 6 6"/>,
    down: <path d="M12 5v14M6 13l6 6 6-6"/>,
    check: <path d="M5 13l4 4L19 7"/>,
    checkCircle: <g><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></g>,
    alert: <g><path d="M12 3l9.5 16.5H2.5L12 3z"/><path d="M12 10v4.5M12 17.6v.1"/></g>,
    swap: <g><path d="M4 8h13l-3-3M20 16H7l3 3"/></g>,
    pause: <g><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></g>,
    refund: <g><path d="M3 9a9 9 0 1 1 1.5 5"/><path d="M3 4v5h5"/><path d="M12 8v4l2.5 2"/></g>,
    key: <g><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 4l3 3M14 6l2.5 2.5"/></g>,
    login: <g><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></g>,
    mail: <g><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></g>,
    invite: <g><path d="M16 11l2 2 4-4"/><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.6-5.5 5.5-5.5 1.5 0 2.9.6 3.9 1.6"/></g>,
    inbox: <g><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6l2-8z"/></g>,
    sites: <g><path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5"/></g>,
    menu: <g><path d="M4 6h16M4 12h16M4 18h16"/></g>,
    pound: <g><path d="M9 21h8"/><path d="M7 21c2-1 3-2 3-5V9a4 4 0 0 1 7-2.6"/><path d="M7 13h7"/></g>
  };
  return <svg style={{ flex: "none" }} {...s}>{P[props.name] || null}</svg>;
}

/* ---------- status badge ---------- */
var STATUS_MAP = {
  active:    { cls: "b-good",   label: "Active" },
  trial:     { cls: "b-info",   label: "Trial" },
  past_due:  { cls: "b-danger", label: "Past due" },
  paused:    { cls: "b-warn",   label: "Paused" },
  cancelled: { cls: "b-muted",  label: "Cancelled" },
  paid:      { cls: "b-good",   label: "Paid" },
  failed:    { cls: "b-danger", label: "Failed" },
  refunded:  { cls: "b-muted",  label: "Refunded" },
  pending:   { cls: "b-warn",   label: "Pending" },
  invited:   { cls: "b-info",   label: "Invited" },
  joined:    { cls: "b-good",   label: "Joined" }
};
function Badge(props) {
  var m = STATUS_MAP[props.status] || { cls: "b-muted", label: props.status };
  return <span className={"badge " + m.cls}>{m.label}</span>;
}

/* ---------- KPI card ---------- */
function Kpi(props) {
  return (
    <div className={"kpi" + (props.alert ? " alert" : "")}>
      <div className="kpi-label">{props.icon ? <Icon name={props.icon} /> : null}{props.label}</div>
      <div className="kpi-value tnum">{props.value}</div>
      <div className="kpi-foot">
        {props.delta != null ? (
          <span className={"delta " + (props.delta >= 0 ? "up" : "down")}>
            <Icon name={props.delta >= 0 ? "up" : "down"} size={13} sw={2.4} />{Math.abs(props.delta)}%
          </span>
        ) : null}
        <span>{props.foot}</span>
      </div>
    </div>
  );
}

/* ---------- bar chart ---------- */
function BarChart(props) {
  var data = props.data, max = Math.max.apply(null, data.map(function (d) { return d.v; }));
  return (
    <div className="chart-wrap">
      <div className="bars">
        {data.map(function (d, i) {
          var h = Math.max(6, Math.round((d.v / max) * 100));
          return (
            <div className="bar-col" key={i}>
              <div className="bar-val tnum">{gbp(d.v)}</div>
              <div className="bar" style={{ height: h + "%" }}></div>
              <div className="bar-label">{d.m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- donut (plan mix) ---------- */
function Donut(props) {
  var segs = props.segments, total = segs.reduce(function (a, s) { return a + s.value; }, 0);
  var R = 52, C = 2 * Math.PI * R, off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={R} fill="none" stroke="#efe9d8" strokeWidth="16" />
        {segs.map(function (s, i) {
          var len = (s.value / total) * C, dash = len + " " + (C - len), thisOff = off;
          off -= len;
          return <circle key={i} cx="66" cy="66" r={R} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={dash} strokeDashoffset={thisOff} transform="rotate(-90 66 66)" strokeLinecap="butt" />;
        })}
        <text x="66" y="62" textAnchor="middle" fontFamily="var(--font-body)" fontSize="28" fontWeight="700" fill="#1B4332">{total}</text>
        <text x="66" y="80" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#8a978e" letterSpacing="1">SUBS</text>
      </svg>
      <div className="legend">
        {segs.map(function (s, i) {
          return (
            <div className="legend-row" key={i}>
              <span className="legend-dot" style={{ background: s.color }}></span>
              <span className="lg-name">{s.name}</span>
              <span className="lg-val tnum">{s.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */
function Drawer(props) {
  React.useEffect(function () {
    function esc(e) { if (e.key === "Escape") props.onClose(); }
    document.addEventListener("keydown", esc);
    return function () { document.removeEventListener("keydown", esc); };
  }, []);
  return (
    <div>
      <div className="scrim" onClick={props.onClose}></div>
      <aside className="drawer" role="dialog" aria-modal="true">{props.children}</aside>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal(props) {
  React.useEffect(function () {
    function esc(e) { if (e.key === "Escape") props.onClose(); }
    document.addEventListener("keydown", esc);
    return function () { document.removeEventListener("keydown", esc); };
  }, []);
  return (
    <div>
      <div className="scrim" onClick={props.onClose}></div>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{props.title}</h3>
          {props.subtitle ? <p>{props.subtitle}</p> : null}
        </div>
        <div className="modal-body">{props.children}</div>
        <div className="modal-foot">{props.footer}</div>
      </div>
    </div>
  );
}

/* ---------- Toast host ---------- */
function ToastHost(props) {
  return (
    <div className="toast-wrap">
      {props.toasts.map(function (t) {
        return <div className="toast" key={t.id}><Icon name="checkCircle" />{t.msg}</div>;
      })}
    </div>
  );
}

/* ---------- Restaurant avatar mark ---------- */
function RestMark(props) {
  return <span className="rest-mark">{initials(props.name)}</span>;
}

Object.assign(window, {
  gbp: gbp, fmtDate: fmtDate, fmtShort: fmtShort, initials: initials,
  Icon: Icon, Badge: Badge, STATUS_MAP: STATUS_MAP, Kpi: Kpi, BarChart: BarChart,
  Donut: Donut, Drawer: Drawer, Modal: Modal, ToastHost: ToastHost, RestMark: RestMark
});
