import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import {
  Building2, BookOpen, GraduationCap, UserPlus, ChevronRight,
  Plus, Trash2, Eye, EyeOff, Users, LayoutDashboard, X, CheckCircle2
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'college',    label: 'College',    icon: Building2 },
  { key: 'branch',     label: 'Branch',     icon: BookOpen },
  { key: 'department', label: 'Department', icon: BookOpen },
  { key: 'course',     label: 'Course',     icon: GraduationCap },
  { key: 'tutor',      label: 'Add Tutor',  icon: UserPlus },
  { key: 'dean',       label: 'Add Dean',   icon: Users },
  { key: 'hod',        label: 'Add HOD',    icon: Users },
];

const useCRUD = (initial = []) => {
  const [items, setItems] = useState(initial);
  const add    = (item) => setItems(p => [...p, { id: Date.now(), ...item }]);
  const remove = (id)   => setItems(p => p.filter(i => i.id !== id));
  return { items, add, remove };
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3489] bg-white disabled:bg-gray-50"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3489] bg-white"
  >
    {children}
  </select>
);

const PrimaryBtn = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="inline-flex items-center gap-2 bg-[#3C3489] hover:bg-[#2d2668] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {loading ? <Spinner /> : <Plus size={15} />}
    {children}
  </button>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ItemRow = ({ label, sub, onDelete }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50">
      <Trash2 size={15} />
    </button>
  </div>
);

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3489] bg-white"
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

