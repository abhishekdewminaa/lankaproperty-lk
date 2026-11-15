import { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { userPortalService, PortalRole } from '../services/userPortalService';
import { SRI_LANKA_DISTRICTS } from '../data/locations';

export function AuthPortalPage() {
  const { searchParams, navigate } = useRouter();

  const initialMode = (searchParams.get('mode') as 'login' | 'register') || 'login';
  const initialRole = (searchParams.get('role') as PortalRole) || 'owner';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<PortalRole>(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [packageId, setPackageId] = useState(role === 'agent' ? 'premium-pro' : 'free');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qMode = searchParams.get('mode');
    const qRole = searchParams.get('role');
    if (qMode === 'login' || qMode === 'register') setMode(qMode);
    if (qRole === 'owner' || qRole === 'agent') setRole(qRole);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (mode === 'login') {
      if (!email.trim()) {
        setErrorMessage('Please enter your registered email address.');
        setLoading(false);
        return;
      }
      const res = userPortalService.login(email, role);
      if (res.success && res.user) {
        navigate(res.user.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard');
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Please check your credentials.');
      }
    } else {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        setErrorMessage('Please complete all required fields.');
        setLoading(false);
        return;
      }
      const res = userPortalService.register({
        name,
        email,
        phone,
        whatsapp: phone,
        role,
        agencyName: role === 'agent' ? agencyName : undefined,
        licenseNumber: role === 'agent' ? licenseNumber : undefined,
        packageId,
        district,
      });
      navigate(res.user.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard');
    }
    setLoading(false);
  };

  const handleDemoLogin = (userId: string) => {
    const user = userPortalService.loginDemoUser(userId);
    if (user) {
      navigate(user.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard');
    }
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen py-12 md:py-20 text-[#18251E]">
      <div className="max-w-xl mx-auto px-5">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#5F6B63] mb-6">
          <button onClick={() => navigate('/')} className="hover:text-[#176B45] font-semibold">
            Home
          </button>
          <span>/</span>
          <span className="text-[#103D2C] font-bold">
            {role === 'owner' ? 'Property Owner Portal' : 'Real Estate Agent Portal'}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#DDE5DF] rounded-[2px] p-6 sm:p-10 shadow-sm space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5 border-b border-[#DDE5DF] pb-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45]">
              {role === 'owner' ? 'PROPERTY OWNER DESK' : 'LICENSED AGENT & BROKER DESK'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight">
              {mode === 'login' ? 'Sign In to Your Dashboard' : 'Create Seller / Agent Account'}
            </h1>
            <p className="text-xs text-[#5F6B63]">
              {role === 'owner'
                ? 'Manage your listed homes, view inquiries, and update your pricing.'
                : 'Manage your client portfolio, agency branding, and buyer leads.'}
            </p>
          </div>

          {/* Role Switcher */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-2">
              Select Account Role:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('owner');
                  setPackageId('free');
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer text-center ${
                  role === 'owner'
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                Property Owner
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('agent');
                  setPackageId('premium-pro');
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer text-center ${
                  role === 'agent'
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                Real Estate Agent
              </button>
            </div>
          </div>

          {/* Mode Switcher (Login vs Register) */}
          <div className="flex border-b border-[#DDE5DF]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-[#176B45] text-[#176B45]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-[#176B45] text-[#176B45]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Register New Account
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-[#C93636]/10 border border-[#C93636] text-[#C93636] text-xs font-semibold rounded-[2px]">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Roshan Senanayake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
                />
              </div>
            )}

            {mode === 'register' && role === 'agent' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                    Agency or Brokerage Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo Premier Real Estate"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                    Broker License / Business Reg. No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CEA/COL/2024/089"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="name@domain.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
              />
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                    Primary District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] font-semibold cursor-pointer"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white"
              />
              <span className="text-[10px] text-[#5F6B63] mt-0.5 block">
                (Demo environment: any password is accepted)
              </span>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                  Initial Listing Plan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'free', label: 'Starter Free', price: 'Rs. 0' },
                    { id: 'premium-pro', label: 'Premium Pro', price: 'Rs. 4,500' },
                    { id: 'platinum', label: 'Platinum', price: 'Rs. 25,000' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPackageId(p.id)}
                      className={`p-2 rounded-[2px] border text-left cursor-pointer transition-colors ${
                        packageId === p.id
                          ? 'border-[#176B45] bg-[#E8F3EC] text-[#103D2C] font-bold'
                          : 'border-[#DDE5DF] bg-[#FAFBF9] text-[#18251E]'
                      }`}
                    >
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[11px] text-[#5F6B63]">{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer mt-2"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? `Sign In as ${role === 'owner' ? 'Property Owner' : 'Real Estate Agent'} →`
                : `Complete ${role === 'owner' ? 'Owner' : 'Agent'} Registration →`}
            </button>
          </form>

          {/* 1-Click Fast Demo Accounts Section */}
          <div className="pt-6 border-t border-[#DDE5DF] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] block text-center">
              ⚡ 1-Click Instant Demo Login:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('owner-roshan')}
                className="p-2.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] rounded-[2px] text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-[#103D2C]">Dr. Roshan Senanayake</div>
                <div className="text-[11px] text-[#5F6B63]">Property Owner · Colombo</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('agent-rohan')}
                className="p-2.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] rounded-[2px] text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-[#103D2C]">Rohan Wijesekera</div>
                <div className="text-[11px] text-[#5F6B63]">Colombo Premier Realty (Agent)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
