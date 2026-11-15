import React, { useState } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminRole } from '../types/admin';
import { superAdminSecurityService } from '../../services/superAdminSecurityService';
import {
  LayoutDashboard,
  Building,
  PlusCircle,
  Home,
  Layers,
  Building2,
  Inbox,
  CalendarDays,
  Users,
  CreditCard,
  FileText,
  Image,
  BarChart3,
  Settings,
  ShieldAlert,
  ExternalLink,
  Bell,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  Activity,
  Compass,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { navigate } = useRouter();
  const { currentUser, currentRole, switchRole, hasPermission } = useAdminAuth();
  const { inquiries, properties } = useAdminData();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Collapsible sidebar state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lankaproperty_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lankaproperty_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Derived real events for notifications
  const pendingReviewCount = properties.filter((p) => p.publicationStatus === 'pending_review').length;
  const newInquiriesCount = inquiries.filter((inq) => inq.stage === 'new').length;
  const totalAlerts = pendingReviewCount + newInquiriesCount;

  // Breadcrumbs builder
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = '/' + pathParts.slice(0, index + 1).join('/');
    const label =
      part === 'admin'
        ? 'Superadmin'
        : part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
    return { label, url, isLast: index === pathParts.length - 1 };
  });

  // Categorized Sidebar: Daily Major Core at the very top
  const navigationSections = [
    {
      label: 'Daily Workflows',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          permission: true,
        },
        {
          label: 'Property Inventory',
          href: '/admin/properties',
          icon: Building,
          badge: pendingReviewCount > 0 ? `${pendingReviewCount} review` : undefined,
          badgeColor: 'bg-[#C93636] text-white',
          permission: hasPermission('canViewListings'),
        },
        {
          label: 'Add New Property',
          href: '/admin/properties/new',
          icon: PlusCircle,
          permission: hasPermission('canCreateListings'),
        },
        {
          label: 'Wanted Buyer Demands',
          href: '/admin/wanted',
          icon: Inbox,
          badge: 'Demands',
          badgeColor: 'bg-[#176B45] text-white',
          permission: hasPermission('canManageInquiries'),
        },
        {
          label: 'Inquiries & CRM Leads',
          href: '/admin/inquiries',
          icon: Inbox,
          badge: newInquiriesCount > 0 ? `${newInquiriesCount} new` : undefined,
          badgeColor: 'bg-[#176B45] text-white',
          permission: hasPermission('canManageInquiries'),
        },
        {
          label: 'Viewing Appointments',
          href: '/admin/viewings',
          icon: CalendarDays,
          permission: hasPermission('canScheduleViewings'),
        },
      ],
    },
    {
      label: 'Sellers & Agencies',
      items: [
        {
          label: 'User & Agent Activity',
          href: '/admin/user-activity',
          icon: Activity,
          permission: hasPermission('canManageUsers'),
        },
        {
          label: 'Owners & Agents Directory',
          href: '/admin/users',
          icon: Users,
          permission: hasPermission('canManageUsers'),
        },
      ],
    },
    {
      label: 'Monetization & Plans',
      items: [
        {
          label: 'Advertised Packages',
          href: '/admin/packages',
          icon: Tag,
          permission: hasPermission('canManageBilling'),
        },
        {
          label: 'Plans & Subscriptions',
          href: '/admin/billing',
          icon: CreditCard,
          permission: hasPermission('canManageBilling'),
        },
      ],
    },
    {
      label: 'Content, Hubs & SEO',
      items: [
        {
          label: 'Homepage & Hero',
          href: '/admin/homepage',
          icon: Home,
          permission: hasPermission('canManageHomepage'),
        },
        {
          label: 'Curated Collections',
          href: '/admin/collections',
          icon: Layers,
          permission: hasPermission('canManageCollections'),
        },
        {
          label: 'New Developments',
          href: '/admin/developments',
          icon: Building2,
          permission: hasPermission('canViewListings'),
        },
        {
          label: '25 Districts SEO Hubs',
          href: '/admin/districts-seo',
          icon: Compass,
          permission: hasPermission('canManageContentSeo'),
        },
      ],
    },
    {
      label: 'Security & Operations',
      items: [
        {
          label: 'Security Vault & Audit Log',
          href: '/admin/audit',
          icon: ShieldAlert,
          permission: hasPermission('canViewAudit'),
        },
        {
          label: 'Marketplace Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          permission: hasPermission('canViewAnalytics'),
        },
        {
          label: 'Media & WebP Storage',
          href: '/admin/media',
          icon: Image,
          permission: hasPermission('canManageMedia'),
        },
      ],
    },
  ];

  const handleNav = (href: string) => {
    navigate(href);
    setMobileSidebarOpen(false);
  };

  const roleLabels: Record<AdminRole, string> = {
    super_admin: 'Superadmin (Full Access)',
    listing_manager: 'Listing Manager',
    sales_manager: 'Sales & Inquiries Manager',
    marketing_manager: 'Marketing & Editorial',
    finance_manager: 'Finance & Billing',
    readonly_analyst: 'Read-only Analyst',
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#18251E] flex flex-col font-sans">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DDE5DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5] rounded-[3px]"
            aria-label="Toggle navigation drawer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo / Brand Wordmark */}
          <button
            onClick={() => handleNav('/admin')}
            className="flex items-center gap-2 text-left"
          >
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#103D2C]">
              Lanka<span className="text-[#176B45]">Property</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#103D2C] text-[#E8F3EC] px-2 py-0.5 rounded-[2px]">
              Superadmin
            </span>
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 ml-4 text-xs text-[#5F6B63]">
            <span>/</span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.url}>
                {crumb.isLast ? (
                  <span className="font-bold text-[#18251E]">{crumb.label}</span>
                ) : (
                  <>
                    <button
                      onClick={() => handleNav(crumb.url)}
                      className="hover:text-[#176B45] transition-colors"
                    >
                      {crumb.label}
                    </button>
                    <span>/</span>
                  </>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Top Bar Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Public Website */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5F6B63] hover:text-[#176B45] hover:bg-[#F5F8F5] rounded-[3px] border border-[#DDE5DF] transition-colors"
            title="Return to the live public marketplace"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Quick Add Property Button */}
          {hasPermission('canCreateListings') && (
            <button
              onClick={() => handleNav('/admin/properties/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Property</span>
            </button>
          )}

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5] rounded-[3px] transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C93636] rounded-[2px] ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DDE5DF] rounded-[4px] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-[#DDE5DF] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18251E] uppercase tracking-wider">
                    Operational Alerts
                  </span>
                  <span className="text-[11px] font-bold text-[#176B45] bg-[#E8F3EC] px-2 py-0.5 rounded-[2px]">
                    {totalAlerts} Active
                  </span>
                </div>

                <div className="divide-y divide-[#DDE5DF] max-h-72 overflow-y-auto">
                  {pendingReviewCount > 0 && (
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        handleNav('/admin/properties?status=pending_review');
                      }}
                      className="w-full text-left p-3 hover:bg-[#F5F8F5] transition-colors flex items-start gap-2.5"
                    >
                      <Clock className="w-4 h-4 text-[#C93636] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#18251E]">
                          {pendingReviewCount} Listing{pendingReviewCount > 1 ? 's' : ''} Awaiting Editorial Approval
                        </p>
                        <p className="text-[11px] text-[#5F6B63] mt-0.5">
                          Review title, price unit, and photos before publishing.
                        </p>
                      </div>
                    </button>
                  )}

                  {newInquiriesCount > 0 && (
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        handleNav('/admin/inquiries?stage=new');
                      }}
                      className="w-full text-left p-3 hover:bg-[#F5F8F5] transition-colors flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#18251E]">
                          {newInquiriesCount} New Unassigned Inquir{newInquiriesCount > 1 ? 'ies' : 'y'}
                        </p>
                        <p className="text-[11px] text-[#5F6B63] mt-0.5">
                          Assign leads to brokers for 2-hour response SLA.
                        </p>
                      </div>
                    </button>
                  )}

                  {totalAlerts === 0 && (
                    <div className="p-4 text-center text-xs text-[#5F6B63]">
                      All queues are clear. No pending items requiring attention.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 text-left border border-[#DDE5DF] hover:border-[#176B45] rounded-[3px] transition-colors"
            >
              <div className="w-7 h-7 rounded-[2px] bg-[#103D2C] text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-xs">
                <span className="font-bold text-[#18251E] block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-[#176B45] uppercase font-bold tracking-wider block">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6B63]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#DDE5DF] rounded-[4px] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-[#DDE5DF]">
                  <p className="text-xs font-bold text-[#18251E]">{currentUser.name}</p>
                  <p className="text-[11px] text-[#5F6B63] truncate">{currentUser.email}</p>
                  <p className="text-[10px] font-semibold text-[#176B45] mt-0.5">{currentUser.title}</p>
                </div>

                {/* Role Switcher for Evaluation */}
                <div className="p-2 border-b border-[#DDE5DF] bg-[#F5F8F5]/60">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#5F6B63] px-2 mb-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#176B45]" />
                    <span>Switch Role (RBAC Demo)</span>
                  </div>
                  {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs font-semibold flex items-center justify-between transition-colors ${
                        currentRole === role
                          ? 'bg-[#176B45] text-white font-bold'
                          : 'text-[#18251E] hover:bg-white'
                      }`}
                    >
                      <span>{roleLabels[role]}</span>
                      {currentRole === role && <span className="text-[10px] uppercase tracking-wider">Active</span>}
                    </button>
                  ))}
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      superAdminSecurityService.logout();
                      navigate('/');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#C93636] hover:bg-[#F5F8F5] rounded-[2px] font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Console & Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE BODY: DESKTOP SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR (Collapsible: 260px expanded, 72px collapsed) */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-[#DDE5DF] transition-[width] duration-200 overflow-y-auto ${
            isCollapsed ? 'w-[72px]' : 'w-[260px]'
          }`}
        >
          {/* Collapse/Expand Toggle Header */}
          <div className={`p-3 border-b border-[#DDE5DF] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63]">
                Navigation Menu
              </span>
            )}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-[#5F6B63] hover:text-[#103D2C] hover:bg-[#F5F8F5] rounded-[3px] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar (Ctrl + B)' : 'Minimize sidebar to icons (More space)'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#176B45]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[#5F6B63]" />
              )}
            </button>
          </div>

          <div className="p-3 flex-1 space-y-5">
            {navigationSections.map((sec, secIdx) => {
              const visibleItems = sec.items.filter((item) => item.permission);
              if (visibleItems.length === 0) return null;

              return (
                <div key={sec.label} className="space-y-1">
                  {!isCollapsed ? (
                    <p className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-[#5F6B63]/80">
                      {sec.label}
                    </p>
                  ) : (
                    secIdx > 0 && <div className="h-px bg-[#DDE5DF]/70 my-2" />
                  )}

                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive =
                        item.href === '/admin'
                          ? currentPath === '/admin'
                          : currentPath.startsWith(item.href);

                      const Icon = item.icon;

                      return (
                        <div key={item.href} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleNav(item.href)}
                            className={`w-full flex items-center ${
                              isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                            } text-xs font-semibold rounded-[3px] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#176B45] ${
                              isActive
                                ? 'bg-[#E8F3EC] text-[#103D2C] font-bold border-l-2 border-[#176B45]'
                                : 'text-[#18251E] hover:bg-[#F5F8F5] hover:text-[#176B45]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="relative">
                                <Icon
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? 'text-[#176B45]' : 'text-[#5F6B63]'
                                  }`}
                                />
                                {isCollapsed && item.badge && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C93636] ring-2 ring-white" />
                                )}
                              </div>
                              {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </div>

                            {!isCollapsed && item.badge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] uppercase ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* Hover Tooltip when Sidebar is Collapsed */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#103D2C] text-white text-[11px] font-bold rounded-[2px] shadow-lg pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="ml-1.5 px-1.5 py-0.2 bg-[#C93636] text-white text-[9px] rounded-[1px]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-[#DDE5DF] bg-[#F5F8F5]/60 text-[11px] text-[#5F6B63] space-y-1">
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between font-semibold">
                  <span>Environment</span>
                  <span className="text-[#176B45] font-bold">Production Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Timezone</span>
                  <span className="font-semibold text-[#18251E]">Asia/Colombo</span>
                </div>
              </>
            ) : (
              <div className="text-center" title="Environment: Production Ready (Asia/Colombo)">
                <span className="w-2 h-2 rounded-full bg-[#176B45] inline-block"></span>
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
              <div className="p-4 border-b border-[#DDE5DF] flex items-center justify-between">
                <span className="font-bold text-[#103D2C] text-sm uppercase tracking-wider">
                  Admin Navigation
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-[#5F6B63] hover:text-[#18251E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 space-y-6">
                {navigationSections.map((sec) => (
                  <div key={sec.label} className="space-y-1">
                    <p className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-[#5F6B63]">
                      {sec.label}
                    </p>
                    <div className="space-y-0.5">
                      {sec.items
                        .filter((item) => item.permission)
                        .map((item) => {
                          const isActive =
                            item.href === '/admin'
                              ? currentPath === '/admin'
                              : currentPath.startsWith(item.href);
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.href}
                              onClick={() => handleNav(item.href)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-[3px] ${
                                isActive
                                  ? 'bg-[#E8F3EC] text-[#103D2C] font-bold border-l-2 border-[#176B45]'
                                  : 'text-[#18251E] hover:bg-[#F5F8F5]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-[#5F6B63]" />
                                <span>{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`text-[10px] font-bold px-1.5 rounded-[2px] ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1360px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
