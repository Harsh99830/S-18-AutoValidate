import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import API from '../utils/api';

const PU_PURPLE = '#3C3489';
const PU_PURPLE_DARK = '#2A2362';
const PU_PURPLE_LIGHT = '#EEEDFE';

const baseInputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13.5,
  border: '0.5px solid #D0CEF0', outline: 'none', background: 'white',
  color: '#1A1640', transition: 'border-color 0.15s', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const Select = ({ children, name, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const ref = useRef(null);

  const options = React.Children.toArray(children).map(child => ({
    value: child.props.value ?? child.props.children,
    label: child.props.children,
  }));

  const selectedLabel = options.find(o => o.value === value)?.label || options[0]?.label || '';

  const openDropdown = () => { setAnimating(true); setOpen(true); };
  const closeDropdown = () => { setAnimating(false); setTimeout(() => setOpen(false), 180); };
  const handleSelect = (e, optValue) => {
    e.preventDefault();
    e.stopPropagation();
    onChange({ target: { name, value: optValue } });
    closeDropdown();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) closeDropdown(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => open ? closeDropdown() : openDropdown()}
        style={{
          ...baseInputStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none',
          borderColor: open ? '#3C3489' : '#D0CEF0',
          color: value ? '#1A1640' : '#9895B5',
        }}
      >
        <span>{selectedLabel}</span>
        <svg width="12" height="12" fill="none" stroke="#9895B5" viewBox="0 0 24 24" strokeWidth="2"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', borderRadius: 10, border: '0.5px solid #CECBF6',
          boxShadow: '0 8px 24px rgba(60,52,137,0.12)',
          zIndex: 999, overflow: 'hidden', transformOrigin: 'top',
          animation: animating ? 'dropdownOpen 0.18s ease forwards' : 'dropdownClose 0.18s ease forwards',
        }}>
          {options.map((opt, i) => (
            <div key={i}
              onMouseDown={(e) => handleSelect(e, opt.value)}
              onClick={(e) => handleSelect(e, opt.value)}
              style={{
                padding: '9px 13px', fontSize: 13.5, cursor: 'pointer',
                color: opt.value === value ? '#3C3489' : '#1A1640',
                background: opt.value === value ? '#EEEDFE' : 'white',
                fontWeight: opt.value === value ? 600 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = '#F7F6FD'; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'white'; }}
            >{opt.label}</div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes dropdownOpen { from { opacity:0; transform:scaleY(0.85) translateY(-6px); } to { opacity:1; transform:scaleY(1) translateY(0); } }
        @keyframes dropdownClose { from { opacity:1; transform:scaleY(1) translateY(0); } to { opacity:0; transform:scaleY(0.85) translateY(-6px); } }
      `}</style>
    </div>
  );
};

const StudentDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [expandedReq, setExpandedReq] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const [formData, setFormData] = useState({
    studentName: user?.name || '',
    registrationNo: '',
    course: '',
    campus: '',
    year: '',
    branch: '',
    email: user?.email || '',
    mobileNo: '',
    cumulativeAttendance: '',
    lastParticipation: '',
    activityName: '',
    organizingInstitution: '',
    activityType: '',
    activityTypeOther: '',
    startDate: '',
    endDate: '',
    numberOfTeamMembers: '0',
    teamMembers: [
      { name: '', registrationNo: '' },
      { name: '', registrationNo: '' },
      { name: '', registrationNo: '' },
    ],
    brochureFile: null,
    participantPhotoFile: null,
    certificateFile: null,
    parentMobileNo: '',
    undertakingAgreed: false,
  });

  // Uploaded file URLs + IDs from Cloudinary (set after each file is picked)
  const [uploadedFiles, setUploadedFiles] = useState({
    brochure:    { url: null, fileId: null, uploading: false },
    photo:       { url: null, fileId: null, uploading: false },
    certificate: { url: null, fileId: null, uploading: false },
  });

  useEffect(() => {
    if (activeTab === 'my-requests') fetchMyRequests();
  }, [activeTab]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const { data } = await API.get('/s18/my');
      setMyRequests(data);
      setRequestsLoaded(true);
    } catch {
      toast.error('Could not load your requests.');
      setRequestsLoaded(true);
    }
  };

  const handleDownloadPDF = async (reqId, registrationNo) => {
    setDownloadingPdf(reqId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/s18/${reqId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Download failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `S18_Approval_${registrationNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Approval letter downloaded!');
    } catch (err) {
      toast.error(err.message || 'PDF download failed. Try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Called when student picks a file — immediately uploads to Cloudinary
  const handleFileUpload = async (fieldName, file) => {
    // fieldName: 'brochureFile' | 'participantPhotoFile' | 'certificateFile'
    const typeMap = {
      brochureFile:        { key: 'brochure',    endpoint: '/upload/brochure' },
      participantPhotoFile:{ key: 'photo',       endpoint: '/upload/photo' },
      certificateFile:     { key: 'certificate', endpoint: '/upload/certificate' },
    };
    const { key, endpoint } = typeMap[fieldName];

    // Show file name immediately + mark uploading
    setFormData(p => ({ ...p, [fieldName]: file }));
    setUploadedFiles(p => ({ ...p, [key]: { ...p[key], uploading: true } }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await API.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFiles(p => ({
        ...p,
        [key]: { url: data.url, fileId: data.fileId, uploading: false },
      }));
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} uploaded!`);
    } catch (err) {
      setFormData(p => ({ ...p, [fieldName]: null }));
      setUploadedFiles(p => ({ ...p, [key]: { url: null, fileId: null, uploading: false } }));
      toast.error(err.response?.data?.message || `${key} upload failed. Try again.`);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(p => ({ ...p, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      if (file) handleFileUpload(name, file);
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleTeamMemberChange = (idx, field, value) => {
    const updated = formData.teamMembers.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    setFormData(p => ({ ...p, teamMembers: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check all 3 files are uploaded (not just selected)
    const { brochure, photo, certificate } = uploadedFiles;
    if (!brochure.url || !photo.url || !certificate.url) {
      toast.error('Please wait — all 3 documents must finish uploading first.');
      return;
    }
    if (brochure.uploading || photo.uploading || certificate.uploading) {
      toast.error('Files are still uploading. Please wait.');
      return;
    }
    if (Number(formData.cumulativeAttendance) < 75) {
      toast.error('Cumulative attendance must be ≥ 75% to be eligible.');
      return;
    }
    if (!formData.undertakingAgreed) {
      toast.error('You must agree to the student undertaking before submitting.');
      return;
    }
    if (!formData.course) {
      toast.error('Please select a course.');
      return;
    }
    if (formData.activityType === 'Other' && !formData.activityTypeOther.trim()) {
      toast.error('Please specify the activity type.');
      return;
    }

    setLoading(true);
    try {
      const numMembers = Number(formData.numberOfTeamMembers);
      const payload = {
        studentName:          formData.studentName,
        registrationNo:       formData.registrationNo,
        course:               formData.course,
        campus:               formData.campus,
        year:                 formData.year,
        branch:               formData.branch,
        email:                formData.email,
        mobileNo:             formData.mobileNo,
        cumulativeAttendance: Number(formData.cumulativeAttendance),
        lastParticipation:    formData.lastParticipation || null,
        activityName:         formData.activityName,
        organizingInstitution:formData.organizingInstitution,
        activityType:         formData.activityType,
        activityTypeOther:    formData.activityType === 'Other' ? formData.activityTypeOther : '',
        fromDate:             formData.startDate,
        toDate:               formData.endDate,
        teamMembers:          formData.teamMembers.slice(0, numMembers),
        parentMobileNo:       formData.parentMobileNo,
        // Cloudinary URLs
        brochureLink:         brochure.url,
        participantPhotoLink: photo.url,
        certificateLink:      certificate.url,
      };

      const { data: form } = await API.post('/s18', payload);

      // Link uploaded files to the newly created form
      const fileIds = [brochure.fileId, photo.fileId, certificate.fileId].filter(Boolean);
      if (fileIds.length) {
        await API.patch('/upload/attach', { fileIds, s18FormId: form._id });
      }

      toast.success('S18 Request submitted successfully!');
      await fetchMyRequests();
      setActiveTab('my-requests');

      // Reset form
      setFormData(p => ({
        ...p,
        registrationNo: '', course: '', campus: '', year: '', branch: '',
        mobileNo: '', cumulativeAttendance: '', lastParticipation: '',
        activityName: '', organizingInstitution: '', activityType: '', activityTypeOther: '',
        startDate: '', endDate: '', numberOfTeamMembers: '0',
        teamMembers: [
          { name: '', registrationNo: '' },
          { name: '', registrationNo: '' },
          { name: '', registrationNo: '' },
        ],
        brochureFile: null, participantPhotoFile: null, certificateFile: null,
        parentMobileNo: '', undertakingAgreed: false,
      }));
      setUploadedFiles({
        brochure:    { url: null, fileId: null, uploading: false },
        photo:       { url: null, fileId: null, uploading: false },
        certificate: { url: null, fileId: null, uploading: false },
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const numMembers = Number(formData.numberOfTeamMembers);

  const statusConfig = {
    pending:        { label: 'Pending',         bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
    tutor_approved: { label: 'Tutor Approved',  bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
    hod_approved:   { label: 'HOD Approved',    bg: '#EEEDFE', text: '#3C3489', dot: '#7F77DD' },
    approved:       { label: 'Fully Approved',  bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
    rejected:       { label: 'Rejected',        bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6FD' }}>
      <Navbar />
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'inherit', fontSize: 14, borderRadius: 10, border: '0.5px solid #E5E3F8' }
      }} />

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', background: '#EEEDFE', borderRadius: 12,
            padding: 4, gap: 2
          }}>
            {[['new', 'New Request'], ['my-requests', requestsLoaded ? `My Requests (${myRequests.length})` : 'My Requests']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === key ? PU_PURPLE : 'transparent',
                color: activeTab === key ? '#fff' : '#534AB7',
                boxShadow: activeTab === key ? '0 2px 8px rgba(60,52,137,0.25)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#9895B5', fontWeight: 500 }}>Max 2 per semester</span>
        </div>

        {/* ── NEW REQUEST FORM ── */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Section: Student Details */}
              <Card>
                <SectionHeader icon="01" title="Student Details" />
                <Grid cols={2}>
                  <Field label="Student Name" required>
                    <Input name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Full name" />
                  </Field>
                  <Field label="Registration No." required>
                    <Input name="registrationNo" value={formData.registrationNo} onChange={handleChange} placeholder="e.g. 2021BTCS001" />
                  </Field>
                </Grid>
                <Grid cols={2}>
                  <Field label="Campus" required>
                    <Select name="campus" value={formData.campus} onChange={handleChange}>
                      <option value="">Select campus</option>
                      <option>Poornima College of Engineering</option>
                      <option>Poornima University Main Campus</option>
                      <option>PIIT</option>
                    </Select>
                  </Field>
                  <Field label="Course" required>
                    <Select name="course" value={formData.course} onChange={handleChange}>
                      <option value="">Select course</option>
                      <option>B.Tech</option>
                      <option>BCA</option>
                      <option>BVA</option>
                      <option>BBA</option>
                      <option>M.Tech</option>
                      <option>MCA</option>
                      <option>MBA</option>
                      <option>B.Sc</option>
                      <option>B.Com</option>
                    </Select>
                  </Field>
                </Grid>
                <Grid cols={2}>
                  <Field label="Year" required>
                    <Select name="year" value={formData.year} onChange={handleChange}>
                      <option value="">Select year</option>
                      <option>1st Year</option><option>2nd Year</option>
                      <option>3rd Year</option><option>4th Year</option>
                    </Select>
                  </Field>
                  <Field label="Branch" required>
                    <Select name="branch" value={formData.branch} onChange={handleChange}>
                      <option value="">Select branch</option>
                      <option>Computer Science</option><option>Information Technology</option>
                      <option>Electronics</option><option>Mechanical</option><option>Civil</option>
                    </Select>
                  </Field>
                </Grid>
                <Grid cols={2}>
                  <Field label="Poornima Email">
                    <Input name="email" value={formData.email} readOnly style={{ background: '#F7F6FD', color: '#9895B5', cursor: 'not-allowed' }} />
                  </Field>
                  <Field label="Mobile No." required>
                    <Input name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="10-digit number" maxLength={10} />
                  </Field>
                </Grid>
                <Grid cols={2}>
                  <Field label="Cumulative Attendance (%)" required hint="Must be ≥ 75% to be eligible">
                    <Input name="cumulativeAttendance" type="number" min="0" max="100"
                      value={formData.cumulativeAttendance} onChange={handleChange} placeholder="e.g. 82" />
                  </Field>
                  <Field label="Last Participation Date (this semester)">
                    <Input name="lastParticipation" type="date" value={formData.lastParticipation} onChange={handleChange} />
                  </Field>
                </Grid>
              </Card>

              {/* Section: Activity Details */}
              <Card>
                <SectionHeader icon="02" title="Activity Details" />
                <Field label="Activity Name" required>
                  <Input name="activityName" value={formData.activityName} onChange={handleChange} placeholder="e.g. Smart India Hackathon 2025" />
                </Field>
                <Grid cols={2}>
                  <Field label="Organizing Institution" required>
                    <Input name="organizingInstitution" value={formData.organizingInstitution} onChange={handleChange} placeholder="Institution name" />
                  </Field>
                  <Field label="Activity Type" required>
                    <Select name="activityType" value={formData.activityType} onChange={handleChange}>
                      <option value="">Select type</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Technical Competition">Technical Competition</option>
                      <option value="Workshop/Seminar">Workshop / Seminar</option>
                      <option value="Cultural Event">Cultural Event</option>
                      <option value="Sports">Sports</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                </Grid>
                {formData.activityType === 'Other' && (
                  <Field label="Please specify activity type" required>
                    <Input
                      name="activityTypeOther"
                      value={formData.activityTypeOther || ''}
                      onChange={handleChange}
                      placeholder="Describe the activity type..."
                    />
                  </Field>
                )}
                <Grid cols={2}>
                  <Field label="From Date" required>
                    <Input name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                  </Field>
                  <Field label="To Date" required>
                    <Input name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                  </Field>
                </Grid>
              </Card>

              {/* Section: Team Members */}
              <Card>
                <SectionHeader icon="03" title="Team Members" />
                <Field label="Team members joining (excluding yourself)">
                  <Select name="numberOfTeamMembers" value={formData.numberOfTeamMembers} onChange={handleChange}>
                    <option value="0">Going alone</option>
                    <option value="2">2 members</option>
                    <option value="3">3 members</option>
                  </Select>
                </Field>
                {numMembers > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {Array.from({ length: numMembers }).map((_, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                        background: '#F7F6FD', borderRadius: 10,
                        border: '0.5px solid #E5E3F8', padding: '14px 16px'
                      }}>
                        <Field label={`Member ${i + 1} — Name`}>
                          <Input value={formData.teamMembers[i].name}
                            onChange={e => handleTeamMemberChange(i, 'name', e.target.value)}
                            placeholder="Full name" />
                        </Field>
                        <Field label="Registration No.">
                          <Input value={formData.teamMembers[i].registrationNo}
                            onChange={e => handleTeamMemberChange(i, 'registrationNo', e.target.value)}
                            placeholder="Reg. no." />
                        </Field>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section: Documents */}
              <Card>
                <SectionHeader icon="04" title="Documents" />
                <div style={{
                  background: '#FFF8EC', color: '#854F0B', border: '0.5px solid #FAC775',
                  borderRadius: 10, padding: '10px 14px', fontSize: 12.5, marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ fontSize: 14 }}>⚠️</span> Sabhi 3 documents mandatory hain — form submit nahi hoga bina inke
                </div>
                <Grid cols={3}>
                  <div>
                    <Field label="Event Brochure" required>
                      <FileUploadBox name="brochureFile" file={formData.brochureFile} onChange={handleChange} accept=".pdf,image/*" uploading={uploadedFiles.brochure.uploading} />
                    </Field>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9895B5', textAlign: 'center' }}>PDF ya image • Required</p>
                  </div>
                  <div>
                    <Field label="Photo at Event Venue" required>
                      <FileUploadBox name="participantPhotoFile" file={formData.participantPhotoFile} onChange={handleChange} accept="image/*" uploading={uploadedFiles.photo.uploading} />
                    </Field>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9895B5', textAlign: 'center' }}>Image only • Required • Event venue mein li gayi photo</p>
                  </div>
                  <div>
                    <Field label="Certificate" required>
                      <FileUploadBox name="certificateFile" file={formData.certificateFile} onChange={handleChange} accept=".pdf,image/*" uploading={uploadedFiles.certificate.uploading} />
                    </Field>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9895B5', textAlign: 'center' }}>PDF ya image • Required</p>
                  </div>
                </Grid>
              </Card>

              {/* Section: Parent Info */}
              <Card>
                <SectionHeader icon="05" title="Parent / Guardian" />
                <Grid cols={2}>
                  <Field label="Parent Mobile No." required>
                    <Input name="parentMobileNo" value={formData.parentMobileNo} onChange={handleChange} placeholder="10-digit number" maxLength={10} />
                  </Field>
                </Grid>
                <div style={{
                  marginTop: 12, background: '#FFF8EC', borderRadius: 10,
                  border: '0.5px solid #FAC775', padding: '12px 16px',
                  fontSize: 13, color: '#854F0B', lineHeight: 1.6
                }}>
                  <strong>Note:</strong> Written parent permission is required. Tutor will contact the parent directly if written consent is not received before the activity date.
                </div>
              </Card>

              {/* Section: Undertaking */}
              <Card>
                <SectionHeader icon="06" title="Student Undertaking" />
                <div style={{
                  background: '#F7F6FD', borderRadius: 10,
                  border: '0.5px solid #CECBF6', padding: '16px 18px',
                  fontSize: 13.5, color: '#3C3A5E', lineHeight: 1.8, marginBottom: 16
                }}>
                  I, <strong>{formData.studentName || '___________'}</strong> (Reg. No.: <strong>{formData.registrationNo || '___________'}</strong>), undertake the responsibility of my active participation in the above activity. I also affirm that I, along with my team members, will not indulge in any activity which will harm the prestige of Poornima University, and I will remain disciplined throughout.
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" name="undertakingAgreed" checked={formData.undertakingAgreed}
                    onChange={handleChange}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: PU_PURPLE, cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, color: '#3C3A5E', lineHeight: 1.6 }}>
                    I have read and agree to the undertaking above and all guidelines set by Poornima University for participation in outside activities.
                  </span>
                </label>
              </Card>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 500 }}>
                  <span style={{ color: formData.undertakingAgreed ? '#3B6D11' : '#9895B5', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Undertaking agreed
                  </span>
                  <span style={{ color: (uploadedFiles.brochure.url && uploadedFiles.photo.url && uploadedFiles.certificate.url) ? '#3B6D11' : '#9895B5', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    All documents uploaded
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setActiveTab('my-requests')} style={{
                    padding: '11px 22px', borderRadius: 10, border: '0.5px solid #CECBF6',
                    background: 'white', color: '#534AB7', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} style={{
                    padding: '11px 28px', borderRadius: 10, border: 'none',
                    background: loading ? '#9895B5' : PU_PURPLE,
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(60,52,137,0.35)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {loading ? (
                      <>
                        <span style={{
                          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff', borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 0.6s linear infinite'
                        }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit S18 Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── MY REQUESTS ── */}
        {activeTab === 'my-requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myRequests.length === 0 ? (
              <div style={{
                background: 'white', borderRadius: 16, border: '0.5px solid #E5E3F8',
                padding: '60px 20px', textAlign: 'center'
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: PU_PURPLE_LIGHT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                  <svg width="24" height="24" fill="none" stroke={PU_PURPLE} viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#1A1640', fontSize: 15 }}>No requests yet</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9895B5' }}>Submit your first S18 form to get started</p>
                <button onClick={() => setActiveTab('new')} style={{
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: PU_PURPLE, color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(60,52,137,0.3)'
                }}>
                  + New Request
                </button>
              </div>
            ) : myRequests.map((req, idx) => {
              const cfg = statusConfig[req.status] || statusConfig.pending;
              const isOpen = expandedReq === idx;
              return (
                <div key={idx} style={{
                  background: 'white', borderRadius: 14, border: '0.5px solid #E5E3F8',
                  overflow: 'hidden', transition: 'box-shadow 0.15s'
                }}>
                  <div onClick={() => setExpandedReq(isOpen ? null : idx)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0
                      }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1A1640' }}>{req.activityName}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9895B5' }}>
                          {req.organizingInstitution} · {req.activityType}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: cfg.bg, color: cfg.text
                      }}>
                        {cfg.label}
                      </span>
                      {req.status === 'approved' && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDownloadPDF(req._id, req.registrationNo); }}
                          disabled={downloadingPdf === req._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: downloadingPdf === req._id ? 'not-allowed' : 'pointer',
                            background: '#3C3489', color: '#fff', fontSize: 12, fontWeight: 600,
                            opacity: downloadingPdf === req._id ? 0.7 : 1,
                            boxShadow: '0 2px 8px rgba(60,52,137,0.3)', whiteSpace: 'nowrap',
                          }}
                        >
                          {downloadingPdf === req._id ? (
                            <>
                              <span style={{
                                width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff', borderRadius: '50%',
                                display: 'inline-block', animation: 'spin 0.6s linear infinite'
                              }} />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Approval Letter
                            </>
                          )}
                        </button>
                      )}
                      <svg width="14" height="14" fill="none" stroke="#9895B5" viewBox="0 0 24 24" strokeWidth="2"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '0.5px solid #F0EEF8', padding: '20px 20px' }}>

                      {/* ── Student Details ── */}
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Student Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px', marginBottom: 20 }}>
                        {[
                          ['Name', req.studentName],
                          ['Reg. No.', req.registrationNo],
                          ['Email', req.email],
                          ['Mobile', req.mobileNo],
                          ['Campus', req.campus],
                          ['Course', req.course || '—'],
                          ['Year', req.year],
                          ['Branch', req.branch],
                          ['Attendance', req.cumulativeAttendance ? `${req.cumulativeAttendance}%` : '—'],
                          ['Parent Mobile', req.parentMobileNo || '—'],
                          ['Last Participation', req.lastParticipation || '—'],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{l}</p>
                            <p style={{ margin: 0, fontSize: 13, color: '#3C3A5E', fontWeight: 500, wordBreak: 'break-all' }}>{v || '—'}</p>
                          </div>
                        ))}
                      </div>

                      {/* ── Activity Details ── */}
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Activity Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px', marginBottom: 20 }}>
                        {[
                          ['Activity', req.activityName],
                          ['Institution', req.organizingInstitution],
                          ['Type', req.activityType],
                          ['From', req.fromDate ? new Date(req.fromDate).toLocaleDateString('en-IN') : '—'],
                          ['To', req.toDate ? new Date(req.toDate).toLocaleDateString('en-IN') : '—'],
                          ['Submitted On', req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : '—'],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{l}</p>
                            <p style={{ margin: 0, fontSize: 13, color: '#3C3A5E', fontWeight: 500 }}>{v || '—'}</p>
                          </div>
                        ))}
                      </div>

                      {/* ── Team Members ── */}
                      {req.teamMembers && req.teamMembers.length > 0 && (
                        <>
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Team Members</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                            {req.teamMembers.map((m, mi) => (
                              <div key={mi} style={{ display: 'flex', gap: 24, background: '#F7F6FD', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                                <span style={{ fontWeight: 600, color: '#3C3489', minWidth: 70 }}>Member {mi + 1}</span>
                                <span style={{ color: '#1A1640' }}>{m.name || '—'}</span>
                                <span style={{ color: '#9895B5' }}>{m.registrationNo || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── Documents ── */}
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Documents</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                        {[
                          ['Brochure', req.brochureLink],
                          ['Photo', req.participantPhotoLink],
                          ['Certificate', req.certificateLink],
                        ].map(([label, url]) => (
                          <a key={label} href={url} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 12px', borderRadius: 8,
                            border: '0.5px solid #CECBF6', background: '#F7F6FD',
                            color: '#3C3489', fontSize: 12.5, fontWeight: 600,
                            textDecoration: 'none', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#EEEDFE'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F7F6FD'}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {label}
                          </a>
                        ))}
                      </div>

                      {/* ── Approval Chain ── */}
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9895B5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Approval Chain</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {[
                          ['Tutor', ['tutor_approved', 'hod_approved', 'approved']],
                          ['HOD', ['hod_approved', 'approved']],
                          ['Dean', ['approved']],
                        ].map(([role, doneStatuses], stepIdx, arr) => {
                          const done = doneStatuses.includes(req.status);
                          const isFirstPending = !done && (stepIdx === 0 || arr[stepIdx - 1][1].includes(req.status));
                          const isActive = isFirstPending;

                          return (
                            <React.Fragment key={role}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 80 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 'bold',
                                  background: done ? '#3C3489' : (isActive ? 'white' : '#F7F6FD'),
                                  color: done ? 'white' : (isActive ? '#3C3489' : '#9895B5'),
                                  border: isActive ? '1.5px dashed #7F77DD' : 'none',
                                  boxSizing: 'border-box'
                                }}>
                                  {done ? '✓' : stepIdx + 1}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: done ? '#3B6D11' : (isActive ? '#3C3489' : '#9895B5') }}>
                                  {role}
                                </span>
                              </div>
                              {stepIdx < arr.length - 1 && (
                                <div style={{ flex: 1, height: 2, background: done ? '#3C3489' : '#F0EEF8', margin: '0 8px', alignSelf: 'flex-start', marginTop: 14 }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Sub-components ──

const Card = ({ children }) => (
  <div style={{
    background: 'white', borderRadius: 16,
    border: '0.5px solid #E5E3F8',
    padding: '24px 24px 20px',
    display: 'flex', flexDirection: 'column', gap: 16
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%', background: '#3C3489',
      color: 'white', fontSize: 11, fontWeight: 'bold',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1A1640', letterSpacing: '-0.2px' }}>{title}</h3>
    <div style={{ flex: 1, height: '0.5px', background: '#EEECf8' }} />
  </div>
);

const Grid = ({ cols, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
    {children}
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#4A4870' }}>
      {label}{required && <span style={{ color: '#E24B4A', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ margin: 0, fontSize: 11.5, color: '#9895B5' }}>{hint}</p>}
  </div>
);

const Input = ({ style, ...props }) => (
  <input
    {...props}
    style={{ ...baseInputStyle, ...style }}
    onFocus={e => e.target.style.borderColor = '#3C3489'}
    onBlur={e => e.target.style.borderColor = '#D0CEF0'}
  />
);



const FileUploadBox = ({ name, file, onChange, accept = ".pdf,image/*", uploading = false }) => (
  <label style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '18px 12px', borderRadius: 10, cursor: uploading ? 'wait' : 'pointer',
    border: `1.5px dashed ${file ? '#7F77DD' : '#D0CEF0'}`,
    background: file ? '#EEEDFE' : '#FAFAFA', transition: 'all 0.15s', textAlign: 'center'
  }}>
    {uploading ? (
      <>
        <div style={{
          width: 20, height: 20, border: '2px solid #CECBF6',
          borderTopColor: '#3C3489', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }} />
        <span style={{ fontSize: 12.5, color: '#534AB7', fontWeight: 600 }}>Uploading...</span>
      </>
    ) : (
      <>
        <svg width="20" height="20" fill="none" stroke={file ? '#534AB7' : '#9895B5'} viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span style={{ fontSize: 12.5, color: file ? '#534AB7' : '#9895B5', fontWeight: file ? 600 : 400, wordBreak: 'break-all' }}>
          {file ? file.name : 'Click to upload'}
        </span>
      </>
    )}
    <input type="file" name={name} onChange={onChange} accept={accept} style={{ display: 'none' }} disabled={uploading} />
  </label>
);

export default StudentDashboard;
