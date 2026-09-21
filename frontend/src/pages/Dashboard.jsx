import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import FormInput from '../components/FormInput.jsx';
import { emptyActivity, emptyTicketPass } from '../constants/forms.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';

export default function Dashboard() {
  const { data, profile, setProfile, reloadPlatformData, setNotice, setError } = useApp();
  const [activityForm, setActivityForm] = useState(emptyActivity);
  const [activityImage, setActivityImage] = useState(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketPass);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [visitorForm, setVisitorForm] = useState({
    full_name: profile.name || '',
    email: profile.email || '',
    contact_number: profile.contact_number || '',
  });

  useEffect(() => {
    if (profile.type !== 'visitor') {
      return;
    }

    api.visitorProfile()
      .then((payload) => {
        const visitor = payload.visitor || {};
        setVisitorForm({
          full_name: visitor.full_name || profile.name || '',
          email: visitor.email || profile.email || '',
          contact_number: visitor.contact_number || profile.contact_number || '',
        });
      })
      .catch(() => {
        setVisitorForm({
          full_name: profile.name || '',
          email: profile.email || '',
          contact_number: profile.contact_number || '',
        });
      });
  }, [profile]);

  if (!profile.isLoggedIn) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <span className="section-kicker">Dashboard</span>
          <h1>Login Required</h1>
          <p>Please login as a Visitor or Administrator to view the dashboard.</p>
          <Link className="dashboard-action" to="/login">Go to Login</Link>
        </section>
      </main>
    );
  }

  const isAdmin = profile.type === 'admin';
  const menuItems = isAdmin
    ? [
        ['overview', 'Overview'],
        ['manage-activities', 'Manage Activities'],
        ['manage-tickets', 'Manage Tickets'],
        ['reports', 'Reports'],
        ['bookings', 'Bookings'],
      ]
    : [
        ['overview', 'Overview'],
        ['my-bookings', 'My Bookings'],
        ['profile', 'Visitor Profile'],
      ];

  function submitActivity(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    const formData = new FormData();
    formData.append('action', 'create');
    Object.entries(activityForm).forEach(([key, value]) => {
      if (key === 'is_visible') {
        if (value) {
          formData.append(key, '1');
        }
        return;
      }
      formData.append(key, value);
    });
    if (activityImage) {
      formData.append('background_image', activityImage);
    }

    api.manageActivity(formData)
      .then((payload) => {
        setNotice(payload.message);
        setActivityImage(null);
        return reloadPlatformData();
      })
      .catch((requestError) => setError(requestError.message));
  }

  function submitTicketPass(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      ...ticketForm,
      ticket_price_indicative: Number(ticketForm.ticket_price_indicative),
      effective_price_per_guest: Number(ticketForm.effective_price_per_guest),
    };

    const request = editingTicketId
      ? api.updateTicketPass(editingTicketId, payload)
      : api.createTicketPass(payload);

    request
      .then((responsePayload) => {
        setNotice(responsePayload.message);
        setTicketForm(emptyTicketPass);
        setEditingTicketId(null);
        return reloadPlatformData();
      })
      .catch((requestError) => setError(requestError.message));
  }

  function editTicketPass(ticketPass) {
    setTicketForm({
      ticket_tier: ticketPass.ticket_tier,
      guests: ticketPass.guests,
      currency_code: ticketPass.currency_code || 'USD',
      ticket_price_indicative: ticketPass.ticket_price_indicative,
      effective_price_per_guest: ticketPass.effective_price_per_guest,
    });
    setEditingTicketId(ticketPass.id);
    setActiveSection('manage-tickets');
  }

  function deleteTicketPass(ticketPass) {
    setNotice('');
    setError('');

    api.deleteTicketPass(ticketPass.id)
      .then((payload) => {
        setNotice(payload.message);
        if (editingTicketId === ticketPass.id) {
          setTicketForm(emptyTicketPass);
          setEditingTicketId(null);
        }
        return reloadPlatformData();
      })
      .catch((requestError) => setError(requestError.message));
  }

  function resetTicketForm() {
    setTicketForm(emptyTicketPass);
    setEditingTicketId(null);
  }

  function toggleActivity(activity) {
    setNotice('');
    setError('');

    const formData = new FormData();
    formData.append('action', 'toggle');
    formData.append('activity_id', activity.id);
    formData.append('is_visible', activity.is_visible === 1 ? '0' : '1');

    api.manageActivity(formData)
      .then((payload) => {
        setNotice(payload.message);
        return reloadPlatformData();
      })
      .catch((requestError) => setError(requestError.message));
  }

  async function downloadBookingQr(booking) {
    try {
      const qrPayload = buildCheckInUrl(booking);
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 720,
      });
      const downloadLink = document.createElement('a');
      downloadLink.href = qrDataUrl;
      downloadLink.download = `wonderland-booking-${booking.id}-qr.png`;
      downloadLink.click();
    } catch (error) {
      setError(error.message || 'Unable to generate booking QR code.');
    }
  }

  function resendBookingEmail(booking) {
    setNotice('');
    setError('');

    api.resendBookingEmail(booking.id)
      .then((payload) => setNotice(payload.message))
      .catch((requestError) => setError(requestError.message));
  }

  function submitVisitorProfile(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    api.updateVisitorProfile({
      full_name: visitorForm.full_name,
      contact_number: visitorForm.contact_number,
    })
      .then((payload) => {
        setNotice(payload.message);
        setProfile(payload.profile || profile);
        return reloadPlatformData();
      })
      .catch((requestError) => setError(requestError.message));
  }

  return (
    <main className={isAdmin ? 'dashboard-page admin-dashboard' : 'dashboard-page visitor-dashboard'}>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile">
            <span>{isAdmin ? 'Administrator' : 'Visitor'}</span>
            <strong>{profile.name}</strong>
          </div>
          <nav className="dashboard-menu">
            {menuItems.map(([target, label]) => (
              <button
                className={activeSection === target ? 'active' : ''}
                key={target}
                type="button"
                onClick={() => setActiveSection(target)}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <section className="dashboard-hero">
              <span className="section-kicker">{isAdmin ? 'Administrator Dashboard' : 'Visitor Dashboard'}</span>
              <h1>{isAdmin ? 'Park Operations Overview' : `Welcome, ${profile.name}`}</h1>
              <p>
                {isAdmin
                  ? 'Monitor visitor behaviour, park activity, attraction availability, and bookings from one React dashboard.'
                  : 'Review your visitor profile, booking access, and today’s park highlights.'}
              </p>
            </section>
          )}

          {activeSection === 'overview' && (
            <BookingOverviewCards
              attractions={data.adminActivities || data.attractions || []}
              bookings={isAdmin ? data.recentBookings || [] : data.visitorBookings || []}
              isAdmin={isAdmin}
              ticketPasses={data.ticketPasses || []}
            />
          )}

          {activeSection === 'overview' && (
            <BookingOverviewCharts bookings={isAdmin ? data.recentBookings || [] : data.visitorBookings || []} isAdmin={isAdmin} />
          )}

          {!isAdmin && activeSection === 'my-bookings' && (
            <section className="dashboard-panel visitor-bookings-panel">
              <h2>My Booking Details</h2>
              <VisitorBookingTable
                bookings={data.visitorBookings || []}
                onDownloadQr={downloadBookingQr}
                onResendEmail={resendBookingEmail}
              />
            </section>
          )}

          {isAdmin && activeSection === 'manage-activities' && (
            <section className="dashboard-panel manage-activities-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>Manage Activities</h2>
                  <p>Create attraction cards and enable or disable public visibility.</p>
                </div>
              </div>
              <form className="activity-form-react" onSubmit={submitActivity}>
                <label>
                  Category
                  <select value={activityForm.category} onChange={(event) => setActivityForm({ ...activityForm, category: event.target.value })}>
                    <option value="Thrill">Thrill</option>
                    <option value="Kids">Kids</option>
                    <option value="Water">Water</option>
                    <option value="Interactive">Interactive</option>
                  </select>
                </label>
                <FormInput label="Ride Type" value={activityForm.ride_type} onChange={(ride_type) => setActivityForm({ ...activityForm, ride_type })} />
                <FormInput label="Activity Name" value={activityForm.name} onChange={(name) => setActivityForm({ ...activityForm, name })} />
                <FormInput label="Duration" value={activityForm.duration_label} onChange={(duration_label) => setActivityForm({ ...activityForm, duration_label })} />
                <FormInput label="Requirement" value={activityForm.requirement_label} onChange={(requirement_label) => setActivityForm({ ...activityForm, requirement_label })} />
                <label>
                  Background Image
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => setActivityImage(event.target.files[0] || null)} />
                </label>
                <label>
                  Icon
                  <select value={activityForm.icon} onChange={(event) => setActivityForm({ ...activityForm, icon: event.target.value })}>
                    <option value="mdi-rocket">Rocket</option>
                    <option value="mdi-water">Water</option>
                    <option value="mdi-star-circle">Star</option>
                    <option value="mdi-gamepad-variant">Gamepad</option>
                  </select>
                </label>
                <FormInput label="Color" type="color" value={activityForm.color} onChange={(color) => setActivityForm({ ...activityForm, color })} />
                <FormInput label="Zone" value={activityForm.zone} onChange={(zone) => setActivityForm({ ...activityForm, zone })} />
                <FormInput label="Wait Minutes" type="number" value={activityForm.wait} onChange={(wait) => setActivityForm({ ...activityForm, wait })} />
                <FormInput label="Hourly Capacity" type="number" value={activityForm.capacity} onChange={(capacity) => setActivityForm({ ...activityForm, capacity })} />
                <FormInput label="Operating Status" value={activityForm.status} onChange={(status) => setActivityForm({ ...activityForm, status })} />
                <label className="activity-visible-toggle">
                  <input type="checkbox" checked={activityForm.is_visible} onChange={(event) => setActivityForm({ ...activityForm, is_visible: event.target.checked })} />
                  Visible on public web page
                </label>
                <label className="activity-description">
                  Description
                  <textarea required value={activityForm.tagline} onChange={(event) => setActivityForm({ ...activityForm, tagline: event.target.value })} />
                </label>
                <button type="submit">Insert Activity</button>
              </form>
              <ActivityTable activities={data.adminActivities || []} onToggle={toggleActivity} />
            </section>
          )}

          {isAdmin && activeSection === 'manage-tickets' && (
            <TicketPassManager
              editingTicketId={editingTicketId}
              form={ticketForm}
              ticketPasses={data.ticketPasses || []}
              onCancel={resetTicketForm}
              onChange={setTicketForm}
              onDelete={deleteTicketPass}
              onEdit={editTicketPass}
              onSubmit={submitTicketPass}
            />
          )}

          {isAdmin && activeSection === 'reports' && (
            <section className="dashboard-panel">
              <h2>Visitor Behaviour Report</h2>
              <BehaviourBars behaviourMix={data.behaviourMix} />
            </section>
          )}

          {isAdmin && activeSection === 'bookings' && (
            <section className="dashboard-panel admin-bookings-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>Recent Ticket Bookings</h2>
                  <p>Showing all visitor booking records from the system.</p>
                </div>
              </div>
              <BookingList bookings={data.recentBookings || []} />
            </section>
          )}

          {!isAdmin && activeSection === 'profile' && (
            <section className="dashboard-panel">
              <h2>Visitor Profile</h2>
              <VisitorProfile
                form={visitorForm}
                onChange={setVisitorForm}
                onSubmit={submitVisitorProfile}
              />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusGrid({ operations }) {
  return (
    <section className="dashboard-grid">
      {operations.map((metric) => (
        <article className="dashboard-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.trend}</small>
        </article>
      ))}
    </section>
  );
}

function BookingOverviewCards({ attractions = [], bookings, isAdmin = false, ticketPasses = [] }) {
  const paidBookings = bookings.filter((booking) => booking.payment_status === 'Paid');
  const pendingBookings = bookings.filter((booking) => booking.payment_status !== 'Paid');
  const arrivedBookings = bookings.filter((booking) => booking.checkin_status === 'Arrived');
  const totalTickets = bookings.reduce((total, booking) => total + Number(booking.quantity || 0), 0);
  const uniqueVisitors = new Set(bookings.map((booking) => booking.email).filter(Boolean)).size;
  const activeAttractions = attractions.filter((activity) => Number(activity.is_visible ?? 1) === 1).length;
  const revenueText = formatCurrencyTotals(paidBookings);

  if (isAdmin) {
    return (
      <section className="dashboard-grid booking-overview-grid admin-overview-grid">
        <article className="dashboard-metric admin-metric">
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
          <small>All visitor reservations</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Visitors</span>
          <strong>{uniqueVisitors}</strong>
          <small>Unique booking emails</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Paid Bookings</span>
          <strong>{paidBookings.length}</strong>
          <small>Payment completed</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Pending Payments</span>
          <strong>{pendingBookings.length}</strong>
          <small>Awaiting payment</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Arrived Visitors</span>
          <strong>{arrivedBookings.length}</strong>
          <small>Checked in at park</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Tickets Sold</span>
          <strong>{totalTickets}</strong>
          <small>Total quantity booked</small>
        </article>
        <article className="dashboard-metric admin-metric admin-revenue-card">
          <span>Paid Revenue</span>
          <strong>{revenueText}</strong>
          <small>Grouped by currency</small>
        </article>
        <article className="dashboard-metric admin-metric">
          <span>Live Attractions</span>
          <strong>{activeAttractions}</strong>
          <small>{ticketPasses.length} ticket passes</small>
        </article>
      </section>
    );
  }

  return (
    <section className="dashboard-grid booking-overview-grid">
      <article className="dashboard-metric">
        <span>Booking Count</span>
        <strong>{bookings.length}</strong>
        <small>Total reservations</small>
      </article>
      <article className="dashboard-metric">
        <span>Paid Count</span>
        <strong>{paidBookings.length}</strong>
        <small>Payment completed</small>
      </article>
      <article className="dashboard-metric">
        <span>Pending Count</span>
        <strong>{pendingBookings.length}</strong>
        <small>Awaiting payment</small>
      </article>
      <article className="dashboard-metric">
        <span>Arrived Count</span>
        <strong>{arrivedBookings.length}</strong>
        <small>Checked in at park</small>
      </article>
      <article className="dashboard-metric">
        <span>Ticket Count</span>
        <strong>{totalTickets}</strong>
        <small>Total booked tickets</small>
      </article>
    </section>
  );
}

function BookingOverviewCharts({ bookings, isAdmin = false }) {
  const ticketRows = summarizeByTicket(bookings);
  const revenueRows = summarizeRevenueByTicket(bookings);
  const paymentRows = [
    { label: 'Paid', value: bookings.filter((booking) => booking.payment_status === 'Paid').length, color: '#22b573' },
    { label: 'Pending', value: bookings.filter((booking) => booking.payment_status !== 'Paid').length, color: '#ee3e50' },
  ];
  const arrivalRows = [
    { label: 'Arrived', value: bookings.filter((booking) => booking.checkin_status === 'Arrived').length, color: '#ffc629' },
    { label: 'Not Arrived', value: bookings.filter((booking) => booking.checkin_status !== 'Arrived').length, color: '#082640' },
  ];

  return (
    <section className="dashboard-chart-grid">
      <article className="dashboard-chart-panel">
        <div className="chart-heading">
          <span>Ticket Mix</span>
          <strong>Bookings by Ticket Type</strong>
        </div>
        <BarChart rows={ticketRows} />
      </article>
      <article className="dashboard-chart-panel">
        <div className="chart-heading">
          <span>Payment Status</span>
          <strong>Paid vs Pending</strong>
        </div>
        <PieChart rows={paymentRows} />
      </article>
      <article className="dashboard-chart-panel">
        <div className="chart-heading">
          <span>Arrival Status</span>
          <strong>Arrived vs Not Arrived</strong>
        </div>
        <PieChart rows={arrivalRows} />
      </article>
      {isAdmin && (
        <article className="dashboard-chart-panel admin-revenue-chart">
          <div className="chart-heading">
            <span>Revenue</span>
            <strong>Paid Revenue by Ticket</strong>
          </div>
          <BarChart rows={revenueRows} valueFormatter={(value) => formatCompactNumber(value)} />
        </article>
      )}
    </section>
  );
}

function BarChart({ rows, valueFormatter = (value) => value }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  if (rows.length === 0) {
    return <div className="chart-empty">No booking data available yet.</div>;
  }

  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div className="bar-chart-row" key={row.label}>
          <span>{row.label}</span>
          <div>
            <i style={{ width: `${Math.max(8, (row.value / maxValue) * 100)}%` }} />
          </div>
          <strong>{valueFormatter(row.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function PieChart({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  let current = 0;
  const gradient = total > 0
    ? rows.map((row) => {
        const start = current;
        current += (row.value / total) * 100;
        return `${row.color} ${start}% ${current}%`;
      }).join(', ')
    : '#eef3f8 0% 100%';

  return (
    <div className="pie-chart-wrap">
      <div className="pie-chart" style={{ background: `conic-gradient(${gradient})` }}>
        <span>{total}</span>
      </div>
      <div className="pie-legend">
        {rows.map((row) => (
          <span key={row.label}>
            <i style={{ backgroundColor: row.color }} />
            {row.label}: {row.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function summarizeByTicket(bookings) {
  const grouped = bookings.reduce((summary, booking) => {
    const label = booking.ticket_label || booking.ticket_type || 'Ticket';
    summary[label] = (summary[label] || 0) + 1;
    return summary;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value);
}

function summarizeRevenueByTicket(bookings) {
  const grouped = bookings
    .filter((booking) => booking.payment_status === 'Paid')
    .reduce((summary, booking) => {
      const label = booking.ticket_label || booking.ticket_type || 'Ticket';
      summary[label] = (summary[label] || 0) + Number(booking.total || 0);
      return summary;
    }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value);
}

function ActivityTable({ activities, onToggle }) {
  return (
    <div className="dashboard-table">
      <table>
        <thead><tr><th>Activity</th><th>Category</th><th>Details</th><th>Visible</th><th>Action</th></tr></thead>
        <tbody>
          {activities.map((activity) => {
            const isEnabled = activity.is_visible === 1;
            const canToggle = activity.id !== null && activity.id !== undefined;

            return (
              <tr key={activity.id || activity.name}>
                <td>{activity.name}</td>
                <td>{activity.category}</td>
                <td>{activity.details?.join(' / ')}</td>
                <td>
                  <span className={isEnabled ? 'status-pill enabled' : 'status-pill disabled'}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <button
                    aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${activity.name}`}
                    className={isEnabled ? 'switch-toggle is-on' : 'switch-toggle'}
                    disabled={!canToggle}
                    type="button"
                    onClick={() => onToggle(activity)}
                  >
                    <span />
                    <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TicketPassManager({
  editingTicketId,
  form,
  ticketPasses,
  onCancel,
  onChange,
  onDelete,
  onEdit,
  onSubmit,
}) {
  return (
    <section className="dashboard-panel manage-activities-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Manage Ticket Passes</h2>
          <p>Create, update, and delete the Choose Your Adventure ticket cards.</p>
        </div>
      </div>
      <form className="activity-form-react ticket-pass-form" onSubmit={onSubmit}>
        <FormInput label="Ticket Tier" value={form.ticket_tier} onChange={(ticket_tier) => onChange({ ...form, ticket_tier })} />
        <FormInput label="Guests" value={form.guests} onChange={(guests) => onChange({ ...form, guests })} />
        <label>
          Currency
          <select value={form.currency_code} onChange={(event) => onChange({ ...form, currency_code: event.target.value })}>
            <option value="USD">USD</option>
            <option value="LKR">LKR</option>
          </select>
        </label>
        <FormInput label="Ticket Price (indicative)" type="number" value={form.ticket_price_indicative} onChange={(ticket_price_indicative) => onChange({ ...form, ticket_price_indicative })} />
        <FormInput label="Effective Price per Guest" type="number" value={form.effective_price_per_guest} onChange={(effective_price_per_guest) => onChange({ ...form, effective_price_per_guest })} />
        <div className="form-actions">
          <button type="submit">{editingTicketId ? 'Update Ticket Pass' : 'Insert Ticket Pass'}</button>
          {editingTicketId && <button className="secondary-action" type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
      <TicketPassTable ticketPasses={ticketPasses} onDelete={onDelete} onEdit={onEdit} />
    </section>
  );
}

function TicketPassTable({ ticketPasses, onDelete, onEdit }) {
  return (
    <div className="dashboard-table">
      <table>
        <thead>
          <tr>
            <th>Ticket Tier</th>
            <th>Guests</th>
            <th>Currency</th>
            <th>Ticket Price (indicative)</th>
            <th>Effective Price per Guest</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ticketPasses.length === 0 && (
            <tr><td colSpan="6">No ticket passes found.</td></tr>
          )}
          {ticketPasses.map((ticketPass) => (
            <tr key={ticketPass.id}>
              <td>{ticketPass.ticket_tier}</td>
              <td>{ticketPass.guests}</td>
              <td>{ticketPass.currency_code || 'USD'}</td>
              <td>{formatTicketAmount(ticketPass.ticket_price_indicative, ticketPass.currency_code)}</td>
              <td>{formatTicketAmount(ticketPass.effective_price_per_guest, ticketPass.currency_code)}</td>
              <td>
                <div className="table-action-row">
                  <button type="button" onClick={() => onEdit(ticketPass)}>Edit</button>
                  <button className="danger-action" type="button" onClick={() => onDelete(ticketPass)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BehaviourBars({ behaviourMix }) {
  return (
    <div className="dashboard-bars">
      {behaviourMix.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div><i style={{ width: `${item.value}%`, backgroundColor: item.color }} /></div>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}

function AttractionList({ attractions }) {
  return <div className="dashboard-list">{attractions.slice(0, 4).map((ride) => <span key={ride.id || ride.name}>{ride.name}</span>)}</div>;
}

function BookingList({ bookings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredBookings = normalizedSearch
    ? bookings.filter((booking) => {
        const searchableText = [
          booking.id,
          booking.visitor_name,
          booking.email,
          booking.visit_date,
          booking.preferred_time_slot,
          booking.ticket_label,
          booking.ticket_type,
          booking.quantity,
          booking.contact_number,
          booking.currency_code,
          booking.total,
          booking.booking_status,
          booking.payment_status,
          booking.checkin_status,
          booking.arrived_at,
          booking.created_at,
        ].join(' ').toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : bookings;

  return (
    <div className="booking-records">
      <div className="booking-filter-row">
        <label>
          Search Records
          <input
            placeholder="Search by ID, visitor, email, ticket, date, time, or status"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <span>
          {filteredBookings.length} of {bookings.length} bookings
        </span>
      </div>
      <div className="dashboard-table">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Visitor</th>
              <th>Email</th>
              <th>Visit Date</th>
              <th>Time Slot</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Booking</th>
              <th>Payment</th>
              <th>Arrival</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 && (
              <tr><td colSpan="11">No booking records match your search.</td></tr>
            )}
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td>#{booking.id}</td>
                <td>{booking.visitor_name || 'Visitor'}</td>
                <td>{booking.email || '-'}</td>
                <td>{formatDisplayDate(booking.visit_date)}</td>
                <td>{booking.preferred_time_slot || '-'}</td>
                <td>{booking.ticket_label || booking.ticket_type}</td>
                <td>{booking.quantity}</td>
                <td>{formatCurrency(booking.total, booking.currency_code)}</td>
                <td>
                  <span className={booking.booking_status === 'Booked' ? 'status-pill enabled' : 'status-pill disabled'}>
                    {booking.booking_status || 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={booking.payment_status === 'Paid' ? 'status-pill enabled' : 'status-pill disabled'}>
                    {booking.payment_status || 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={booking.checkin_status === 'Arrived' ? 'status-pill enabled' : 'status-pill disabled'}>
                    {booking.checkin_status || 'Not Arrived'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorBookingTable({ bookings, onDownloadQr, onResendEmail }) {
  return (
    <div className="dashboard-table">
      <table>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Visit Date</th>
            <th>Time Slot</th>
            <th>Ticket</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Arrival</th>
            <th>QR Code</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr><td colSpan="10">No bookings found yet.</td></tr>
          )}
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>#{booking.id}</td>
              <td>{formatDisplayDate(booking.visit_date)}</td>
              <td>{booking.preferred_time_slot || '-'}</td>
              <td>{booking.ticket_label || booking.ticket_type}</td>
              <td>{booking.quantity}</td>
              <td>{formatCurrency(booking.total, booking.currency_code)}</td>
              <td>
                <span className={booking.payment_status === 'Paid' ? 'status-pill enabled' : 'status-pill disabled'}>
                  {booking.payment_status === 'Paid' ? 'Paid / Booked' : 'Pending Payment'}
                </span>
              </td>
              <td>
                <span className={booking.checkin_status === 'Arrived' ? 'status-pill enabled' : 'status-pill disabled'}>
                  {booking.checkin_status || 'Not Arrived'}
                </span>
              </td>
              <td>
                <button
                  disabled={booking.payment_status !== 'Paid'}
                  type="button"
                  onClick={() => onDownloadQr(booking)}
                >
                  Download QR
                </button>
              </td>
              <td>
                <button
                  disabled={booking.payment_status !== 'Paid'}
                  type="button"
                  onClick={() => onResendEmail(booking)}
                >
                  Resend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisitorProfile({ form, onChange, onSubmit }) {
  return (
    <form className="activity-form-react visitor-profile-form" onSubmit={onSubmit}>
      <FormInput
        label="Full Name"
        value={form.full_name}
        onChange={(full_name) => onChange({ ...form, full_name })}
      />
      <FormInput
        disabled
        label="Email Address"
        type="email"
        value={form.email}
        onChange={() => {}}
      />
      <FormInput
        label="Contact Number"
        value={form.contact_number}
        onChange={(contact_number) => onChange({ ...form, contact_number })}
      />
      <button type="submit">Update Profile</button>
    </form>
  );
}

function formatCurrencyTotals(bookings) {
  const totals = bookings.reduce((summary, booking) => {
    const currencyCode = booking.currency_code || 'USD';
    summary[currencyCode] = (summary[currencyCode] || 0) + Number(booking.total || 0);
    return summary;
  }, {});
  const entries = Object.entries(totals);

  if (entries.length === 0) {
    return '0';
  }

  return entries
    .map(([currencyCode, total]) => `${currencyCode} ${formatCompactNumber(total)}`)
    .join(' / ');
}

function formatCompactNumber(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatTicketAmount(value, currencyCode = 'USD') {
  return `${currencyCode || 'USD'} ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatCurrency(value, currencyCode = 'USD') {
  return `${currencyCode || 'USD'} ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDisplayDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function buildCheckInUrl(booking) {
  const token = encodeURIComponent(booking.qr_token || '');
  return `${window.location.origin}/check-in/${booking.id}?token=${token}`;
}
