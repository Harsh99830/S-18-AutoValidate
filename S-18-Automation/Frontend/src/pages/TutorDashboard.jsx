import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

const TutorDashboard = () => {
  const [activeView, setActiveView] = useState('pending');
  const [forms, setForms] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [expandedForms, setExpandedForms] = useState({});
  const [remarks, setRemarks] = useState({});
  const [rejectingForms, setRejectingForms] = useState({});
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });

  useEffect(() => {
    fetchPendingForms();
  }, []);

  useEffect(() => {
    if (activeView === 'activity-log' && activityLog.length === 0) {
      fetchActivityLog();
    }
  }, [activeView]);

  const fetchPendingForms = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/s18/pending/tutor');
      setForms(data);
    } catch (err) {
      toast.error('Could not load pending forms.');
    } finally {
      setLoading(false);
    }
  };

  // Activity log = all forms this tutor has already acted on
  const fetchActivityLog = async () => {
    try {
      setLogLoading(true);
      const { data } = await API.get('/s18/tutor/acted');
      setActivityLog(data);
    } catch {
      // Silently fail — not critical
    } finally {
      setLogLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedForms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprove = async (id) => {
    setActionLoading({ id, type: 'approve' });
    try {
      await API.put(`/s18/${id}/tutor`, {
        action: 'approved',
        remarks: remarks[id] || '',
      });
      toast.success('Approved! Forward to HOD kar diya.');
      setForms(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed.');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleReject = async (id) => {
    if (!remarks[id]?.trim()) {
      setRejectingForms(prev => ({ ...prev, [id]: true }));
      toast.error('Rejection ke liye remarks required hain.');
      return;
    }
    setActionLoading({ id, type: 'reject' });
    try {
      await API.put(`/s18/${id}/tutor`, {
        action: 'rejected',
        remarks: remarks[id],
      });
      toast.success('Rejected. Student ko notify kar diya.');
      setForms(prev => prev.filter(f => f._id !== id));
      setRejectingForms(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed.');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Tutor Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">S18 forms pending your verification</p>
          </div>
          {activeView === 'pending' && !loading && forms.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1 rounded-full">
              {forms.length} Pending
            </span>
          )}
        </div>

        {/* TAB SWITCHER */}
        <div className="mb-6 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {[['pending', 'Pending'], ['activity-log', 'Activity Log']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`min-w-28 rounded-md px-4 py-2 text-sm font-semibold transition ${
                activeView === key
                  ? 'bg-[#3C3489] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── PENDING TAB ── */}
        {activeView === 'pending' && (
          <>
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />
                ))}
              </div>
            )}

            {!loading && forms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24">
                <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Sab clear hai!</p>
                <p className="text-gray-400 text-sm mt-1">Koi pending forms nahi hain.</p>
              </div>
            )}

            {!loading && forms.length > 0 && (
              <div className="space-y-4">
                {forms.map(form => {
                  const id = form._id;
                  const isExpanded = !!expandedForms[id];
                  const isAnyLoading = actionLoading.id === id;
                  const isLoadingApprove = isAnyLoading && actionLoading.type === 'approve';
                  const isLoadingReject = isAnyLoading && actionLoading.type === 'reject';
                  const attendanceLow = form.cumulativeAttendance < 75;

                  return (
                    <div key={id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                      {/* TOP ROW */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-base">
                            {form.studentName}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {form.registrationNo} • {form.course || '—'} • {form.branch} • {form.year}
                          </p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-semibold shrink-0">
                          Pending Review
                        </span>
                      </div>

                      {/* MAIN DETAILS GRID */}
                      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Event</span>
                          <p className="font-medium text-gray-800 mt-0.5">{form.activityName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Organizer</span>
                          <p className="text-gray-700 mt-0.5">{form.organizingInstitution}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Type</span>
                          <p className="text-gray-700 mt-0.5">{form.activityType}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Dates</span>
                          <p className="text-gray-700 mt-0.5">
                            {formatDate(form.fromDate)} → {formatDate(form.toDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Attendance</span>
                          <p className={`font-semibold mt-0.5 ${attendanceLow ? 'text-red-600' : 'text-green-600'}`}>
                            {form.cumulativeAttendance}%
                            {attendanceLow && <span className="text-xs font-normal ml-1">(Below 75%)</span>}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Submitted</span>
                          <p className="text-gray-700 mt-0.5">{formatDate(form.createdAt)}</p>
                        </div>
                      </div>

                      {/* DOCUMENTS */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        {form.brochureLink && (
                          <a
                            href={form.brochureLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EEEDFE] text-[#3C3489] hover:bg-[#dddcfc] transition"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                            Brochure
                          </a>
                        )}
                        {form.participantPhotoLink && (
                          <a
                            href={form.participantPhotoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Event Photo
                          </a>
                        )}
                        {form.certificateLink && (
                          <a
                            href={form.certificateLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                            Certificate
                          </a>
                        )}
                      </div>

                      {/* EXPAND / COLLAPSE */}
                      <button
                        onClick={() => toggleExpand(id)}
                        className="mt-3 text-sm text-[#3C3489] font-medium select-none hover:underline"
                      >
                        {isExpanded ? 'Hide Details ▴' : 'View Full Details ▾'}
                      </button>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Parent Mobile</span>
                            <span className="font-medium text-gray-800">{form.parentMobileNo || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Student Mobile</span>
                            <span className="font-medium text-gray-800">{form.mobileNo || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Student Email</span>
                            <span className="font-medium text-gray-800">{form.email || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Course / Branch</span>
                            <span className="font-medium text-gray-800">
                              {[form.course, form.branch].filter(Boolean).join(' / ') || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Year</span>
                            <span className="font-medium text-gray-800">{form.year || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Last Participation</span>
                            <span className="font-medium text-gray-800">{form.lastParticipation || 'None'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Team Members</span>
                            <span className="font-medium text-gray-800">
                              {form.teamMembers?.length
                                ? form.teamMembers.map(m => `${m.name} (${m.registrationNo})`).join(', ')
                                : 'Going alone'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide block">Campus</span>
                            <span className="font-medium text-gray-800">{form.campus || '—'}</span>
                          </div>
                        </div>
                      )}

                      {/* REJECT REMARKS INPUT — shown when reject clicked without remarks */}
                      {rejectingForms[id] && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            value={remarks[id] || ''}
                            onChange={e => setRemarks(prev => ({ ...prev, [id]: e.target.value }))}
                            placeholder="Student ko kya correct karna hai? Clearly likhein..."
                            className="border border-red-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* OPTIONAL REMARKS for approval */}
                      {!rejectingForms[id] && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remarks <span className="text-gray-400 font-normal">(optional — for approval)</span>
                          </label>
                          <input
                            type="text"
                            value={remarks[id] || ''}
                            onChange={e => setRemarks(prev => ({ ...prev, [id]: e.target.value }))}
                            placeholder="Any notes for HOD..."
                            className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3489] bg-white"
                            disabled={isAnyLoading}
                          />
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      <div className="mt-4 flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleApprove(id)}
                          disabled={isAnyLoading}
                          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoadingApprove ? (
                            <><Spinner color="white" /> Approving...</>
                          ) : (
                            <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Approve & Forward to HOD</>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(id)}
                          disabled={isAnyLoading}
                          className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoadingReject ? (
                            <><Spinner color="#dc2626" /> Rejecting...</>
                          ) : (
                            <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Reject</>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── ACTIVITY LOG TAB ── */}
        {activeView === 'activity-log' && (
          <>
            {logLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
                ))}
              </div>
            )}
            {!logLoading && activityLog.length === 0 && (
              <div className="text-center py-20 text-gray-400 text-sm">
                Koi activity nahi mili abhi tak.
              </div>
            )}
            {!logLoading && activityLog.length > 0 && (
              <div className="space-y-3">
                {activityLog.map(item => {
                  const approved = item.tutorApproval?.status === 'approved';
                  return (
                    <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.studentName}</h3>
                          <p className="text-sm text-gray-500">
                            {item.registrationNo} • {item.course || '—'} • {item.branch || '—'} • {item.activityName}
                          </p>
                          {item.tutorApproval?.remarks && (
                            <p className="text-sm text-gray-400 mt-1 italic">"{item.tutorApproval.remarks}"</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {approved ? 'Approved' : 'Rejected'}
                          </span>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(item.tutorApproval?.approvedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

const Spinner = ({ color = 'white' }) => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" />
    <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default TutorDashboard;
