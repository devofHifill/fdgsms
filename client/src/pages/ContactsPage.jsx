import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Active", value: "active" },
  { label: "Replied", value: "replied" },
  { label: "Opted Out", value: "opted_out" },
  { label: "Invalid", value: "invalid" },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedContact, setSelectedContact] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  async function fetchContacts(nextPage = 1, nextSearch = appliedSearch, nextStatus = status) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(pagination.limit || 10),
        search: nextSearch,
        status: nextStatus,
      });

      const data = await apiFetch(`/api/contacts?${params.toString()}`);
      setContacts(data.items || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  async function fetchContactDetails(id) {
    try {
      setLoadingDetails(true);
      setError("");

      const data = await apiFetch(`/api/contacts/${id}`);
      setSelectedContact(data);
    } catch (err) {
      setError(err.message || "Failed to load contact details");
    } finally {
      setLoadingDetails(false);
    }
  }

  async function fetchMessages(contactId) {
    try {
      setLoadingMessages(true);
      setError("");

      const data = await apiFetch(`/api/messages/contact/${contactId}`);
      setMessages(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSelectContact(contactId) {
    await fetchContactDetails(contactId);
    await fetchMessages(contactId);
  }

  async function handleSendMessage(e) {
    e.preventDefault();

    if (!selectedContact?._id) {
      setError("Select a contact first");
      return;
    }

    if (!messageText.trim()) {
      setError("Message cannot be empty");
      return;
    }

    try {
      setSendingMessage(true);
      setError("");

      const payload = {
        contactId: selectedContact._id,
        body: messageText.trim(),
      };

      const data = await apiFetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessages((prev) => [...prev, data.item]);
      setMessageText("");
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  useEffect(() => {
    fetchContacts(1, appliedSearch, status);
  }, [appliedSearch, status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchContacts(1, search.trim(), status);
    setAppliedSearch(search.trim());
  }

  function handleStatusChange(e) {
    const nextStatus = e.target.value;
    setStatus(nextStatus);
  }

  function handlePrevPage() {
    if (pagination.hasPrevPage) {
      fetchContacts(pagination.page - 1);
    }
  }

  function handleNextPage() {
    if (pagination.hasNextPage) {
      fetchContacts(pagination.page + 1);
    }
  }

  return (
    <div className="contacts-page">
      <div className="contacts-toolbar">
        <h1>Contacts</h1>

        <form className="contacts-filters" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="submit">Search</button>
        </form>
      </div>

      {error ? <p className="status-error">{error}</p> : null}

      <div className="contacts-layout">
        <div className="contacts-list-card">
          {loading ? (
            <p>Loading contacts...</p>
          ) : (
            <>
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length ? (
                    contacts.map((contact) => (
                      <tr
                        key={contact._id}
                        onClick={() => handleSelectContact(contact._id)}
                        className={`contact-row ${
                          selectedContact?._id === contact._id ? "contact-row-active" : ""
                        }`}
                      >
                        <td>{contact.fullName || "-"}</td>
                        <td>{contact.email || "-"}</td>
                        <td>{contact.phone || "-"}</td>
                        <td>
                          <span className={`status-badge status-${contact.status}`}>
                            {contact.status}
                          </span>
                        </td>
                        <td>{contact.source || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No contacts found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="pagination-bar">
                <button onClick={handlePrevPage} disabled={!pagination.hasPrevPage}>
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages} | Total {pagination.total}
                </span>

                <button onClick={handleNextPage} disabled={!pagination.hasNextPage}>
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="contact-detail-card">
          {loadingDetails ? (
            <p>Loading details...</p>
          ) : selectedContact ? (
            <>
              <div className="contact-detail-header">
                <h2>{selectedContact.fullName || "Unnamed Contact"}</h2>
                <p>{selectedContact.normalizedPhone || selectedContact.phone || "-"}</p>
              </div>

              <div className="detail-grid">
                <div>
                  <strong>Email</strong>
                  <p>{selectedContact.email || "-"}</p>
                </div>
                <div>
                  <strong>Status</strong>
                  <p>{selectedContact.status || "-"}</p>
                </div>
                <div>
                  <strong>Source</strong>
                  <p>{selectedContact.source || "-"}</p>
                </div>
              </div>

              <div className="messages-panel">
                <div className="messages-panel-header">
                  <h3>Message Thread</h3>
                </div>

                <div className="messages-thread">
                  {loadingMessages ? (
                    <p>Loading messages...</p>
                  ) : messages.length ? (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message-bubble ${
                          msg.direction === "outbound"
                            ? "message-bubble-outbound"
                            : "message-bubble-inbound"
                        }`}
                      >
                        <div className="message-body">{msg.body}</div>
                        <div className="message-meta">
                          <span>{msg.status}</span>
                          <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No messages yet.</p>
                  )}
                </div>

                <form className="message-compose" onSubmit={handleSendMessage}>
                  <textarea
                    rows="3"
                    placeholder="Type your SMS message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />

                  <button type="submit" disabled={sendingMessage}>
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <h2>Contact Details</h2>
              <p>Select a contact to view details and send messages.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}