// ── OVERVIEW ─────────────────────────────────────────────────────────────────
const OverviewSection = ({ colleges, branches, departments, courses, tutors, deans, hods, setActive }) => {
  const stats = [
    { label: 'Colleges',    value: colleges.length,    icon: Building2,     key: 'college'    },
    { label: 'Branches',    value: branches.length,    icon: BookOpen,      key: 'branch'     },
    { label: 'Departments', value: departments.length, icon: BookOpen,      key: 'department' },
    { label: 'Courses',     value: courses.length,     icon: GraduationCap, key: 'course'     },
    { label: 'Tutors',      value: tutors.length,      icon: UserPlus,      key: 'tutor'      },
    { label: 'Deans',       value: deans.length,       icon: Users,         key: 'dean'       },
    { label: 'HODs',        value: hods.length,        icon: Users,         key: 'hod'        },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Overview</h2>
      <p className="text-sm text-gray-500 mb-6">Poornima University — Admin Control Panel</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, key }) => (
          <button key={key} onClick={() => setActive(key)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:border-[#3C3489] hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-[#EEEDFE] p-2.5 rounded-xl group-hover:bg-[#3C3489] transition">
                <Icon size={18} className="text-[#3C3489] group-hover:text-white transition" />
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-[#3C3489] transition" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── COLLEGE ───────────────────────────────────────────────────────────────────
const CollegeSection = ({ store }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return toast.error('College name required');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.add({ name: name.trim(), code: code.trim() });
    toast.success(`"${name.trim()}" added!`);
    setName(''); setCode('');
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-800">College</h2><p className="text-sm text-gray-500 mt-0.5">Add colleges under Poornima University</p></div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New College</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label required>College Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Poornima College of Engineering" /></div>
          <div><Label>College Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. PCE" /></div>
        </div>
        <PrimaryBtn loading={loading} onClick={handleAdd}>Add College</PrimaryBtn>
      </Card>
      {store.items.length > 0 && (
        <Card><h3 className="text-sm font-semibold text-gray-700 mb-3">Added Colleges ({store.items.length})</h3>
          <div className="space-y-2">{store.items.map(c => <ItemRow key={c.id} label={c.name} sub={c.code || null} onDelete={() => store.remove(c.id)} />)}</div>
        </Card>
      )}
    </div>
  );
};

// ── BRANCH ────────────────────────────────────────────────────────────────────
const BranchSection = ({ store, colleges }) => {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return toast.error('Branch name required');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.add({ name: name.trim(), college });
    toast.success(`"${name.trim()}" branch added!`);
    setName(''); setCollege('');
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-800">Branch</h2><p className="text-sm text-gray-500 mt-0.5">Add branches (e.g. Computer Science, Mechanical)</p></div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New Branch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label required>Branch Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Computer Science & Engineering" /></div>
          <div><Label>Under College</Label><Select value={college} onChange={e => setCollege(e.target.value)}><option value="">Select College</option>{colleges.items.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</Select></div>
        </div>
        <PrimaryBtn loading={loading} onClick={handleAdd}>Add Branch</PrimaryBtn>
      </Card>
      {store.items.length > 0 && (
        <Card><h3 className="text-sm font-semibold text-gray-700 mb-3">Added Branches ({store.items.length})</h3>
          <div className="space-y-2">{store.items.map(b => <ItemRow key={b.id} label={b.name} sub={b.college || null} onDelete={() => store.remove(b.id)} />)}</div>
        </Card>
      )}
    </div>
  );
};

// ── DEPARTMENT ────────────────────────────────────────────────────────────────
const DepartmentSection = ({ store, branches }) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return toast.error('Department name required');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.add({ name: name.trim(), branch });
    toast.success(`"${name.trim()}" department added!`);
    setName(''); setBranch('');
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-800">Department</h2><p className="text-sm text-gray-500 mt-0.5">Add departments within branches</p></div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New Department</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label required>Department Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AI & Machine Learning" /></div>
          <div><Label>Under Branch</Label><Select value={branch} onChange={e => setBranch(e.target.value)}><option value="">Select Branch</option>{branches.items.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</Select></div>
        </div>
        <PrimaryBtn loading={loading} onClick={handleAdd}>Add Department</PrimaryBtn>
      </Card>
      {store.items.length > 0 && (
        <Card><h3 className="text-sm font-semibold text-gray-700 mb-3">Added Departments ({store.items.length})</h3>
          <div className="space-y-2">{store.items.map(d => <ItemRow key={d.id} label={d.name} sub={d.branch || null} onDelete={() => store.remove(d.id)} />)}</div>
        </Card>
      )}
    </div>
  );
};

// ── COURSE ────────────────────────────────────────────────────────────────────
const CourseSection = ({ store, departments }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [dept, setDept] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return toast.error('Course name required');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.add({ name: name.trim(), code: code.trim(), dept, duration });
    toast.success(`"${name.trim()}" course added!`);
    setName(''); setCode(''); setDept(''); setDuration('');
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-800">Course</h2><p className="text-sm text-gray-500 mt-0.5">Add courses offered in departments</p></div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New Course</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label required>Course Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. B.Tech AIML" /></div>
          <div><Label>Course Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. BTAIML" /></div>
          <div><Label>Department</Label><Select value={dept} onChange={e => setDept(e.target.value)}><option value="">Select Department</option>{departments.items.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</Select></div>
          <div><Label>Duration</Label><Select value={duration} onChange={e => setDuration(e.target.value)}><option value="">Select Duration</option>{['1 Year','2 Years','3 Years','4 Years','5 Years'].map(d => <option key={d} value={d}>{d}</option>)}</Select></div>
        </div>
        <PrimaryBtn loading={loading} onClick={handleAdd}>Add Course</PrimaryBtn>
      </Card>
      {store.items.length > 0 && (
        <Card><h3 className="text-sm font-semibold text-gray-700 mb-3">Added Courses ({store.items.length})</h3>
          <div className="space-y-2">{store.items.map(c => <ItemRow key={c.id} label={`${c.name}${c.code ? ` (${c.code})` : ''}`} sub={[c.dept, c.duration].filter(Boolean).join(' • ') || null} onDelete={() => store.remove(c.id)} />)}</div>
        </Card>
      )}
    </div>
  );
};

// ── STAFF FORM (Tutor / Dean / HOD) ──────────────────────────────────────────
const StaffSection = ({ title, subtitle, roleName, store, departments, branches }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', employeeId: '', dept: '', branch: '' });
  const [loading, setLoading] = useState(false);
  const F = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  const handleAdd = async () => {
    if (!form.name.trim())  return toast.error('Name required');
    if (!form.email.trim()) return toast.error('Email required');
    if (!form.password)     return toast.error('Password required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6)       return toast.error('Password must be at least 6 characters');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    store.add({ name: form.name.trim(), email: form.email.trim(), employeeId: form.employeeId, dept: form.dept, branch: form.branch });
    toast.success(`${roleName} "${form.name.trim()}" added!`);
    setForm({ name: '', email: '', password: '', confirm: '', employeeId: '', dept: '', branch: '' });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-800">{title}</h2><p className="text-sm text-gray-500 mt-0.5">{subtitle}</p></div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add {roleName} Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label required>{roleName} Name</Label><Input {...F('name')} placeholder={`Full name of ${roleName.toLowerCase()}`} /></div>
          <div><Label>Employee ID</Label><Input {...F('employeeId')} placeholder="e.g. PU-2024-001" /></div>
          <div className="md:col-span-2"><Label required>Email</Label><Input {...F('email')} type="email" placeholder="university email address" /></div>
          {branches && <div><Label>Branch</Label><Select {...F('branch')}><option value="">Select Branch</option>{branches.items.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</Select></div>}
          {departments && <div><Label>Department</Label><Select {...F('dept')}><option value="">Select Department</option>{departments.items.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</Select></div>}
          <div><Label required>Password</Label><PasswordInput value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 6 characters" /></div>
          <div><Label required>Confirm Password</Label><PasswordInput value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter password" /></div>
        </div>
        {form.password && form.confirm && (
          <div className={`flex items-center gap-1.5 text-xs mb-4 font-medium ${form.password === form.confirm ? 'text-green-600' : 'text-red-500'}`}>
            {form.password === form.confirm ? <><CheckCircle2 size={13} /> Passwords match</> : <><X size={13} /> Passwords do not match</>}
          </div>
        )}
        <PrimaryBtn loading={loading} onClick={handleAdd}>Add {roleName}</PrimaryBtn>
      </Card>
      {store.items.length > 0 && (
        <Card><h3 className="text-sm font-semibold text-gray-700 mb-3">{roleName}s Added ({store.items.length})</h3>
          <div className="space-y-2">{store.items.map(s => <ItemRow key={s.id} label={s.name} sub={[s.email, s.dept || s.branch].filter(Boolean).join(' • ') || null} onDelete={() => store.remove(s.id)} />)}</div>
        </Card>
      )}
    </div>
  );
};

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const PuamdinDashboard = () => {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const colleges    = useCRUD();
  const branches    = useCRUD();
  const departments = useCRUD();
  const courses     = useCRUD();
  const tutors      = useCRUD();
  const deans       = useCRUD();
  const hods        = useCRUD();

  const renderSection = () => {
    switch (active) {
      case 'overview':   return <OverviewSection {...{ colleges, branches, departments, courses, tutors, deans, hods, setActive }} />;
      case 'college':    return <CollegeSection store={colleges} />;
      case 'branch':     return <BranchSection store={branches} colleges={colleges} />;
      case 'department': return <DepartmentSection store={departments} branches={branches} />;
      case 'course':     return <CourseSection store={courses} departments={departments} />;
      case 'tutor':      return <StaffSection title="Add Tutor" subtitle="Register tutors for S18 form approval" roleName="Tutor" store={tutors} departments={departments} branches={branches} />;
      case 'dean':       return <StaffSection title="Add Dean" subtitle="Register deans for institutional oversight" roleName="Dean" store={deans} branches={branches} departments={null} />;
      case 'hod':        return <StaffSection title="Add HOD" subtitle="Register Heads of Department" roleName="HOD" store={hods} departments={departments} branches={branches} />;
      default:           return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-right" />

      <div className="flex">
        {/* ── SIDEBAR — bg-gray-50 matches main content ── */}
        <aside
          className={`${sidebarOpen ? 'w-56' : 'w-16'} transition-all duration-200 shrink-0 bg-gray-50 border-r border-gray-200 min-h-[calc(100vh-64px)] flex flex-col pt-4`}
        >
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="mx-auto mb-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <ChevronRight size={16} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>

          <nav className="space-y-1 px-2">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${active === key
                    ? 'bg-[#3C3489] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-6 py-8 max-w-4xl">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <span>PU Admin</span>
            <ChevronRight size={12} />
            <span className="text-[#3C3489] font-medium capitalize">
              {NAV_ITEMS.find(n => n.key === active)?.label || active}
            </span>
          </div>
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default PuamdinDashboard;
