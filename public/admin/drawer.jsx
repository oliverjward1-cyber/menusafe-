/* HospoPilot admin — customer drawer + action modals (exported to window) */

function CustomerDrawer(props) {
  var c = props.cust, D = props.data, A = props.actions;
  var plan = D.PLANS[c.plan];
  var billable = c.status === "active" || c.status === "past_due";
  var invs = D.INVOICES.filter(function (i) { return i.cust === c.id; }).slice(0, 4);
  var _note = React.useState(""), noteText = _note[0], setNoteText = _note[1];
  var _saving = React.useState(false), savingNote = _saving[0], setSavingNote = _saving[1];
  var _notes = React.useState(c.notes || []), localNotes = _notes[0], setLocalNotes = _notes[1];

  async function saveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    var res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: c.id, note: noteText })
    });
    var data = await res.json();
    setSavingNote(false);
    if (res.ok) {
      setLocalNotes(function(prev) { return [data.note].concat(prev); });
      setNoteText("");
      A.toast("Note saved");
    }
  }
  return (
    <Drawer onClose={props.onClose}>
      <div className="drawer-head">
        <div className="dh-top">
          <span className="rest-mark" style={{ width: 48, height: 48, fontSize: 18, borderRadius: 12 }}>{initials(c.name)}</span>
          <div style={{ flex: 1 }}>
            <div className="drawer-title">{c.name}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{c.contact} · {c.city}</div>
            <div style={{ marginTop: 9, display: "flex", gap: 8, alignItems: "center" }}><Badge status={c.status} /><span className="badge b-muted plain">{plan.name}</span></div>
          </div>
          <button className="icon-btn" onClick={props.onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
      </div>
      <div className="drawer-body">
        <div className="stat-row">
          <div className="stat-box"><div className="s-label">Monthly</div><div className="s-val tnum">{billable ? gbp(plan.price) : "—"}</div></div>
          <div className="stat-box"><div className="s-label">Sites</div><div className="s-val tnum">{c.sites}</div></div>
          <div className="stat-box"><div className="s-label">Dishes</div><div className="s-val tnum">{c.dishes}</div></div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Account</div>
          <div className="detail-list">
            <div className="d-row"><span className="d-k">Owner</span><span className="d-v">{c.ownerName || c.contact}</span></div>
            <div className="d-row"><span className="d-k">Head chef</span><span className="d-v">{c.chefName || "—"}</span></div>
            <div className="d-row"><span className="d-k">Email</span><span className="d-v">{c.email}</span></div>
            <div className="d-row"><span className="d-k">Plan</span><span className="d-v">{plan.name} · {gbp(plan.price)}/mo</span></div>
            <div className="d-row"><span className="d-k">Customer since</span><span className="d-v">{fmtDate(c.since)}</span></div>
            {c.acquisitionSource && <div className="d-row"><span className="d-k">Source</span><span className="d-v">{c.acquisitionSource}</span></div>}
            {c.referralCode && <div className="d-row"><span className="d-k">Referral code</span><span className="d-v tnum">{c.referralCode}</span></div>}
            {c.referredBy && <div className="d-row"><span className="d-k">Referred by</span><span className="d-v tnum">{c.referredBy}</span></div>}
            <div className="d-row"><span className="d-k">Last active</span><span className="d-v">{fmtDate(c.lastActive)}</span></div>
          </div>
        </div>

        {/* Team members */}
        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Team ({(c.profiles || []).length} users)</div>
          <div className="detail-list">
            {(c.profiles || []).length === 0
              ? <div className="d-row"><span className="d-k">No team members yet</span></div>
              : (c.profiles || []).map(function(p) {
                  return (
                    <div className="d-row" key={p.id}>
                      <span className="d-k" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="rest-mark" style={{ width: 22, height: 22, fontSize: 9, borderRadius: 6 }}>{(p.name || "?").slice(0,2).toUpperCase()}</span>
                        {p.name || "Unknown"}
                      </span>
                      <span className="badge b-muted plain" style={{ marginLeft: "auto" }}>{p.role}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Allergen training */}
        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Allergen training</div>
          <div className="stat-row">
            <div className="stat-box"><div className="s-label">Staff trained</div><div className="s-val tnum" style={{ color: "var(--good)" }}>{c.trainedStaff || 0}</div></div>
            <div className="stat-box"><div className="s-label">Quiz attempts</div><div className="s-val tnum">{c.totalQuizAttempts || 0}</div></div>
            <div className="stat-box"><div className="s-label">Dishes</div><div className="s-val tnum">{c.dishes}</div></div>
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Recent invoices</div>
          <div className="detail-list">
            {invs.length ? invs.map(function (i) {
              return <div className="d-row" key={i.id}><span className="d-k tnum">{i.id}</span><span style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>{fmtShort(i.date)}</span><span className="d-v tnum" style={{ marginLeft: "auto", marginRight: 10 }}>{gbp(i.amount)}</span><Badge status={i.status} /></div>;
            }) : <div className="d-row"><span className="d-k">No invoices yet</span></div>}
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Manage</div>
          <div className="action-grid">
            <button className="action-tile" onClick={function () { A.openModal("plan", c.id); }}><span className="action-ico"><Icon name="swap" /></span>Change plan</button>
            <button className="action-tile" onClick={function () { A.openModal("credit", c.id); }}><span className="action-ico"><Icon name="refund" /></span>Credit / comp time</button>
            <button className="action-tile" onClick={function () { A.impersonate(c); }}><span className="action-ico"><Icon name="login" /></span>Log in as customer</button>
            <button className="action-tile" onClick={function () { A.resetPassword(c); }}><span className="action-ico"><Icon name="key" /></span>Reset password</button>
            {c.status === "paused"
              ? <button className="action-tile" onClick={function () { A.setStatus(c.id, "active", "resumed"); }}><span className="action-ico"><Icon name="check" /></span>Resume account</button>
              : <button className="action-tile" onClick={function () { A.setStatus(c.id, "paused", "paused"); }}><span className="action-ico"><Icon name="pause" /></span>Pause account</button>}
            <button className="action-tile" onClick={function () { A.email(c); }}><span className="action-ico"><Icon name="mail" /></span>Send email</button>
          </div>
          <button className="action-tile danger" style={{ marginTop: 10, width: "100%" }} onClick={function () { A.openModal("cancel", c.id); }}><span className="action-ico"><Icon name="alert" /></span>{c.status === "cancelled" ? "Account cancelled" : "Suspend / cancel account"}</button>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 9 }}>Notes ({localNotes.length})</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={noteText}
              onChange={function(e) { setNoteText(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") saveNote(); }}
              placeholder="Add a note… (Enter to save)"
              style={{ flex: 1, border: "1px solid var(--hairline)", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "var(--surface-2)", color: "var(--ink)" }}
            />
            <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={savingNote || !noteText.trim()}>
              {savingNote ? "…" : "Add"}
            </button>
          </div>
          <div className="detail-list">
            {localNotes.length === 0
              ? <div className="d-row"><span className="d-k" style={{ color: "var(--ink-faint)" }}>No notes yet</span></div>
              : localNotes.map(function(n, i) {
                  return (
                    <div className="d-row" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>{n.note}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{n.created_by} · {new Date(n.created_at).toLocaleString("en-GB")}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-dark" onClick={function () { A.impersonate(c); }}><Icon name="login" size={16} /> Log in as customer</button>
        <button className="btn btn-ghost" onClick={props.onClose}>Close</button>
      </div>
    </Drawer>
  );
}

/* ---------- Plan change ---------- */
function PlanModal(props) {
  var c = props.cust, D = props.data;
  var _s = React.useState(c.plan), sel = _s[0], setSel = _s[1];
  return (
    <Modal title="Change plan" subtitle={"Update the plan for " + c.name + ". Billing adjusts on the next cycle."} onClose={props.onClose}
      footer={<div><button className="btn btn-ghost" onClick={props.onClose}>Cancel</button><button className="btn btn-primary" disabled={sel === c.plan} onClick={function () { props.onConfirm(sel); }}>Confirm change</button></div>}>
      <div className="plan-choice">
        {["core", "plus", "multi"].map(function (p) {
          var pl = D.PLANS[p];
          return (
            <button key={p} className={"plan-opt" + (sel === p ? " sel" : "")} onClick={function () { setSel(p); }}>
              <span className="radio-dot"></span>
              <span><span className="po-name">{pl.name}</span>{c.plan === p ? <span className="badge b-muted plain" style={{ marginLeft: 8 }}>current</span> : null}<div className="po-blurb">{pl.blurb}</div></span>
              <span className="po-price">{gbp(pl.price)}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ---------- Refund ---------- */
function RefundModal(props) {
  var inv = props.inv;
  return (
    <Modal title={"Refund " + inv.id} subtitle={"This returns " + gbp(inv.amount) + " to the customer's card."} onClose={props.onClose}
      footer={<div><button className="btn btn-ghost" onClick={props.onClose}>Cancel</button><button className="btn btn-danger" onClick={function () { props.onConfirm(); }}>Refund {gbp(inv.amount)}</button></div>}>
      <div className="field"><label>Reason (internal note)</label>
        <select defaultValue="goodwill"><option value="goodwill">Goodwill / customer request</option><option value="duplicate">Duplicate charge</option><option value="error">Billing error</option><option value="downgrade">Downgrade adjustment</option></select>
      </div>
      <div className="field"><label>Note (optional)</label><textarea placeholder="Add context for your records…" style={{ minHeight: 70 }}></textarea></div>
    </Modal>
  );
}

/* ---------- Credit / comp ---------- */
function CreditModal(props) {
  var c = props.cust;
  var _a = React.useState("20"), amt = _a[0], setAmt = _a[1];
  var _d = React.useState("30"), days = _d[0], setDays = _d[1];
  return (
    <Modal title="Credit or comp time" subtitle={"Apply account credit or free days for " + c.name + "."} onClose={props.onClose}
      footer={<div><button className="btn btn-ghost" onClick={props.onClose}>Cancel</button><button className="btn btn-primary" onClick={function () { props.onConfirm(amt, days); }}>Apply</button></div>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field"><label>Account credit (£)</label><input type="number" value={amt} onChange={function (e) { setAmt(e.target.value); }} /></div>
        <div className="field"><label>Free days</label><input type="number" value={days} onChange={function (e) { setDays(e.target.value); }} /></div>
      </div>
      <div className="field"><label>Reason</label><select defaultValue="onboarding"><option value="onboarding">Onboarding goodwill</option><option value="outage">Service disruption</option><option value="loyalty">Loyalty / retention</option><option value="other">Other</option></select></div>
    </Modal>
  );
}

/* ---------- Announce ---------- */
function AnnounceModal(props) {
  var _a = React.useState("all"), aud = _a[0], setAud = _a[1];
  var _s = React.useState(""), subj = _s[0], setSubj = _s[1];
  return (
    <Modal title="Send announcement" subtitle="Email an update to a group of customers or the waitlist." onClose={props.onClose}
      footer={<div><button className="btn btn-ghost" onClick={props.onClose}>Cancel</button><button className="btn btn-primary" disabled={!subj.trim()} onClick={function () { props.onConfirm(aud, subj); }}><Icon name="mail" size={16} /> Send</button></div>}>
      <div className="field"><label>Audience</label>
        <select value={aud} onChange={function (e) { setAud(e.target.value); }}>
          <option value="all">All customers</option><option value="active">Active subscribers</option><option value="trial">Trials</option><option value="past_due">Past-due accounts</option><option value="waitlist">Waitlist (pending)</option>
        </select>
      </div>
      <div className="field"><label>Subject</label><input value={subj} onChange={function (e) { setSubj(e.target.value); }} placeholder="e.g. New: allergen matrix improvements" /></div>
      <div className="field"><label>Message</label><textarea placeholder="Write your update…"></textarea></div>
    </Modal>
  );
}

/* ---------- Cancel / suspend confirm ---------- */
function CancelModal(props) {
  var c = props.cust;
  var _m = React.useState("paused"), mode = _m[0], setMode = _m[1];
  return (
    <Modal title="Suspend or cancel" subtitle={c.name + " — choose how to stop this account."} onClose={props.onClose}
      footer={<div><button className="btn btn-ghost" onClick={props.onClose}>Keep active</button><button className="btn btn-danger" onClick={function () { props.onConfirm(mode); }}>{mode === "paused" ? "Suspend account" : "Cancel account"}</button></div>}>
      <div className="plan-choice">
        <button className={"plan-opt" + (mode === "paused" ? " sel" : "")} onClick={function () { setMode("paused"); }}><span className="radio-dot"></span><span><span className="po-name">Suspend</span><div className="po-blurb">Pauses billing &amp; access. Reversible any time.</div></span></button>
        <button className={"plan-opt" + (mode === "cancelled" ? " sel" : "")} onClick={function () { setMode("cancelled"); }}><span className="radio-dot"></span><span><span className="po-name">Cancel</span><div className="po-blurb">Ends the subscription at the period end. Data kept 90 days.</div></span></button>
      </div>
    </Modal>
  );
}

Object.assign(window, {
  CustomerDrawer: CustomerDrawer, PlanModal: PlanModal, RefundModal: RefundModal,
  CreditModal: CreditModal, AnnounceModal: AnnounceModal, CancelModal: CancelModal
});
