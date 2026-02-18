"use client";

import { useState } from "react";
import { submitMembershipRequest, cancelMembershipRequest } from "./actions";

type Request = {
  id: string;
  organisation_id: string;
  organisation_name: string;
  organisation_logo: string | null;
  organisation_country: string | null;
  status: string;
  message: string | null;
  created_at: string;
};

type Props = {
  requests: Request[];
};

export function JoinOrganisationSection({ requests }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    logo_url: string | null;
    country_based: string | null;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organisations/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      setSearchResults(data.organisations || []);
    } catch (err) {
      setError("Failed to search organisations. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitRequest = async (orgId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organisation_id", orgId);
      formData.append("message", message);

      await submitMembershipRequest(formData);

      // Reset form
      setSelectedOrg(null);
      setMessage("");
      setShowForm(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("request_id", requestId);

      await cancelMembershipRequest(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Join Organisation Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-soltas-bark">
          Join an organisation
        </h2>
        <p className="mb-4 text-sm text-soltas-muted">
          Search for verified organisations and request to join them.
        </p>

        {!showForm ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search verified organisations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-soltas-ocean focus:outline-none focus:ring-2 focus:ring-soltas-ocean/20"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-lg bg-soltas-ocean px-4 py-2 text-sm font-medium text-white hover:bg-soltas-abyssal disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((org) => {
                  const hasRequest = requests.some(
                    (r) => r.organisation_id === org.id
                  );
                  const request = requests.find(
                    (r) => r.organisation_id === org.id
                  );

                  return (
                    <div
                      key={org.id}
                      className="flex items-center gap-4 rounded-lg border border-slate-200 p-4"
                    >
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-soltas-muted">
                          —
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-soltas-bark">
                          {org.name}
                        </h3>
                        {org.country_based && (
                          <p className="text-sm text-soltas-muted">
                            {org.country_based}
                          </p>
                        )}
                      </div>
                      {hasRequest ? (
                        <span
                          className={`text-sm ${
                            request?.status === "pending"
                              ? "text-amber-600"
                              : request?.status === "approved"
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          {request?.status === "pending"
                            ? "Request pending"
                            : request?.status === "approved"
                              ? "Approved"
                              : "Rejected"}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrg(org.id);
                            setShowForm(true);
                          }}
                          className="rounded-lg bg-soltas-ocean px-4 py-2 text-sm font-medium text-white hover:bg-soltas-abyssal"
                        >
                          Request to join
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <p className="text-center text-sm text-soltas-muted py-4">
                No verified organisations found matching your search.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-soltas-bark">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the organisation why you'd like to join..."
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-soltas-ocean focus:outline-none focus:ring-2 focus:ring-soltas-ocean/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => selectedOrg && handleSubmitRequest(selectedOrg)}
                disabled={isSubmitting || !selectedOrg}
                className="rounded-lg bg-soltas-ocean px-4 py-2 text-sm font-medium text-white hover:bg-soltas-abyssal disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedOrg(null);
                  setMessage("");
                }}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-soltas-bark hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-amber-900">
            Pending requests
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-4 rounded-lg border border-amber-200 bg-white p-4"
              >
                {request.organisation_logo ? (
                  <img
                    src={request.organisation_logo}
                    alt={request.organisation_name}
                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-soltas-muted">
                    —
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-soltas-bark">
                    {request.organisation_name}
                  </h4>
                  <p className="text-xs text-soltas-muted">
                    Requested{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  disabled={isSubmitting}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests (Approved/Rejected) */}
      {processedRequests.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="cursor-pointer text-sm font-medium text-soltas-bark">
            Past requests ({processedRequests.length})
          </summary>
          <div className="mt-4 space-y-3">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-4 rounded-lg border border-slate-200 p-4"
              >
                {request.organisation_logo ? (
                  <img
                    src={request.organisation_logo}
                    alt={request.organisation_name}
                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-soltas-muted">
                    —
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-soltas-bark">
                    {request.organisation_name}
                  </h4>
                  <p className="text-xs text-soltas-muted">
                    Requested{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    request.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
